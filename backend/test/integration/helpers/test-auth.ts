import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Role } from '../../../src/user/user.enum';

type UserSeedInput = {
  email: string;
  name: string;
  password?: string;
  role: Role;
};

export async function registerUser(
  app: INestApplication,
  input: UserSeedInput,
) {
  const password = input.password ?? 'password123';

  const response = await request(app.getHttpServer()).post('/user').send({
    name: input.name,
    email: input.email,
    password,
    role: input.role,
  });

  return {
    password,
    response,
  };
}

export async function loginUser(
  app: INestApplication,
  email: string,
  password: string,
) {
  const response = await request(app.getHttpServer()).post('/auth/login').send({
    email,
    password,
  });

  return response;
}

export async function registerAndLoginUser(
  app: INestApplication,
  input: UserSeedInput,
) {
  const registeredUser = await registerUser(app, input);
  expect(registeredUser.response.status).toBe(201);

  const loginResponse = await loginUser(
    app,
    input.email,
    registeredUser.password,
  );
  expect(loginResponse.status).toBe(201);

  return {
    accessToken: loginResponse.body.access_token as string,
    customerCode: registeredUser.response.body.customerCode as string,
  };
}
