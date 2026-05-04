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
import { ApiBody, ApiOperation } from '@nestjs/swagger';
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
                ISBN: { type: 'string' },
                status: { type: 'string' }
            },
        },
    })
  createBook(@Body() data: CreateBookDto) {
    return this.bookService.create(data);
  }

  @Patch(':id')
  @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                Author: { type: 'string' },
                ISBN: { type: 'string' },
                status: { type: 'string' }
            },
        },
    })
  updateBook(@Param('id') id: string, @Body() data: UpdateBookDto) {
    return this.bookService.update(Number(id), data);
  }

  @Delete(':id')
  deleteBook(@Param('id') id: string) {
    return this.bookService.delete(Number(id));
  }

  @Post('borrow')
  @ApiBody({
        schema: {
            type: 'object',
            properties: {
                bookCode: { type: 'string' },
                customerCode: { type: 'string' }
            },
        },
    })
  async borrowBook(@Body() body: { bookCode: string; customerCode: string }) {
    const { bookCode, customerCode } = body;
    return this.bookService.borrowBook(bookCode, customerCode);
  }

  @Post('return')
  @ApiBody({
        schema: {
            type: 'object',
            properties: {
                bookCode: { type: 'string' }
            },
        },
    })
  async returnBook(@Body() body: { bookCode: string }) {
    const { bookCode } = body;
    return this.bookService.returnBook(bookCode);
  }
}
