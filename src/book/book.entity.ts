import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';
import { BorrowRecord } from '../borrow/borrow.entity';
@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  bookid: number;

  @Column({ unique: true, nullable: true })
  bookCode: string;

  @Column()
  name: string;

  @Column()
  Author: string;

  @Column()
  ISBN: string;

  @Column()
  status: string;

  // 👇 Relationship to User via customerCode (cus000)
  @OneToMany(() => BorrowRecord, (borrow) => borrow.book)
borrowRecords: BorrowRecord[];

  // 👇 This column stores cus000 directly in DB
  @Column({ nullable: true })
  borrowedById: string | null;
}