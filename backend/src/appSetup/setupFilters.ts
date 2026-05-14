import { INestApplication } from '@nestjs/common';
import { GlobalExceptionFilter } from '../common/exception.filter';
export function setupFilters(app: INestApplication) {
  app.useGlobalFilters(new GlobalExceptionFilter());
}
