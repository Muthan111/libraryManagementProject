import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Role } from '../user/user.enum';
import { BorrowRecord } from '../borrow/borrow.entity';
@Entity()
// BUG: ❗ Critical bug: You are mixing @PrimaryGeneratedColumn() and @PrimaryColumn() - solved
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // BUG: ❗ customerCode being nullable is dangerous (design issue)- solved
  @Column({ unique: true })
  customerCode: string;

  @Column()
  name: string;
  // BUG: 5. Missing important constraints (data integrity risk)
  @Column()
  email: string;
  // BUG: 4. ❗ Password stored in plain column (security risk)
  @Column()
  password: string;

  @OneToMany(() => BorrowRecord, (borrow) => borrow.user)
  borrowRecords: BorrowRecord[];

  @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
  role: Role;
}
