import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
const session = require('express-session');
const passport = require('passport');
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(
    session({
      secret: "secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 360000 }
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

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
  await app.listen(3000);
}
bootstrap();
