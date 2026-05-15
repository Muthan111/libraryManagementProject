import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('User API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users → should create user', async () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({
        name: 'Alice',
        email: 'alice@test.com',
        password: '123456',
        role: 'MEMBER',
      })
      .expect(201);
  });
});
