import { IsDateString, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class BorrowBookDto {
  @ApiProperty()
  @IsString()
  customerCode: string;

  @ApiProperty()
  @IsString()
  bookCode: string;

  @ApiProperty()
  @IsDateString()
  dueDate: string;
}
