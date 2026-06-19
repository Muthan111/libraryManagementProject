// borrow.controller.ts
import { Controller, Post, Body, Param, Get, UseGuards } from '@nestjs/common';
import { BorrowService } from './borrow.service';
import { BorrowBookDto } from './borrow-book.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { ReturnBookDto } from './return-book.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../user/role.decorator';
import { RolesGuard } from '../user/role.guard';
import { Role } from '../user/user.enum';
@Controller('borrow')
export class BorrowController {
  // Injects borrowing workflows used by the borrow endpoints.
  constructor(private readonly borrowService: BorrowService) {}
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'borrow Books' })
  @ApiBody({
    type: BorrowBookDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Borrow record created successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Book is already borrowed or request is invalid.',
  })
  @ApiResponse({ status: 404, description: 'User or book not found.' })
  @Post()
  // Creates a borrow record for a user and book combination.
  borrowBook(@Body() dto: BorrowBookDto) {
    return this.borrowService.borrowBook(dto);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.MEMBER)
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.MEMBER)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles(Role.ADMIN)
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
