import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as session from 'express-session';
import * as passport from 'passport';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // -------------------------
  // Security headers
  // -------------------------
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
    }),
  );

  app.disable('x-powered-by');
  app.enableCors();

  // -------------------------
  // Global validation
  // -------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // -------------------------
  // Session config (secure version)
  // -------------------------
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is not defined');
  }

  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 360000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
    }),
  );

  // -------------------------
  // Passport auth
  // -------------------------
  app.use(passport.initialize());
  app.use(passport.session());

  // -------------------------
  // Global exception filter
  // -------------------------
  app.useGlobalFilters(new GlobalExceptionFilter());

  // -------------------------
  // Swagger setup (disable in production)
  // -------------------------
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Library Management API')
      .setDescription('API docs for the library system')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the JWT access token here',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  // -------------------------
  // Start server
  // -------------------------
  await app.listen(3000);
}

bootstrap();
