import { Type } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
// import { NestExpressApplication } from '@nestjs/platform-express';
import { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
// import { RedisStore } from 'connect-redis';
import { AppModule } from './app.module';
import { setupSecurity } from './appSetup/setupSecurity';
import { setupSwagger } from './appSetup/setupSwagger';
import { setupValidation } from './appSetup/setupValidation';
import { setupAuth } from './appSetup/setupAuth';
import { setupFilters } from './appSetup/setupFilters';
import { json, urlencoded } from 'express';
// import { connectRedis, redisClient } from './config/redis';

type NestApplicationInput = Type<unknown> | TestingModule;

export type CreateAppOptions = {
  connectToRedis?: boolean;
};

function isTestingModule(value: NestApplicationInput): value is TestingModule {
  return typeof (value as TestingModule).createNestApplication === 'function';
}

export async function configureApp(
  app: INestApplication,
  // options: CreateAppOptions = {},
) {
  // const connectToRedis = options.connectToRedis ?? true;

  // if (connectToRedis) {
  //   await connectRedis();
  // }

  // const sessionStore = connectToRedis
  //   ? new RedisStore({ client: redisClient as any })
  //   : undefined;

  setupSecurity(app);
  setupValidation(app);
  setupAuth(app);
  setupFilters(app);
  setupSwagger(app);
  app.use(json({ limit: '1mb' }));
  app.use(urlencoded({ extended: true, limit: '1mb' }));

  return app;
}

export async function createApp(
  input: NestApplicationInput = AppModule,
  // options: CreateAppOptions = {},
) {
  const app = isTestingModule(input)
    ? input.createNestApplication<INestApplication>()
    : await NestFactory.create<INestApplication>(input);

  return configureApp(app);
}
