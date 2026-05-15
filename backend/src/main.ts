import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import * as session from 'express-session';
// import * as passport from 'passport';
// import helmet from 'helmet';
// import { GlobalExceptionFilter } from './common/exception.filter';
// import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { connectRedis } from './config/redis';
import { RedisStore } from 'connect-redis';
import { redisClient } from './config/redis';
// import { INestApplication } from '@nestjs/common';
import { setupSecurity } from './appSetup/setupSecurity';

import { setupSwagger } from './appSetup/setupSwagger';
import { setupValidation } from './appSetup/setupValidation';
import { setupAuth } from './appSetup/setupAuth';
import { setupFilters } from './appSetup/setupFilters';
// BUG: Mixing concerns in bootstrap file
async function bootstrap() {
  const redisStore = new RedisStore({
    client: redisClient,
  });

  await connectRedis();
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // -------------------------
  // Security headers
  // -------------------------
  // BUG: Helmet CSP is too weak / partially incomplete
  // app.use(
  //   helmet({
  //     contentSecurityPolicy: {
  //       useDefaults: true,
  //       directives: {
  //         defaultSrc: ["'self'"],
  //         objectSrc: ["'none'"],
  //         upgradeInsecureRequests: [],
  //       },
  //     },
  //     hsts: {
  //       maxAge: 31536000,
  //       includeSubDomains: true,
  //     },
  //   }),
  // );

  // app.disable('x-powered-by');
  // // BUG: CORS is too permissive
  // app.enableCors();

  // -------------------------
  // Global validation
  // -------------------------
  // BUG: Global exception filter is good — but risky placement
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transform: true,
  //   }),
  // );

  // -------------------------
  // Session config (secure version)
  // -------------------------
  // if (!process.env.SESSION_SECRET) {
  //   throw new Error('SESSION_SECRET is not defined');
  // }
  // // BUG: Session cookie maxAge is too small / suspicious- Solved
  // // BUG: Missing session store (VERY important) - Solved
  // app.use(
  //   session({
  //     store: redisStore,
  //     secret: process.env.SESSION_SECRET,
  //     resave: false,
  //     saveUninitialized: false,
  //     cookie: {
  //       maxAge: 720000,
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === 'production',
  //       sameSite: 'lax',
  //     },
  //   }),
  // );

  // -------------------------
  // Passport auth
  // -------------------------
  // app.use(passport.initialize());
  // app.use(passport.session());

  // -------------------------
  // Global exception filter
  // -------------------------
  // app.useGlobalFilters(new GlobalExceptionFilter());

  // -------------------------
  // Swagger setup (disable in production)
  // -------------------------
  // if (process.env.NODE_ENV !== 'production') {
  //   const config = new DocumentBuilder()
  //     .setTitle('Library Management API')
  //     .setDescription('API docs for the library system')
  //     .setVersion('1.0')
  //     .addBearerAuth(
  //       {
  //         type: 'http',
  //         scheme: 'bearer',
  //         bearerFormat: 'JWT',
  //         description: 'Paste the JWT access token here',
  //       },
  //       'access-token',
  //     )
  //     .build();

  //   const document = SwaggerModule.createDocument(app, config);
  //   SwaggerModule.setup('api', app, document);
  // }

  // -------------------------
  // Start server
  // -------------------------
  setupSecurity(app);
  setupValidation(app);
  setupAuth(app, null);
  setupFilters(app);
  setupSwagger(app);
  await app.listen(3000);
}

bootstrap();
