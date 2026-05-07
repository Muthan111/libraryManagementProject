import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBody, ApiOperation, ApiParam,ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';
import { Roles } from '../user/role.decorator';
import { RolesGuard } from '../user/role.guard';
import { Role } from '../user/user.enum';

@Controller('user')
export class UserController {
  // Injects user management operations for the user endpoints.
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get Users' })
  @ApiResponse({ status: 200, description: 'Users have been found' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @Get()
  // Returns the full list of registered users.
  findAllUsers() {
    return this.userService.findAll();
  }
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
  @ApiResponse({ status: 409, description: 'User with the same email already exists.' })
  // Creates a new user from the submitted registration data.
  @Post()
  createUser(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }

  @ApiOperation({ summary: 'Find user by customer code' })
  @ApiParam({ name: 'customerCode', description: 'Customer code of the user to retrieve' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Get('customer-code/:customerCode')
  // Retrieves a user by their generated customer code.
  findUserByCustomerCode(@Param('customerCode') customerCode: string) {
    return this.userService.findUserByCustomerCode(customerCode);
  }

  
  @ApiOperation({ summary: 'Update user by customer code' })
  @ApiParam({ name: 'cusCode', description: 'Customer code of the user to update' })
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

  @ApiOperation({ summary: 'Delete all users' })
  @ApiResponse({ status: 200, description: 'All users deleted successfully.' })
  @Delete()
  // Removes every user record from the database.
  deleteAllUsers() {
    return this.userService.deleteAll();
  }
  
  @ApiOperation({ summary: 'Delete User by Customer Code' })
  @ApiParam({ name: 'customerCode', description: 'Customer code of the user to delete' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @Delete('customer-code/:customerCode')
  // Deletes a single user that matches the supplied customer code.
  deleteUserByCustomerCode(@Param('customerCode') customerCode: string) {
    return this.userService.deleteUserByCustomerCode(customerCode);
  }
}
