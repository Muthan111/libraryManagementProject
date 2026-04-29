import { Controller, Get,Post,Body } from '@nestjs/common';
import {UserService} from "./user.service"
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import  {CreateUserDto} from "./createUser.dto"
@Controller('user')
export class UserController {

    constructor(private readonly userService: UserService) {}
    @ApiOperation({ summary: 'Get Users' })
    @Get()
    findAllUsers(){
        return this.userService.findAll();
    }

    @Post()
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                email: { type: 'string' },
            },
        },
    })
    createUser(@Body() data : CreateUserDto){
        return this.userService.create(data);
    }

}
