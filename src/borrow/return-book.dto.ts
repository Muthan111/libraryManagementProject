import { IsNumber } from 'class-validator';

export class ReturnBookDto {
  @IsNumber()
  borrowId: number;
}