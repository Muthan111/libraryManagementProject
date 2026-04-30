import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBookDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  Author: string;

  @ApiProperty()
  @IsString()
  ISBN: string;

  @ApiProperty()
  @IsString()
  status: string;
}
