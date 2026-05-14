import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
export function setupValidation(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
