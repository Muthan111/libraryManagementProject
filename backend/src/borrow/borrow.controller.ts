// borrow.controller.ts
import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { BorrowBookDto } from './borrow-book.dto';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { ReturnBookDto } from './return-book.dto';

@Controller('borrow')
export class BorrowController {
  // Injects borrowing workflows used by the borrow endpoints.
  constructor(private readonly borrowService: BorrowService) {}
  @ApiOperation({ summary: 'borrow Books' })
  @ApiBody({
    type: BorrowBookDto,
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
  @ApiBody({ type: ReturnBookDto })
  @ApiResponse({ status: 200, description: 'Book returned successfully.' })
  @ApiResponse({ status: 400, description: 'Book already returned.' })
  @ApiResponse({ status: 404, description: 'Borrow record not found.' })
  @Post('/return')
  // Marks a borrow record as returned using its identifier.
  returnBook(@Body() dto: ReturnBookDto) {
    return this.borrowService.returnBook(dto);
  }
  @Post(':id/return')
  // Backwards-compatible endpoint: return by borrow numeric id.
  returnBookById(@Param('id') id: string) {
    return this.borrowService.returnBookById(id);
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
