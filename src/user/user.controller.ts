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
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';
import { Roles } from '../user/role.decorator';
import { RolesGuard } from '../user/role.guard';
import { Role } from '../user/user.enum';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Get Users' })
  @Get()
  findAllUsers() {
    return this.userService.findAll();
  }

  @Post()
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
  createUser(@Body() data: CreateUserDto) {
    return this.userService.create(data);
  }

  @Get('customer-code/:customerCode')
  findUserByCustomerCode(@Param('customerCode') customerCode: string) {
    return this.userService.findUserByCustomerCode(customerCode);
  }

  @Patch(':id')
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
  updateUser(@Param('id') id: string, @Body() data: UpdateUserDto) {
    return this.userService.update(Number(id), data);
  }

  @Delete()
  deleteAllUsers() {
    return this.userService.deleteAll();
  }
  @Get("TestRBAC")
  @Roles(Role.ADMIN)
  testingRBAC() {
    return this.userService.testingRBAC();
  }
  @ApiOperation({ summary: 'Delete User by Customer Code' })
  @ApiParam({ name: 'customerCode', description: 'Customer code of the user to delete' })
  @Delete('customer-code/:customerCode')
  deleteUserByCustomerCode(@Param('customerCode') customerCode: string) {
    return this.userService.deleteUserByCustomerCode(customerCode);
  }
}
