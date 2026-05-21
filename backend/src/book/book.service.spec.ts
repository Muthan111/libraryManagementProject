jest.mock(
  'src/utils/code-generator',
  () => ({
    generateCode: jest.fn(() => 'BK-ABCD-1234'),
  }),
  { virtual: true },
);

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository, DataSource } from 'typeorm';
import { Book } from './book.entity';
import { BookService } from './book.service';
import { CreateBookDto } from './createBook.dto';
import { UpdateBookDto } from './updateBook.dto';
import { generateCode } from 'src/utils/code-generator';

describe('BookService', () => {
  let service: BookService;
  let bookRepository: jest.Mocked<Partial<Repository<Book>>>;
  let dataSource: jest.Mocked<Partial<DataSource>>;

  const buildBook = (overrides: Partial<Book> = {}): Book =>
    ({
      bookid: 1,
      bookCode: 'BK001',
      name: 'Clean Code',
      Author: 'Robert C. Martin',
      ISBN: '9780132350884',
      status: 'AVAILABLE',
      borrowedById: null,
      borrowRecords: [],
      ...overrides,
    }) as Book;

  beforeEach(async () => {
    bookRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    };

    dataSource = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: any) =>
          cb({ getRepository: () => bookRepository }),
        ),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: getRepositoryToken(Book),
          useValue: bookRepository,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<BookService>(BookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ---------------- FIND ALL ----------------
  describe('findAll', () => {
    it('should return paginated books', async () => {
      const books = [buildBook()];
      bookRepository.findAndCount!.mockResolvedValue([books, 1]);

      await expect(service.findAll(1, 10)).resolves.toEqual({
        data: books,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });
    });

    it('should return an empty page when no books exist', async () => {
      bookRepository.findAndCount!.mockResolvedValue([[], 0]);

      await expect(service.findAll(1, 10)).resolves.toEqual({
        data: [],
        meta: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      });
    });

    it('should handle repository errors', async () => {
      bookRepository.findAndCount!.mockRejectedValue(new Error('db crash'));
      await expect(service.findAll()).rejects.toThrow();
    });

    it('should normalize invalid pagination values', async () => {
      bookRepository.findAndCount!.mockResolvedValue([[buildBook()], 1]);

      await service.findAll(0, 500);

      expect(bookRepository.findAndCount).toHaveBeenCalledWith({
        skip: 0,
        take: 100,
      });
    });
  });

  // ---------------- CREATE ----------------
  describe('create', () => {
    it('should create book successfully', async () => {
      const dto: CreateBookDto = {
        name: 'DDD',
        Author: 'Eric Evans',
        ISBN: '123',
        status: 'AVAILABLE',
      };

      const created = buildBook({ ...dto, bookCode: 'BK-ABCD-1234' });

      bookRepository.findOne!.mockResolvedValue(null);
      bookRepository.create!.mockReturnValue(created);
      bookRepository.save!.mockResolvedValue(created);

      await expect(service.create(dto)).resolves.toEqual(created);
      expect(bookRepository.findOne).toHaveBeenCalledWith({
        where: { ISBN: dto.ISBN },
      });
      expect(bookRepository.create).toHaveBeenCalledWith(dto);
      expect(generateCode).toHaveBeenCalledWith('BK-XXXX-####');
      expect(bookRepository.save).toHaveBeenCalledWith(created);
    });

    it('should throw on duplicate ISBN', async () => {
      const existing = buildBook();

      bookRepository.findOne!.mockResolvedValue(existing);

      await expect(
        service.create({
          name: 'x',
          Author: 'y',
          ISBN: existing.ISBN,
          status: 'AVAILABLE',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should handle save failure', async () => {
      bookRepository.findOne!.mockResolvedValue(null);
      bookRepository.create!.mockReturnValue({} as any);
      bookRepository.save!.mockRejectedValue(new Error('save fail'));

      await expect(
        service.create({
          name: 'x',
          Author: 'y',
          ISBN: '999',
          status: 'AVAILABLE',
        }),
      ).rejects.toThrow();
    });
  });

  // ---------------- UPDATE ----------------
  describe('update', () => {
    it('should update book successfully', async () => {
      const existing = buildBook();
      const update: UpdateBookDto = { name: 'New Name' };

      bookRepository
        .findOne!.mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({
          ...existing,
          ...update,
        } as Book);
      (bookRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      await expect(service.update(existing.bookCode, update)).resolves.toEqual({
        ...existing,
        ...update,
      });
    });

    it('should only update provided fields', async () => {
      const existing = buildBook({
        name: 'Old',
        status: 'AVAILABLE',
      });

      bookRepository
        .findOne!.mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({
          ...existing,
          name: 'New',
        } as Book);
      (bookRepository.update as jest.Mock).mockResolvedValue({ affected: 1 });

      const result = await service.update(existing.bookCode, { name: 'New' });

      expect(result.name).toBe('New');
      expect(result.status).toBe('AVAILABLE');
    });

    it('should throw if book not found', async () => {
      bookRepository.findOne!.mockResolvedValue(null);
      (bookRepository.update as jest.Mock).mockResolvedValue({ affected: 0 });

      await expect(service.update('NONEXIST', { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle save failure', async () => {
      const existing = buildBook();
      bookRepository.findOne!.mockResolvedValue(existing);
      (bookRepository.update as jest.Mock).mockRejectedValue(
        new Error('update fail'),
      );

      await expect(
        service.update(existing.bookCode, { name: 'x' }),
      ).rejects.toThrow();
    });
  });

  // ---------------- DELETE ----------------
  describe('delete', () => {
    it('should delete successfully', async () => {
      bookRepository.delete!.mockResolvedValue({ affected: 1 } as DeleteResult);

      await expect(service.delete(1)).resolves.toEqual({
        message: 'Book with id 1 deleted successfully',
      });
    });

    it('should throw if not found', async () => {
      bookRepository.delete!.mockResolvedValue({ affected: 0 } as DeleteResult);

      await expect(service.delete(1)).rejects.toThrow(NotFoundException);
    });

    it('should handle repository crash', async () => {
      bookRepository.delete!.mockRejectedValue(new Error('db error'));

      await expect(service.delete(1)).rejects.toThrow();
    });
  });

  // ---------------- FIND BY NAME ----------------
  describe('findBookByName', () => {
    it('should return book', async () => {
      const book = buildBook({ name: 'Refactoring' });

      bookRepository.findOne!.mockResolvedValue(book);

      await expect(service.findBookByName('Refactoring')).resolves.toEqual(
        book,
      );
    });

    it('should return null', async () => {
      bookRepository.findOne!.mockResolvedValue(null);

      await expect(service.findBookByName('x')).resolves.toBeNull();
    });

    it('should throw not found exception on repository error', async () => {
      bookRepository.findOne!.mockRejectedValue(new Error('lookup failed'));

      await expect(service.findBookByName('x')).rejects.toThrow(
        new NotFoundException('Error finding book by name'),
      );
    });
  });

  // ---------------- FIND BY ISBN ----------------
  describe('findBookByISBN', () => {
    it('should return book', async () => {
      const book = buildBook({ ISBN: '123' });

      bookRepository.findOne!.mockResolvedValue(book);

      await expect(service.findBookByISBN('123')).resolves.toEqual(book);
    });

    it('should return null', async () => {
      bookRepository.findOne!.mockResolvedValue(null);

      await expect(service.findBookByISBN('x')).resolves.toBeNull();
    });

    it('should throw not found exception on repository error', async () => {
      bookRepository.findOne!.mockRejectedValue(new Error('lookup failed'));

      await expect(service.findBookByISBN('x')).rejects.toThrow(
        new NotFoundException('Error finding book by ISBN'),
      );
    });
  });

  // ---------------- FIND BY AUTHOR ----------------
  describe('findBookByAuthor', () => {
    it('should return book', async () => {
      const book = buildBook({ Author: 'Martin Fowler' });

      bookRepository.findOne!.mockResolvedValue(book);

      await expect(service.findBookByAuthor('Martin Fowler')).resolves.toEqual(
        book,
      );
    });

    it('should return null', async () => {
      bookRepository.findOne!.mockResolvedValue(null);

      await expect(service.findBookByAuthor('x')).resolves.toBeNull();
    });

    it('should throw not found exception on repository error', async () => {
      bookRepository.findOne!.mockRejectedValue(new Error('lookup failed'));

      await expect(service.findBookByAuthor('x')).rejects.toThrow(
        new NotFoundException('Error finding book by author'),
      );
    });
  });
});
