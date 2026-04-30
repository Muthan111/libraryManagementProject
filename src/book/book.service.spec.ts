import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { book } from './book.entity';
import { BookService } from './book.service';

describe('BookService', () => {
  let service: BookService;
  let repository: jest.Mocked<Partial<Repository<book>>>;

  beforeEach(async () => {
    repository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookService,
        {
          provide: getRepositoryToken(book),
          useValue: repository,
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
      const books: book[] = [
        {
          bookid: 1,
          bookCode: 'BK001',
          name: 'Clean Code',
          Author: 'Robert C. Martin',
          ISBN: '9780132350884',
        },
        {
          bookid: 2,
          bookCode: 'BK002',
          name: 'Refactoring',
          Author: 'Martin Fowler',
          ISBN: '9780201485677',
        },
      ];

      repository.find!.mockResolvedValue(books);

      await expect(service.findAll()).resolves.toEqual(books);
      expect(repository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should create a book, generate the book code, and save it twice', async () => {
      const bookData: Partial<book> = {
        name: 'Domain-Driven Design',
        Author: 'Eric Evans',
        ISBN: '9780321125217',
      };
      const createdBook = {
        ...bookData,
      } as book;
      const firstSavedBook: book = {
        bookid: 7,
        bookCode: null as unknown as string,
        name: 'Domain-Driven Design',
        Author: 'Eric Evans',
        ISBN: '9780321125217',
      };
      const finalSavedBook: book = {
        ...firstSavedBook,
        bookCode: 'BK007',
      };

      repository.create!.mockReturnValue(createdBook);
      repository.save!
        .mockResolvedValueOnce(firstSavedBook)
        .mockResolvedValueOnce(finalSavedBook);

      await expect(service.create(bookData)).resolves.toEqual(finalSavedBook);
      expect(repository.create).toHaveBeenCalledWith(bookData);
      expect(repository.save).toHaveBeenNthCalledWith(1, createdBook);
      expect(repository.save).toHaveBeenNthCalledWith(2, {
        ...firstSavedBook,
        bookCode: 'BK007',
      });
    });
  });

  describe('update', () => {
    it('should merge the incoming data into the existing book and save it', async () => {
      const existingBook: book = {
        bookid: 4,
        bookCode: 'BK004',
        name: 'The Pragmatic Programmer',
        Author: 'Andrew Hunt',
        ISBN: '9780201616224',
      };
      const updateData: Partial<book> = {
        name: 'The Pragmatic Programmer 20th Anniversary Edition',
      };
      const updatedBook: book = {
        ...existingBook,
        ...updateData,
      };

      repository.findOne!.mockResolvedValue(existingBook);
      repository.save!.mockResolvedValue(updatedBook);

      await expect(service.update(4, updateData)).resolves.toEqual(updatedBook);
      expect(repository.findOne).toHaveBeenCalledWith({ where: { bookid: 4 } });
      expect(repository.save).toHaveBeenCalledWith(updatedBook);
    });

    it('should throw when trying to update a missing book', async () => {
      repository.findOne!.mockResolvedValue(null);

      await expect(service.update(99, { name: 'Missing Book' })).rejects.toThrow(
        new NotFoundException('Book with id 99 not found'),
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete the book and return a success message', async () => {
      repository.delete!.mockResolvedValue({ affected: 1 } as DeleteResult);

      await expect(service.delete(5)).resolves.toEqual({
        message: 'Book with id 5 deleted successfully',
      });
      expect(repository.delete).toHaveBeenCalledWith({ bookid: 5 });
    });

    it('should throw when trying to delete a missing book', async () => {
      repository.delete!.mockResolvedValue({ affected: 0 } as DeleteResult);

      await expect(service.delete(12)).rejects.toThrow(
        new NotFoundException('Book with id 12 not found'),
      );
    });
  });
});
