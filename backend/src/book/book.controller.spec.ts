jest.mock(
  'src/book/book.entity',
  () => ({
    Book: class Book {},
  }),
  { virtual: true },
);

jest.mock(
  'src/utils/code-generator',
  () => ({
    generateCode: jest.fn(() => 'BK-ABCD-1234'),
  }),
  { virtual: true },
);

import { Test, TestingModule } from '@nestjs/testing';
import { BookController } from './book.controller';
import { BookService } from './book.service';
import { CreateBookDto } from './createBook.dto';
import { UpdateBookDto } from './updateBook.dto';

describe('BookController', () => {
  let controller: BookController;
  let service: {
    findAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    findBookByName: jest.Mock;
    findBookByCode: jest.Mock;
    findBookByISBN: jest.Mock;
    findBookByAuthor: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findBookByName: jest.fn(),
      findBookByCode: jest.fn(),
      findBookByISBN: jest.fn(),
      findBookByAuthor: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookController],
      providers: [
        {
          provide: BookService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<BookController>(BookController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ---------------- FIND ALL ----------------
  describe('findAllBooks', () => {
    it('should return paginated books from the service', async () => {
      const books = {
        data: [{ bookid: 1, name: 'Clean Architecture' }],
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      };
      service.findAll.mockResolvedValue(books);

      await expect(controller.findAllBooks()).resolves.toEqual(books);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(service.findAll).toHaveBeenCalledWith(1, 10);
    });

    it('should pass pagination query params to the service', async () => {
      service.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAllBooks('2', '5');

      expect(service.findAll).toHaveBeenCalledWith(2, 5);
    });

    it('should propagate service errors', async () => {
      service.findAll.mockRejectedValue(new Error('DB failure'));

      await expect(controller.findAllBooks()).rejects.toThrow('DB failure');
    });
  });

  // ---------------- CREATE ----------------
  describe('createBook', () => {
    it('should pass dto to service', async () => {
      const dto: CreateBookDto = {
        name: 'Legacy Code',
        Author: 'Michael Feathers',
        ISBN: '123',
        status: 'AVAILABLE',
      };

      const created = { bookid: 1, ...dto };
      service.create.mockResolvedValue(created);

      await expect(controller.createBook(dto)).resolves.toEqual(created);
      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should propagate service errors', async () => {
      service.create.mockRejectedValue(new Error('Create failed'));

      await expect(controller.createBook({} as any)).rejects.toThrow(
        'Create failed',
      );
    });
  });

  // ---------------- UPDATE ----------------
  describe('updateBook', () => {
    it('should forward bookCode string to service', async () => {
      const dto: UpdateBookDto = { name: 'Updated', status: 'BORROWED' };
      const updated = { bookid: 3, ...dto };

      service.update.mockResolvedValue(updated);

      await expect(controller.updateBook('BK001', dto)).resolves.toEqual(
        updated,
      );
      expect(service.update).toHaveBeenCalledWith('BK001', dto);
    });

    it('should handle empty update DTO', async () => {
      service.update.mockResolvedValue({ message: 'ok' });

      await expect(controller.updateBook('BK001', {} as any)).resolves.toEqual({
        message: 'ok',
      });
    });

    it('should propagate service errors', async () => {
      service.update.mockRejectedValue(new Error('Update failed'));

      await expect(controller.updateBook('BK001', {} as any)).rejects.toThrow(
        'Update failed',
      );
    });
  });

  // ---------------- DELETE ----------------
  describe('deleteBook', () => {
    it('should delete by numeric id', async () => {
      service.delete.mockResolvedValue({ ok: true });

      await expect(controller.deleteBook('6')).resolves.toEqual({ ok: true });
      expect(service.delete).toHaveBeenCalledWith(6);
    });

    it('should handle invalid id', async () => {
      service.delete.mockResolvedValue({ ok: true });

      await controller.deleteBook('bad-id');
      expect(service.delete.mock.calls[0][0]).toBeNaN();
    });

    it('should propagate service errors', async () => {
      service.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(controller.deleteBook('1')).rejects.toThrow('Delete failed');
    });
  });

  // ---------------- FIND BY NAME ----------------
  describe('findBookByName', () => {
    it('should return book by name', async () => {
      const book = { bookid: 1, name: 'Refactoring' };
      service.findBookByName.mockResolvedValue(book);

      await expect(controller.findBookByName('Refactoring')).resolves.toEqual(
        book,
      );
    });

    it('should return null if not found', async () => {
      service.findBookByName.mockResolvedValue(null);

      await expect(controller.findBookByName('unknown')).resolves.toBeNull();
    });

    it('should propagate errors', async () => {
      service.findBookByName.mockRejectedValue(new Error('fail'));

      await expect(controller.findBookByName('x')).rejects.toThrow('fail');
    });
  });

  // ---------------- FIND BY ISBN ----------------
  describe('findBookByISBN', () => {
    it('should return book by ISBN', async () => {
      const book = { bookid: 2, ISBN: '123' };
      service.findBookByISBN.mockResolvedValue(book);

      await expect(controller.findBookByISBN('123')).resolves.toEqual(book);
    });

    it('should return null if not found', async () => {
      service.findBookByISBN.mockResolvedValue(null);

      await expect(controller.findBookByISBN('unknown')).resolves.toBeNull();
    });

    it('should propagate errors', async () => {
      service.findBookByISBN.mockRejectedValue(new Error('fail'));

      await expect(controller.findBookByISBN('x')).rejects.toThrow('fail');
    });
  });

  // ---------------- FIND BY AUTHOR ----------------
  describe('findBookByAuthor', () => {
    it('should return book by author', async () => {
      const book = { bookid: 3, Author: 'Robert C. Martin' };
      service.findBookByAuthor.mockResolvedValue(book);

      await expect(
        controller.findBookByAuthor('Robert C. Martin'),
      ).resolves.toEqual(book);
    });

    it('should return null if not found', async () => {
      service.findBookByAuthor.mockResolvedValue(null);

      await expect(controller.findBookByAuthor('unknown')).resolves.toBeNull();
    });

    it('should propagate errors', async () => {
      service.findBookByAuthor.mockRejectedValue(new Error('fail'));

      await expect(controller.findBookByAuthor('x')).rejects.toThrow('fail');
    });
  });

  // ---------------- FIND BY CODE ----------------
  describe('findBookByCode', () => {
    it('should return book by code', async () => {
      const book = { bookid: 1, bookCode: 'BK001' };
      service.findBookByCode.mockResolvedValue(book);

      await expect(controller.findBookByCode('BK001')).resolves.toEqual(book);
      expect(service.findBookByCode).toHaveBeenCalledWith('BK001');
    });

    it('should return null if not found', async () => {
      service.findBookByCode.mockResolvedValue(null);

      await expect(controller.findBookByCode('unknown')).resolves.toBeNull();
    });

    it('should propagate errors', async () => {
      service.findBookByCode.mockRejectedValue(new Error('fail'));

      await expect(controller.findBookByCode('x')).rejects.toThrow('fail');
    });
  });
});
