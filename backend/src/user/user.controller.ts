import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';

@Controller('user')
// BUG: 2. ❗ Inconsistent route naming (REST design issue)
// BUG: 3. ❗ Bug in Swagger parameter naming mismatch
// BUG: 5. ❗ Missing authentication/authorization entirely
// BUG: 6. ❗ No validation pipe at controller level awareness
// BUG: 8. ❗ Mixed naming styles (camelCase vs kebab-case)
// BUG: 9 Business logic leaks into controller via Swagger schema
export class UserController {
  // Injects user management operations for the user endpoints.
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get Users' })
  @ApiResponse({ status: 200, description: 'Users have been found' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
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
  // Returns the full list of registered users.
  findAllUsers(@Query('page') page = '1', @Query('limit') limit = '10') {
    return this.userService.findAll(Number(page), Number(limit));
  }
  // BUG: ❗ Overly verbose Swagger schemas (duplication risk)
  @ApiOperation({ summary: 'Create Users' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
        role: { type: 'string' },
      },
      required: ['name', 'email', 'password', 'role'],
    },
  })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description: 'User with the same email already exists.',
  })
  // Creates a new user from the submitted registration data.
  @Post()
  createUser(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }

  @ApiOperation({ summary: 'Find user by customer code' })
  @ApiParam({
    name: 'customerCode',
    description: 'Customer code of the user to retrieve',
  })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Get('customer-code/:customerCode')
  // Retrieves a user by their generated customer code.
  findUserByCustomerCode(@Param('customerCode') customerCode: string) {
    return this.userService.findUserByCustomerCode(customerCode);
  }

  @ApiOperation({ summary: 'Update user by customer code' })
  @ApiParam({
    name: 'cusCode',
    description: 'Customer code of the user to update',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  // Updates a user identified by customer code with the provided fields.
  @Patch(':cusCode')
  updateUser(@Param('cusCode') cusCode: string, @Body() data: UpdateUserDto) {
    return this.userService.update(cusCode, data);
  }

  @ApiOperation({ summary: 'Delete User by Customer Code' })
  @ApiParam({
    name: 'customerCode',
    description: 'Customer code of the user to delete',
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Delete('customer-code/:customerCode')
  // Deletes a single user that matches the supplied customer code.
  deleteUserByCustomerCode(@Param('customerCode') customerCode: string) {
    return this.userService.deleteUserByCustomerCode(customerCode);
  }
}
