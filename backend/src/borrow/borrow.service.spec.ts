import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getToken } from '@willsoto/nestjs-prometheus';
import { Repository, DataSource } from 'typeorm';
// Ensure generated borrow codes are deterministic for tests
jest.mock('src/utils/code-generator', () => ({
  generateCode: jest.fn(() => 'BOR-0001-0001'),
}));
import { Book } from '../book/book.entity';
import { Role } from '../user/user.enum';
import { User } from '../user/user.entity';
import { BorrowBookDto } from './borrow-book.dto';
import { ReturnBookDto } from './return-book.dto';
import { BorrowRecord, BorrowStatus } from './borrow.entity';
import { BorrowService } from './borrow.service';

describe('BorrowService', () => {
  let service: BorrowService;
  let borrowRepository: jest.Mocked<Partial<Repository<BorrowRecord>>>;
  let userRepository: jest.Mocked<Partial<Repository<User>>>;
  let bookRepository: jest.Mocked<Partial<Repository<Book>>>;
  let bookOperationsCounter: { inc: jest.Mock };
  let httpErrorsCounter: { inc: jest.Mock };

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

  let transactionRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  let manager: {
    getRepository: jest.Mock;
  };

  let dataSource: {
    transaction: jest.Mock;
  };

  const buildBorrowRecord = (
    overrides: Partial<BorrowRecord> = {},
  ): BorrowRecord =>
    ({
      id: 1,
      borrowCode: 'BOR-0001-0001',
      user: buildUser(),
      book: buildBook(),
      borrowDate: new Date('2026-05-01T10:00:00.000Z'),
      dueDate: new Date('2026-05-15T00:00:00.000Z'),
      returnDate: null,
      status: BorrowStatus.BORROWED,
      ...overrides,
    }) as BorrowRecord;

  beforeEach(async () => {
    bookOperationsCounter = { inc: jest.fn() };
    httpErrorsCounter = { inc: jest.fn() };

    borrowRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    userRepository = {
      findOne: jest.fn(),
    };

    bookRepository = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    };

    transactionRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    manager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === Book) return bookRepository;
        if (entity === User) return userRepository;
        if (entity === BorrowRecord) return borrowRepository;
        return transactionRepository;
      }),
    };

    dataSource = {
      transaction: jest.fn(async (callback) => callback(manager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BorrowService,
        {
          provide: getRepositoryToken(BorrowRecord),
          useValue: borrowRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Book),
          useValue: bookRepository,
        },
        {
          provide: getToken('book_operations_total'),
          useValue: bookOperationsCounter,
        },
        {
          provide: getToken('http_errors_total'),
          useValue: httpErrorsCounter,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<BorrowService>(BorrowService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('borrowBook', () => {
    it('should create and save a borrow record when the user and book exist', async () => {
      const dto: BorrowBookDto = {
        customerCode: 'cus001' as never,
        bookCode: 'BK001' as never,
        dueDate: '2026-05-15T00:00:00.000Z',
      };
      const borrowCode = 'BOR-0001-0001';
      const status = BorrowStatus.BORROWED;
      const user = buildUser();
      const book = buildBook();
      const createdBorrow = buildBorrowRecord({
        borrowCode,
        user,
        book,
        dueDate: new Date(dto.dueDate),
        status,
      });
      const savedBorrow = buildBorrowRecord({
        borrowCode,
        id: 10,
        user,
        book,
        dueDate: new Date(dto.dueDate),
        status,
      });

      userRepository.findOne!.mockResolvedValue(user);
      bookRepository.findOne!.mockResolvedValue(book);
      borrowRepository.findOne!.mockResolvedValue(null);
      borrowRepository.create!.mockReturnValue(createdBorrow);
      borrowRepository.save!.mockResolvedValue(savedBorrow);

      await expect(service.borrowBook(dto)).resolves.toEqual(savedBorrow);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { customerCode: 'cus001' },
      });
      expect(bookRepository.findOne).toHaveBeenCalledWith({
        where: { bookCode: 'BK001' },
      });
      expect(borrowRepository.findOne).toHaveBeenCalledWith({
        where: {
          book: { bookCode: 'BK001' },
          status: BorrowStatus.BORROWED,
        },
      });
      expect(borrowRepository.create).toHaveBeenCalledWith({
        borrowCode,
        user,
        book,
        dueDate: new Date(dto.dueDate),
        status: BorrowStatus.BORROWED,
      });
      expect(borrowRepository.save).toHaveBeenCalledWith(createdBorrow);
      expect(bookOperationsCounter.inc).toHaveBeenCalledTimes(1);
    });

    it('should throw when the user does not exist', async () => {
      userRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.borrowBook({
          customerCode: 'cus404' as never,
          bookCode: 'BK001' as never,
          dueDate: '2026-05-15T00:00:00.000Z',
        }),
      ).rejects.toThrow(new NotFoundException('User not found'));
      expect(bookRepository.findOne).not.toHaveBeenCalled();
      expect(httpErrorsCounter.inc).toHaveBeenCalledTimes(1);
    });

    it('should throw when the book does not exist', async () => {
      userRepository.findOne!.mockResolvedValue(buildUser());
      bookRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.borrowBook({
          customerCode: 'cus001' as never,
          bookCode: 'BK404' as never,
          dueDate: '2026-05-15T00:00:00.000Z',
        }),
      ).rejects.toThrow(new NotFoundException('Book not found'));
      expect(borrowRepository.findOne).not.toHaveBeenCalled();
      expect(httpErrorsCounter.inc).toHaveBeenCalledTimes(1);
    });

    it('should throw when the book is already borrowed', async () => {
      userRepository.findOne!.mockResolvedValue(buildUser());
      bookRepository.findOne!.mockResolvedValue(buildBook());
      borrowRepository.findOne!.mockResolvedValue(buildBorrowRecord());

      await expect(
        service.borrowBook({
          customerCode: 'cus001' as never,
          bookCode: 'BK001' as never,
          dueDate: '2026-05-15T00:00:00.000Z',
        }),
      ).rejects.toThrow(new BadRequestException('Book is already borrowed'));
      expect(borrowRepository.create).not.toHaveBeenCalled();
      expect(borrowRepository.save).not.toHaveBeenCalled();
      expect(httpErrorsCounter.inc).toHaveBeenCalledTimes(1);
    });

    it('should preserve the exact due date provided in the dto', async () => {
      const dto: BorrowBookDto = {
        customerCode: 'cus001' as never,
        bookCode: 'BK001' as never,
        dueDate: '2026-05-15T18:30:00.000Z',
      };

      userRepository.findOne!.mockResolvedValue(buildUser());
      bookRepository.findOne!.mockResolvedValue(buildBook());
      borrowRepository.findOne!.mockResolvedValue(null);
      borrowRepository.create!.mockImplementation(
        (payload) => payload as BorrowRecord,
      );
      borrowRepository.save!.mockImplementation(
        async (record) => record as BorrowRecord,
      );

      await service.borrowBook(dto);

      expect(borrowRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          dueDate: new Date('2026-05-15T18:30:00.000Z'),
        }),
      );
    });
  });

  describe('returnBook', () => {
    it('should mark the borrow record as returned and save it', async () => {
      const borrow = buildBorrowRecord({
        id: 5,
        status: BorrowStatus.BORROWED,
      });

      borrowRepository.findOne!.mockResolvedValue(borrow);
      borrowRepository.save!.mockImplementation(
        async (record) => record as BorrowRecord,
      );

      const result = await service.returnBook({
        borrowCode: borrow.borrowCode,
      } as ReturnBookDto);

      expect(borrowRepository.findOne).toHaveBeenCalledWith({
        where: { borrowCode: borrow.borrowCode },
        relations: ['book', 'user'],
      });
      expect(result.status).toBe(BorrowStatus.RETURNED);
      expect(result.returnDate).toBeInstanceOf(Date);
      expect(borrowRepository.save).toHaveBeenCalledWith(borrow);
      expect(bookOperationsCounter.inc).toHaveBeenCalledTimes(1);
    });

    it('should throw when the borrow record does not exist', async () => {
      borrowRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.returnBook({ borrowCode: 'jjjj' } as ReturnBookDto),
      ).rejects.toThrow(new NotFoundException('Borrow record not found'));
      expect(borrowRepository.save).not.toHaveBeenCalled();
      expect(httpErrorsCounter.inc).toHaveBeenCalledTimes(1);
    });

    it('should throw when the book was already returned', async () => {
      borrowRepository.findOne!.mockResolvedValue(
        buildBorrowRecord({
          status: BorrowStatus.RETURNED,
          returnDate: new Date('2026-05-02T12:00:00.000Z'),
        }),
      );

      await expect(
        service.returnBook({ borrowCode: 'BOR-0001-0001' } as ReturnBookDto),
      ).rejects.toThrow(new BadRequestException('Book already returned'));
      expect(borrowRepository.save).not.toHaveBeenCalled();
      expect(httpErrorsCounter.inc).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserBorrows', () => {
    it('should return borrow records for the provided user code', async () => {
      const borrows = [
        buildBorrowRecord(),
        buildBorrowRecord({
          id: 2,
          book: buildBook({ bookCode: 'BK002', name: 'Refactoring' }),
        }),
      ];

      borrowRepository.find!.mockResolvedValue(borrows);

      await expect(service.getUserBorrows('cus001')).resolves.toEqual(borrows);
      expect(borrowRepository.find).toHaveBeenCalledWith({
        where: { user: { customerCode: 'cus001' } },
        relations: ['book'],
        order: { borrowDate: 'DESC' },
      });
    });

    it('should return an empty array when the user has no borrow history', async () => {
      borrowRepository.find!.mockResolvedValue([]);

      await expect(service.getUserBorrows('cus404')).resolves.toEqual([]);
    });
  });

  describe('getAllActiveBorrows', () => {
    it('should return all active borrow records with user and book relations', async () => {
      const borrows = [buildBorrowRecord()];

      borrowRepository.find!.mockResolvedValue(borrows);

      await expect(service.getAllActiveBorrows()).resolves.toEqual(borrows);
      expect(borrowRepository.find).toHaveBeenCalledWith({
        where: { status: BorrowStatus.BORROWED },
        relations: ['user', 'book'],
      });
    });
  });
});
