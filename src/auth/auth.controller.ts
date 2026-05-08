import { Controller, UseGuards, Post, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LocalAuthGuard } from '../auth/local-auth.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../user/role.decorator';
import { RolesGuard } from '../user/role.guard';
import { Role } from '../user/user.enum';
@Controller('auth')
export class AuthController {
  // Injects authentication business logic for auth-related endpoints.
  constructor(private readonly authService: AuthService) {}

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
  // Authenticates a user with the local strategy and returns a JWT token.
  login(@Request() req: any) {
    return this.authService.login(req.user);
  }
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get()
  @ApiOperation({ summary: 'Test authenticated access' })
  @ApiResponse({
    status: 200,
    description: 'Authenticated route accessed successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  // Confirms that the provided JWT grants access to protected routes.
  async testAuthentication() {
    return this.authService.testingAuthModule();
  }
  @Get('TestRBAC')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Test role-based access control' })
  @ApiResponse({
    status: 200,
    description: 'Admin-only route accessed successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Roles(Role.ADMIN)
  // Verifies that only admin users can access this RBAC-protected route.
  testingRBAC() {
    return this.authService.testingRBAC();
  }
}
