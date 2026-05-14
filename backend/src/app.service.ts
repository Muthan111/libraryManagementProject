import { Injectable } from '@nestjs/common';
@Injectable()
export class AppService {
  // Provides the static greeting returned by the root controller.
  getHello(): string {
    return 'Hello World! from Backend';
  }
}
