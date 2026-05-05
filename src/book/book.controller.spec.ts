jest.mock('src/book/book.entity', () => ({
  Book: class Book {},
}), { virtual: true });

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

  describe('findAllBooks', () => {
    it('should return all books from the service', async () => {
      const books = [
        {
          bookid: 1,
          bookCode: 'BK001',
          name: 'Clean Architecture',
          Author: 'Robert C. Martin',
          ISBN: '9780134494166',
          status: 'AVAILABLE',
          borrowedById: null,
          borrowRecords: [],
        },
      ];

      service.findAll.mockResolvedValue(books);

      await expect(controller.findAllBooks()).resolves.toEqual(books);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('createBook', () => {
    it('should pass the dto to the service', async () => {
      const dto: CreateBookDto = {
        name: 'Working Effectively with Legacy Code',
        Author: 'Michael Feathers',
        ISBN: '9780131177055',
        status: 'AVAILABLE',
      };
      const createdBook = {
        bookid: 8,
        bookCode: 'BK008',
        borrowedById: null,
        borrowRecords: [],
        ...dto,
      };

      service.create.mockResolvedValue(createdBook);

      await expect(controller.createBook(dto)).resolves.toEqual(createdBook);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('updateBook', () => {
    it('should convert the id to a number and pass update data to the service', async () => {
      const dto: UpdateBookDto = {
        name: 'Updated Name',
        status: 'BORROWED',
      };
      const updatedBook = {
        bookid: 3,
        bookCode: 'BK003',
        name: 'Updated Name',
        Author: 'Kent Beck',
        ISBN: '9780321146533',
        status: 'BORROWED',
        borrowedById: null,
        borrowRecords: [],
      };

      service.update.mockResolvedValue(updatedBook);

      await expect(controller.updateBook('3', dto)).resolves.toEqual(updatedBook);
      expect(service.update).toHaveBeenCalledWith(3, dto);
    });
  });

  describe('deleteBook', () => {
    it('should convert the id to a number and delegate to the service', async () => {
      const result = {
        message: 'Book with id 6 deleted successfully',
      };

      service.delete.mockResolvedValue(result);

      await expect(controller.deleteBook('6')).resolves.toEqual(result);
      expect(service.delete).toHaveBeenCalledWith(6);
    });
  });

  describe('findBookByName', () => {
    it('should delegate the name lookup to the service', async () => {
      const book = {
        bookid: 2,
        bookCode: 'BK002',
        name: 'Refactoring',
        Author: 'Martin Fowler',
        ISBN: '9780201485677',
        status: 'AVAILABLE',
        borrowedById: null,
        borrowRecords: [],
      };

      service.findBookByName.mockResolvedValue(book);

      await expect(controller.findBookByName('Refactoring')).resolves.toEqual(
        book,
      );
      expect(service.findBookByName).toHaveBeenCalledWith('Refactoring');
    });
  });

  describe('findBookByISBN', () => {
    it('should delegate the ISBN lookup to the service', async () => {
      const book = {
        bookid: 5,
        bookCode: 'BK005',
        name: 'Patterns of Enterprise Application Architecture',
        Author: 'Martin Fowler',
        ISBN: '9780321127426',
        status: 'AVAILABLE',
        borrowedById: null,
        borrowRecords: [],
      };

      service.findBookByISBN.mockResolvedValue(book);

      await expect(
        controller.findBookByISBN('9780321127426'),
      ).resolves.toEqual(book);
      expect(service.findBookByISBN).toHaveBeenCalledWith('9780321127426');
    });
  });

  describe('findBookByAuthor', () => {
    it('should delegate the author lookup to the service', async () => {
      const book = {
        bookid: 9,
        bookCode: 'BK009',
        name: 'Clean Architecture',
        Author: 'Robert C. Martin',
        ISBN: '9780134494166',
        status: 'AVAILABLE',
        borrowedById: null,
        borrowRecords: [],
      };

      service.findBookByAuthor.mockResolvedValue(book);

      await expect(
        controller.findBookByAuthor('Robert C. Martin'),
      ).resolves.toEqual(book);
      expect(service.findBookByAuthor).toHaveBeenCalledWith(
        'Robert C. Martin',
      );
    });
  });
});
