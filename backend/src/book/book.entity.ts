import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BorrowRecord } from '../borrow/borrow.entity';
@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  bookid: number;

  @Column({ unique: true })
  bookCode: string;

  @Column()
  name: string;

  @Column()
  Author: string;

  @Column({ unique: true })
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
