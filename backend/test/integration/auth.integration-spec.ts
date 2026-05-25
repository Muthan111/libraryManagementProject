import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Role } from '../../src/user/user.enum';
import {
  closeIntegrationApp,
  createIntegrationApp,
  resetIntegrationState,
} from './helpers/test-app';
import { registerAndLoginUser } from './helpers/test-auth';

describe('Auth integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createIntegrationApp();
  });

  beforeEach(async () => {
    await resetIntegrationState(app);
  });

  afterAll(async () => {
    await closeIntegrationApp(app);
  });

  it('registers a user, rejects duplicates, and logs in successfully', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/user')
      .send({
        name: 'Admin User',
        email: 'admin.integration@test.com',
        password: 'password123',
        role: Role.ADMIN,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.customerCode).toMatch(/^CUS-/);
    expect(createResponse.body.password).not.toBe('password123');

    const duplicateResponse = await request(app.getHttpServer())
      .post('/user')
      .send({
        name: 'Admin User',
        email: 'admin.integration@test.com',
        password: 'password123',
        role: Role.ADMIN,
      });

    expect(duplicateResponse.status).toBe(409);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin.integration@test.com',
        password: 'password123',
      });

    expect(loginResponse.status).toBe(201);
    expect(loginResponse.body.access_token).toEqual(expect.any(String));
  });

  it('rejects invalid credentials and invalid payloads', async () => {
    await request(app.getHttpServer()).post('/user').send({
      name: 'Member User',
      email: 'member.integration@test.com',
      password: 'password123',
      role: Role.MEMBER,
    });

    const invalidCredentialsResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'member.integration@test.com',
        password: 'wrong-password',
      });

    expect(invalidCredentialsResponse.status).toBe(401);

    const invalidPayloadResponse = await request(app.getHttpServer())
      .post('/user')
      .send({
        email: 'missing-name@test.com',
        password: 'password123',
        role: Role.MEMBER,
        extraField: 'should-be-blocked',
      });

    expect(invalidPayloadResponse.status).toBe(400);
  });

  it('blocks members from admin-only routes and exposes metrics', async () => {
    const member = await registerAndLoginUser(app, {
      name: 'Member User',
      email: 'member.integration@test.com',
      role: Role.MEMBER,
    });

    const forbiddenResponse = await request(app.getHttpServer())
      .get('/user?page=1&limit=10')
      .set('Authorization', `Bearer ${member.accessToken}`);

    expect(forbiddenResponse.status).toBe(403);

    const metricsResponse = await request(app.getHttpServer()).get('/metrics');

    expect(metricsResponse.status).toBe(200);
    expect(metricsResponse.text).toContain('process_cpu_user_seconds_total');
  });
});
