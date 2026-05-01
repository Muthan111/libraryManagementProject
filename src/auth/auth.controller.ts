import { Controller,UseGuards,Post,Request,Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
}
