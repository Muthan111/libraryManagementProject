import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { Repository } from 'typeorm';
import { Book } from '../book/book.entity';
import { User } from '../user/user.entity';
import { BorrowBookDto } from './borrow-book.dto';
import { BorrowRecord, BorrowStatus } from './borrow.entity';

@Injectable()
export class BorrowService {
  // Injects repositories required to manage borrow transactions and lookups.
  constructor(
    @InjectRepository(BorrowRecord)
    private borrowRepo: Repository<BorrowRecord>,
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
      const user = await this.userRepo.findOne({
        where: { customerCode: dto.customerCode },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const book = await this.bookRepo.findOne({
        where: { bookCode: dto.bookCode },
      });

      if (!book) {
        throw new NotFoundException('Book not found');
      }

      const activeBorrow = await this.borrowRepo.findOne({
        where: {
          book: { bookCode: book.bookCode },
          status: BorrowStatus.BORROWED,
        },
      });

      if (activeBorrow) {
        throw new BadRequestException('Book is already borrowed');
      }

      const borrow = this.borrowRepo.create({
        user,
        book,
        dueDate: new Date(dto.dueDate),
        status: BorrowStatus.BORROWED,
      });

      return await this.borrowRepo.save(borrow);
    } catch (error) {
      this.httpErrorsCounter.inc();
      throw error;
    }
  }

  // Completes a borrow transaction by marking the record as returned.
  async returnBook(borrowId: number) {
    this.bookOperationsCounter.inc();

    try {
      const borrow = await this.borrowRepo.findOne({
        where: { id: borrowId },
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

      return await this.borrowRepo.save(borrow);
    } catch (error) {
      this.httpErrorsCounter.inc();
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
