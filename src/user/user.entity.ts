import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity()
export class user {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: true })
    customerCode: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column()
    password: string;
}
