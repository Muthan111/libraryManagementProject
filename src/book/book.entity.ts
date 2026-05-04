import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

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
  @ManyToOne(() => User, (user) => user.borrowedBooks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'borrowedById',
    referencedColumnName: 'customerCode',
  })
  borrowedBy: User | null;

  // 👇 This column stores cus000 directly in DB
  @Column({ nullable: true })
  borrowedById: string | null;
}