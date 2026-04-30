import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './createBook.dto';
import { UpdateBookDto } from './updateBook.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}
  @ApiOperation({ summary: 'Get books' })
  @Get()
  findAllBooks() {
    return this.bookService.findAll();
  }

  @Post()
  @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                Author: { type: 'string' },
                ISBN: { type: 'string' }
            },
        },
    })
  createBook(@Body() data: CreateBookDto) {
    return this.bookService.create(data);
  }

  @Patch(':id')
  updateBook(@Param('id') id: string, @Body() data: UpdateBookDto) {
    return this.bookService.update(Number(id), data);
  }

  @Delete(':id')
  deleteBook(@Param('id') id: string) {
    return this.bookService.delete(Number(id));
  }
}
