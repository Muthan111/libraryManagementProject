jest.mock('../user/user.entity', () => ({
  User: class User {},
}));

import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Book } from './book.entity';
import { BookService } from './book.service';
import { CreateBookDto } from './createBook.dto';
import { UpdateBookDto } from './updateBook.dto';
import { User } from '../user/user.entity';
import { Role } from '../user/user.enum';

describe('BookService', () => {
  let service: BookService;
  let bookRepository: jest.Mocked<Partial<Repository<Book>>>;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;

  const buildUser = (overrides: Partial<User> = {}): User =>
    ({
      id: 1,
      customerCode: 'cus001',
      name: 'Alice',
      email: 'alice@example.com',
      password: 'secret',
      borrowRecords: [],
      role: Role.MEMBER,
      ...overrides,
    }) as User;

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

  describe('findAll', () => {
    it('should return all books from the repository', async () => {
      const books = [
        buildBook(),
        buildBook({
          bookid: 2,
          bookCode: 'BK002',
          name: 'Refactoring',
          Author: 'Martin Fowler',
          ISBN: '9780201485677',
          status: 'BORROWED',
          borrowedById: 'cus001',
        }),
      ];

      bookRepository.find!.mockResolvedValue(books);

      await expect(service.findAll()).resolves.toEqual(books);
      expect(bookRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should create a book, generate the book code, and save it twice', async () => {
      const bookData: CreateBookDto = {
        name: 'Domain-Driven Design',
        Author: 'Eric Evans',
        ISBN: '9780321125217',
        status: 'AVAILABLE',
      };
      const createdBook = buildBook({
        bookid: 7,
        bookCode: null as unknown as string,
        ...bookData,
      });
      const finalSavedBook = buildBook({
        bookid: 7,
        bookCode: 'BK007',
        ...bookData,
      });

      bookRepository.create!.mockReturnValue(createdBook);
      bookRepository.save!
        .mockResolvedValueOnce(createdBook)
        .mockResolvedValueOnce(finalSavedBook);

      await expect(service.create(bookData)).resolves.toEqual(finalSavedBook);
      expect(bookRepository.create).toHaveBeenCalledWith(bookData);
      expect(bookRepository.save).toHaveBeenNthCalledWith(1, createdBook);
      expect(bookRepository.save).toHaveBeenNthCalledWith(2, {
        ...createdBook,
        bookCode: 'BK007',
      });
    });
  });

  describe('update', () => {
    it('should merge the incoming data into the existing book and save it', async () => {
      const existingBook = buildBook({
        bookid: 4,
        bookCode: 'BK004',
      });
      const updateData: UpdateBookDto = {
        name: 'The Pragmatic Programmer 20th Anniversary Edition',
        status: 'RESERVED',
      };

      bookRepository.findOne!.mockResolvedValue(existingBook);
      bookRepository.save!.mockImplementation(async (book) => book as Book);

      await expect(service.update(4, updateData)).resolves.toEqual({
        ...existingBook,
        ...updateData,
      });
      expect(bookRepository.findOne).toHaveBeenCalledWith({
        where: { bookid: 4 },
      });
      expect(bookRepository.save).toHaveBeenCalledWith({
        ...existingBook,
        ...updateData,
      });
    });

    it('should throw when trying to update a missing book', async () => {
      bookRepository.findOne!.mockResolvedValue(null);

      await expect(service.update(99, { name: 'Missing Book' })).rejects.toThrow(
        new NotFoundException('Book with id 99 not found'),
      );
      expect(bookRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete the book and return a success message', async () => {
      bookRepository.delete!.mockResolvedValue({ affected: 1 } as DeleteResult);

      await expect(service.delete(5)).resolves.toEqual({
        message: 'Book with id 5 deleted successfully',
      });
      expect(bookRepository.delete).toHaveBeenCalledWith({ bookid: 5 });
    });

    it('should throw when trying to delete a missing book', async () => {
      bookRepository.delete!.mockResolvedValue({ affected: 0 } as DeleteResult);

      await expect(service.delete(12)).rejects.toThrow(
        new NotFoundException('Book with id 12 not found'),
      );
    });
  });

});
