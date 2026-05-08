// borrow.controller.ts
import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { BorrowBookDto } from './borrow-book.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('borrow')
export class BorrowController {
  // Injects borrowing workflows used by the borrow endpoints.
  constructor(private readonly borrowService: BorrowService) {}
  @ApiOperation({ summary: 'borrow Books' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerCode: { type: 'string' },
        bookCode: { type: 'string' },
        dueDate: { type: 'string', format: 'date-time' },
      },
    },
  })
  @Post()
  @ApiResponse({
    status: 201,
    description: 'Borrow record created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Book is already borrowed or request is invalid.',
  })
  @ApiResponse({ status: 404, description: 'User or book not found.' })
  // Creates a borrow record for a user and book combination.
  borrowBook(@Body() dto: BorrowBookDto) {
    return this.borrowService.borrowBook(dto);
  }
  @ApiOperation({ summary: 'Return book' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Book returned successfully.' })
  @ApiResponse({ status: 400, description: 'Book already returned.' })
  @ApiResponse({ status: 404, description: 'Borrow record not found.' })
  @Post(':id/return')
  // Marks a borrow record as returned using its identifier.
  returnBook(@Param('id') id: number) {
    return this.borrowService.returnBook(Number(id));
  }
  @ApiOperation({ summary: 'Return book' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'User borrow history retrieved successfully.',
  })
  @Get('user/:id')
  // Retrieves the borrow history for the specified user.
  getUserBorrows(@Param('id') id: string) {
    return this.borrowService.getUserBorrows(id);
  }

  @ApiOperation({ summary: 'Get active borrow records' })
  @ApiResponse({
    status: 200,
    description: 'Active borrow records retrieved successfully.',
  })
  @Get('active')
  // Returns all borrow records that are still active.
  getActive() {
    return this.borrowService.getAllActiveBorrows();
  }
}
