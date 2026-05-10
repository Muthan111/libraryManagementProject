import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  // Injects the application service used by the root endpoint.
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: 'Get application greeting' })
  @ApiResponse({ status: 200, description: 'Greeting returned successfully.' })
  @Get()
  // Returns the default greeting for the application's root route.
  getHello(): string {
    return this.appService.getHello();
  }
}
