import { Book } from 'src/book/book.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, PrimaryColumn } from 'typeorm';
import { Role } from '../user/user.enum';
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

    @OneToMany(() => Book, (book) => book.borrowedBy)
    borrowedBooks: Book[];

    @Column({ type: 'enum', enum: Role, default: Role.MEMBER })
    role: Role;
}
