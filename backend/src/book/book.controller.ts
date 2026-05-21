import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './createBook.dto';
import { UpdateBookDto } from './updateBook.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../user/role.decorator';
import { RolesGuard } from '../user/role.guard';
import { Role } from '../user/user.enum';
@Controller('book')
export class BookController {
  // Injects book operations used by the book endpoints.
  constructor(private readonly bookService: BookService) {}
  @ApiOperation({ summary: 'Get books' })
  @ApiResponse({ status: 200, description: 'Books retrieved successfully.' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page for pagination',
  })
  @Get()
  // Returns books from the catalog using page-based pagination.
  findAllBooks(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.bookService.findAll(Number(page), Number(limit));
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @ApiBearerAuth('access-token')
  // @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new book' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        Author: { type: 'string' },
        ISBN: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Book created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description: 'Book with the same ISBN already exists.',
  })
  // Creates a new book record from the submitted request body.
  @Post()
  createBook(@Body() data: CreateBookDto) {
    return this.bookService.create(data);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a book' })
  @ApiParam({ name: 'bookCode', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        Author: { type: 'string' },
        ISBN: { type: 'string' },
        status: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Book updated successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  // Updates an existing book by its bookCode with the provided changes.
  @Patch(':bookCode')
  updateBook(@Param('bookCode') bookCode: string, @Body() data: UpdateBookDto) {
    return this.bookService.update(bookCode, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a book' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Book deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  // Deletes a book record that matches the supplied numeric id.
  @Delete(':id')
  deleteBook(@Param('id') id: string) {
    return this.bookService.delete(Number(id));
  }

  // @Post('borrow')
  // @ApiBody({
  //       schema: {
  //           type: 'object',
  //           properties: {
  //               bookCode: { type: 'string' },
  //               customerCode: { type: 'string' }
  //           },
  //       },
  //   })
  // async borrowBook(@Body() body: { bookCode: string; customerCode: string }) {
  //   const { bookCode, customerCode } = body;
  //   return this.bookService.borrowBook(bookCode, customerCode);
  // }

  // @Post('return')
  // @ApiBody({
  //       schema: {
  //           type: 'object',
  //           properties: {
  //               bookCode: { type: 'string' }
  //           },
  //       },
  //   })
  // async returnBook(@Body() body: { bookCode: string }) {
  //   const { bookCode } = body;
  //   return this.bookService.returnBook(bookCode);
  // }
  @ApiOperation({ summary: 'search books by name' })
  @ApiParam({ name: 'name', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Book lookup by name completed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  @Get('search/name/:name')
  // Looks up a single book by its exact name.
  async findBookByName(@Param('name') name: string) {
    return this.bookService.findBookByName(name);
  }
  @ApiOperation({ summary: 'search books by isbn' })
  @ApiParam({ name: 'isbn', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Book lookup by ISBN completed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  @Get('search/isbn/:isbn')
  // Looks up a single book by its ISBN value.
  async findBookByISBN(@Param('isbn') isbn: string) {
    return this.bookService.findBookByISBN(isbn);
  }
  @ApiOperation({ summary: 'search books by author' })
  @ApiParam({ name: 'author', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Book lookup by author completed successfully.',
  })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  @Get('search/author/:author')
  // Looks up a single book by the author's name.
  async findBookByAuthor(@Param('author') author: string) {
    return this.bookService.findBookByAuthor(author);
  }
}
