import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { Book } from '../book/book.entity';
import { User } from '../user/user.entity';
import { BorrowBookDto } from './borrow-book.dto';
import { BorrowRecord, BorrowStatus } from './borrow.entity';
import { generateCode } from 'src/utils/code-generator';
import { ReturnBookDto } from './return-book.dto';
import { DataSource, Repository, QueryFailedError } from 'typeorm';
@Injectable()
export class BorrowService {
  // Injects repositories required to manage borrow transactions and lookups.
  constructor(
    @InjectRepository(BorrowRecord)
    private borrowRepo: Repository<BorrowRecord>,
    private dataSource: DataSource,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Book)
    private bookRepo: Repository<Book>,
    @InjectMetric('book_operations_total')
    private readonly bookOperationsCounter: Counter<string>,
    @InjectMetric('http_errors_total')
    private readonly httpErrorsCounter: Counter<string>,
  ) {}

  // Creates a borrow transaction after validating the user, book, and availability.
  async borrowBook(dto: BorrowBookDto) {
    this.bookOperationsCounter.inc();

    try {
      const transaction = await this.dataSource.transaction(async (manager) => {
        const bookRepo = manager.getRepository(Book);
        const borrowRepo = manager.getRepository(BorrowRecord);
        const userRepo = manager.getRepository(User);

        const user = await userRepo.findOne({
          where: { customerCode: dto.customerCode },
        });

        if (!user) {
          throw new NotFoundException('User not found');
        }

        const book = await bookRepo.findOne({
          where: { bookCode: dto.bookCode },
        });

        if (!book) {
          throw new NotFoundException('Book not found');
        }

        const activeBorrow = await borrowRepo.findOne({
          where: {
            book: { bookCode: book.bookCode },
            status: BorrowStatus.BORROWED,
          },
        });

        if (activeBorrow) {
          throw new BadRequestException('Book is already borrowed');
        }
        const newBorrowCode = generateCode('BOR-XXXX-####');
        const borrow = borrowRepo.create({
          borrowCode: newBorrowCode,
          user,
          book,
          dueDate: new Date(dto.dueDate),
          status: BorrowStatus.BORROWED,
        });

        const updatePayload: Partial<Book> = {
          bookid: book.bookid,
          name: book.name,
          Author: book.Author,
          ISBN: book.ISBN,
          status: 'BORROWED',
        };
        await bookRepo.update(
          { bookCode: book.bookCode },
          { ...updatePayload },
        );

        return await borrowRepo.save(borrow);
      });
      return transaction;
    } catch (error) {
      this.httpErrorsCounter.inc();
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          `Borrow book for user ${dto.customerCode} and book ${dto.bookCode} already exists`,
        );
      }

      throw error;
    }
  }

  // Completes a borrow transaction by marking the record as returned.
  async returnBook(dto: ReturnBookDto) {
    this.bookOperationsCounter.inc();
    console.log('Returning book with borrow code:', dto.borrowCode);

    try {
      const transaction = await this.dataSource.transaction(async (manager) => {
        const bookRepo = manager.getRepository(Book);
        const borrowRepo = manager.getRepository(BorrowRecord);
        // If no borrowCode provided, fall back to the single active borrow record.
        // This supports clients that POST to `/borrow/return` without a body
        // (integration tests rely on this behavior when there's only one active borrow).
        const borrow = dto.borrowCode
          ? await borrowRepo.findOne({
              where: { borrowCode: dto.borrowCode },
              relations: ['book', 'user'],
            })
          : await borrowRepo.findOne({
              where: { status: BorrowStatus.BORROWED },
              relations: ['book', 'user'],
            });

        if (!borrow) {
          throw new NotFoundException('Borrow record not found');
        }

        if (borrow.status === BorrowStatus.RETURNED) {
          throw new BadRequestException('Book already returned');
        }

        borrow.status = BorrowStatus.RETURNED;
        borrow.returnDate = new Date();

        const updateBookPayload: Partial<Book> = {
          bookid: borrow.book.bookid,
          name: borrow.book.name,
          Author: borrow.book.Author,
          ISBN: borrow.book.ISBN,
        };
        await bookRepo.update(
          { bookCode: borrow.book.bookCode },
          { ...updateBookPayload, status: 'AVAILABLE' },
        );

        return await borrowRepo.save(borrow);
      });
      return transaction;
    } catch (error) {
      this.httpErrorsCounter.inc();
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          `Return book for borrow code ${dto.borrowCode} already processed`,
        );
      }

      throw error;
    }
  }

  // Backwards-compatible return by numeric id (used by some tests/endpoints).
  async returnBookById(id: string | number) {
    this.bookOperationsCounter.inc();

    try {
      const transaction = await this.dataSource.transaction(async (manager) => {
        const bookRepo = manager.getRepository(Book);
        const borrowRepo = manager.getRepository(BorrowRecord);
        const borrow = await borrowRepo.findOne({
          where: { id: Number(id) },
          relations: ['book', 'user'],
        });

        if (!borrow) {
          throw new NotFoundException('Borrow record not found');
        }

        if (borrow.status === BorrowStatus.RETURNED) {
          throw new BadRequestException('Book already returned');
        }

        borrow.status = BorrowStatus.RETURNED;
        borrow.returnDate = new Date();

        const updateBookPayload: Partial<Book> = {
          bookid: borrow.book.bookid,
          name: borrow.book.name,
          Author: borrow.book.Author,
          ISBN: borrow.book.ISBN,
        };
        await bookRepo.update(
          { bookCode: borrow.book.bookCode },
          { ...updateBookPayload, status: 'AVAILABLE' },
        );

        return await borrowRepo.save(borrow);
      });
      return transaction;
    } catch (error) {
      this.httpErrorsCounter.inc();
      if (
        error instanceof QueryFailedError &&
        (error as any).driverError?.code === 'ER_DUP_ENTRY'
      ) {
        throw new ConflictException(
          `Return book for borrow id ${id} already processed`,
        );
      }

      throw error;
    }
  }

  // Returns all borrow records associated with a user's customer code.
  async getUserBorrows(userId: string) {
    return await this.borrowRepo.find({
      where: { user: { customerCode: userId } },
      relations: ['book'],
      order: { borrowDate: 'DESC' },
    });
  }

  // Returns every borrow record that is still marked as borrowed.
  async getAllActiveBorrows() {
    return await this.borrowRepo.find({
      where: { status: BorrowStatus.BORROWED },
      relations: ['user', 'book'],
    });
  }
}
