import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Role } from '../user/user.enum';
import { BorrowRecord } from '../borrow/borrow.entity';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @PrimaryColumn()
  @Column({ unique: true, nullable: true })
  customerCode: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @OneToMany(() => BorrowRecord, (borrow) => borrow.user)
  borrowRecords: BorrowRecord[];

  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role: Role;
}
