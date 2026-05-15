import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ChatRequestDto {
  @ApiProperty({
    description: 'The user message to send to the chatbot.',
    example: 'Do you have books by Robert C. Martin?',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description:
      'Existing conversation identifier. Omit it to start a new conversation.',
    example: '15fec1bf-5483-4760-bd93-e4ad98bc014f',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}
