import { Test, TestingModule } from '@nestjs/testing';
import { BorrowBookDto } from './borrow-book.dto';
import { ReturnBookDto } from './return-book.dto';
import { BorrowController } from './borrow.controller';
import { BorrowStatus } from './borrow.entity';
import { BorrowService } from './borrow.service';

describe('BorrowController', () => {
  let controller: BorrowController;
  let service: {
    borrowBook: jest.Mock;
    returnBook: jest.Mock;
    getUserBorrows: jest.Mock;
    getAllActiveBorrows: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      borrowBook: jest.fn(),
      returnBook: jest.fn(),
      getUserBorrows: jest.fn(),
      getAllActiveBorrows: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BorrowController],
      providers: [
        {
          provide: BorrowService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<BorrowController>(BorrowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('borrowBook', () => {
    it('should pass the dto to the service', async () => {
      const dto: BorrowBookDto = {
        customerCode: 'cus001' as never,
        bookCode: 'BK001' as never,
        dueDate: '2026-05-15T00:00:00.000Z',
      };
      const borrowRecord = {
        id: 1,
        status: BorrowStatus.BORROWED,
        dueDate: new Date(dto.dueDate),
      };

      service.borrowBook.mockResolvedValue(borrowRecord);

      await expect(controller.borrowBook(dto)).resolves.toEqual(borrowRecord);
      expect(service.borrowBook).toHaveBeenCalledWith(dto);
    });
  });

  describe('returnBook', () => {
    it('should pass the dto to the service and return the result', async () => {
      const dto: ReturnBookDto = { borrowCode: 'BOR-0001-0004' } as any;
      const returnedBorrow = {
        id: 4,
        status: BorrowStatus.RETURNED,
        returnDate: new Date('2026-05-05T09:00:00.000Z'),
      };

      service.returnBook.mockResolvedValue(returnedBorrow);

      await expect(controller.returnBook(dto as never)).resolves.toEqual(
        returnedBorrow,
      );
      expect(service.returnBook).toHaveBeenCalledWith(dto);
    });

    it('should pass invalid dto values through to the service', async () => {
      const dto: ReturnBookDto = { borrowCode: 'oops' } as any;
      service.returnBook.mockResolvedValue({ id: NaN });

      await expect(controller.returnBook(dto as never)).resolves.toEqual({
        id: NaN,
      });
      expect(service.returnBook).toHaveBeenCalledWith(dto);
    });
  });

  describe('getUserBorrows', () => {
    it('should pass the user id to the service', async () => {
      const borrows = [
        {
          id: 1,
          status: BorrowStatus.BORROWED,
        },
      ];

      service.getUserBorrows.mockResolvedValue(borrows);

      await expect(controller.getUserBorrows('cus001')).resolves.toEqual(
        borrows,
      );
      expect(service.getUserBorrows).toHaveBeenCalledWith('cus001');
    });
  });

  describe('getActive', () => {
    it('should return active borrow records from the service', async () => {
      const activeBorrows = [
        {
          id: 2,
          status: BorrowStatus.BORROWED,
        },
      ];

      service.getAllActiveBorrows.mockResolvedValue(activeBorrows);

      await expect(controller.getActive()).resolves.toEqual(activeBorrows);
      expect(service.getAllActiveBorrows).toHaveBeenCalledTimes(1);
    });
  });
});
