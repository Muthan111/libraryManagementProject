// borrow.controller.ts
import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { BorrowBookDto } from './borrow-book.dto';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';

@Controller('borrow')
export class BorrowController {
  constructor(private readonly borrowService: BorrowService) {}
    @ApiOperation({ summary: 'borrow Books' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        customerCode: { type: 'string' },
        bookCode: { type: 'string' },
        dueDate: { type: "string", format: "date-time"}
      },
      
    },
  })  
  @Post()
  borrowBook(@Body() dto: BorrowBookDto) {
    return this.borrowService.borrowBook(dto);
  }
  @ApiOperation({ summary: 'Return book' })
  @ApiParam({name: "id", type: 'number'})
  @Post(':id/return')
  returnBook(@Param('id') id: number) {
    return this.borrowService.returnBook(Number(id));
  }
  @ApiOperation({ summary: 'Return book' })
  @ApiParam({name: "id", type: 'string'})
  @Get('user/:id')
  getUserBorrows(@Param('id') id: string) {
    return this.borrowService.getUserBorrows(id);
  }

  @Get('active')
  getActive() {
    return this.borrowService.getAllActiveBorrows();
  }
}