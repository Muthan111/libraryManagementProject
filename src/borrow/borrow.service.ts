// borrow.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BorrowRecord, BorrowStatus } from './borrow.entity';
import { User } from '../user/user.entity';
import { Book } from '../book/book.entity';
import { BorrowBookDto } from './borrow-book.dto';

@Injectable()
export class BorrowService {
  constructor(
    @InjectRepository(BorrowRecord)
    private borrowRepo: Repository<BorrowRecord>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Book)
    private bookRepo: Repository<Book>,
  ) {}

  async borrowBook(dto: BorrowBookDto) {
    const user = await this.userRepo.findOne({
      where: { customerCode: dto.customerCode },
    });
    if (!user) throw new NotFoundException('User not found');

    const book = await this.bookRepo.findOne({ where: { bookCode: dto.bookCode } });
    if (!book) throw new NotFoundException('Book not found');

    // 🚨 check if book already borrowed
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

    return this.borrowRepo.save(borrow);
  }

  async returnBook(borrowId: number) {
    const borrow = await this.borrowRepo.findOne({
      where: { id: borrowId },
      relations: ['book', 'user'],
    });

    if (!borrow) throw new NotFoundException('Borrow record not found');

    if (borrow.status === BorrowStatus.RETURNED) {
      throw new BadRequestException('Book already returned');
    }

    borrow.status = BorrowStatus.RETURNED;
    borrow.returnDate = new Date();

    return this.borrowRepo.save(borrow);
  }

  async getUserBorrows(userId: string) {
    return this.borrowRepo.find({
      where: { user: { customerCode: userId } },
      relations: ['book'],
      order: { borrowDate: 'DESC' },
    });
  }

  async getAllActiveBorrows() {
    return this.borrowRepo.find({
      where: { status: BorrowStatus.BORROWED },
      relations: ['user', 'book'],
    });
  }
}