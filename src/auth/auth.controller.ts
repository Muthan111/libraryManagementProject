import { Controller,UseGuards,Post,Request,Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../user/role.decorator';
import { RolesGuard } from '../user/role.guard';
import { Role } from '../user/user.enum';
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService ) {}

    @UseGuards(LocalAuthGuard)
    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                email: { type: 'string' },
                password: { type: 'string' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'User successfully logged in.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    login(@Request() req: any) {
        return this.authService.login(req.user);
    }
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('access-token')
    @Get()
    async testAuthentication(){
        return this.authService.testingAuthModule()
    }
    @Get("TestRBAC")
    @UseGuards(JwtAuthGuard,RolesGuard)
    @ApiBearerAuth('access-token')
    @Roles(Role.ADMIN)
      testingRBAC() {
        return this.authService.testingRBAC();
      }
}
