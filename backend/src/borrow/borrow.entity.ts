// borrow/entities/borrow.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Book } from '../book/book.entity';

export enum BorrowStatus {
  BORROWED = 'BORROWED',
  RETURNED = 'RETURNED',
}

@Entity()
export class BorrowRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.borrowRecords, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Book, (book) => book.borrowRecords, {
    onDelete: 'CASCADE',
  })
  book: Book;

  @CreateDateColumn()
  borrowDate: Date;

  @Column()
  dueDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  returnDate: Date | null;

  @Column({
    type: 'enum',
    enum: BorrowStatus,
    default: BorrowStatus.BORROWED,
  })
  status: BorrowStatus;
}
