import { IsDateString, IsString } from 'class-validator';

export class BorrowBookDto {
  @IsString()
  customerCode: string;

  @IsString()
  bookCode: string;

  @IsDateString()
  dueDate: string;
}
