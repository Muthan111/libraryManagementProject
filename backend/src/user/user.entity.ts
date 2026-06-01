import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Role } from '../user/user.enum';
import { BorrowRecord } from '../borrow/borrow.entity';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  customerCode: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;
  // BUG: 4. ❗ Password stored in plain column (security risk)
  @Column()
  password: string;

  @OneToMany(() => BorrowRecord, (borrow) => borrow.user)
  borrowRecords: BorrowRecord[];

  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role: Role;
}
