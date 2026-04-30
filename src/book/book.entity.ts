import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
@Entity()
export class book {
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
}
