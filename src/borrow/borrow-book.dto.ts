import { IsNumber, IsDateString } from 'class-validator';

export class BorrowBookDto {
  @IsNumber()
  customerCode: string;

  @IsNumber()
  bookCode: string;

  @IsDateString()
  dueDate: string;
}