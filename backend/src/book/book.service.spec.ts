jest.mock('../user/user.entity', () => ({
  User: class User {},
}));

jest.mock('src/utils/code-generator', () => ({
  generateCode: jest.fn(() => 'BK-ABCD-1234'),
}), { virtual: true });

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Book } from './book.entity';
import { BookService } from './book.service';
import { CreateBookDto } from './createBook.dto';
import { UpdateBookDto } from './updateBook.dto';
import { User } from '../user/user.entity';
import { generateCode } from 'src/utils/code-generator';

describe('BookService', () => {
  let service: BookService;
  let bookRepository: jest.Mocked<Partial<Repository<Book>>>;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

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
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: getRepositoryToken(Book),
          useValue: bookRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
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
    it('should return all books', async () => {
      bookRepository.find!.mockResolvedValue([buildBook()]);
      await expect(service.findAll()).resolves.toHaveLength(1);
    });

    it('should return empty array when no books exist', async () => {
      bookRepository.find!.mockResolvedValue([]);
      await expect(service.findAll()).resolves.toEqual([]);
    });

    it('should handle repository errors', async () => {
      bookRepository.find!.mockRejectedValue(new Error('db crash'));
      await expect(service.findAll()).rejects.toThrow();
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
      const final = buildBook({ bookCode: 'BK001', ...dto });

      bookRepository.findOne!.mockResolvedValue(null);
      bookRepository.create!.mockReturnValue(created);
      bookRepository
        .save!.mockResolvedValueOnce(created)
        .mockResolvedValueOnce(final);

      await expect(service.create(dto)).resolves.toEqual(final);
      expect(bookRepository.findOne).toHaveBeenCalledWith({
        where: { ISBN: dto.ISBN },
      });
      expect(bookRepository.create).toHaveBeenCalledWith(dto);
      expect(generateCode).toHaveBeenCalledWith('BK-XXXX-####');
      expect(bookRepository.save).toHaveBeenNthCalledWith(1, created);
      expect(bookRepository.save).toHaveBeenNthCalledWith(2, {
        ...created,
        bookCode: 'BK001',
      });
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

      bookRepository.findOne!.mockResolvedValue(existing);
      bookRepository.save!.mockImplementation(async (b) => b as Book);

      await expect(service.update(1, update)).resolves.toEqual({
        ...existing,
        ...update,
      });
    });

    it('should only update provided fields', async () => {
      const existing = buildBook({
        name: 'Old',
        status: 'AVAILABLE',
      });

      bookRepository.findOne!.mockResolvedValue(existing);
      bookRepository.save!.mockImplementation(async (b) => b as Book);

      const result = await service.update(1, { name: 'New' });

      expect(result.name).toBe('New');
      expect(result.status).toBe('AVAILABLE');
    });

    it('should throw if book not found', async () => {
      bookRepository.findOne!.mockResolvedValue(null);

      await expect(service.update(99, { name: 'x' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle save failure', async () => {
      const existing = buildBook();

      bookRepository.findOne!.mockResolvedValue(existing);
      bookRepository.save!.mockRejectedValue(new Error('update fail'));

      await expect(service.update(1, { name: 'x' })).rejects.toThrow();
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
