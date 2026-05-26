import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Role } from '../../src/user/user.enum';
import {
  closeIntegrationApp,
  createIntegrationApp,
  resetIntegrationState,
} from './helpers/test-app';
import { registerAndLoginUser } from './helpers/test-auth';

const readMetricValue = (metrics: string, name: string) => {
  const match = metrics.match(new RegExp(`^${name}\\s+([0-9.e+-]+)$`, 'm'));
  return match ? Number(match[1]) : null;
};

describe('Book integration', () => {
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

  it('creates books, enforces unique ISBNs, and supports list plus search flows', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/book')
      .send({
        name: '1984',
        Author: 'George Orwell',
        ISBN: '9780451524935',
        status: 'AVAILABLE',
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.bookCode).toMatch(/^BK-/);

    const duplicateResponse = await request(app.getHttpServer())
      .post('/book')
      .send({
        name: 'Animal Farm',
        Author: 'George Orwell',
        ISBN: '9780451524935',
        status: 'AVAILABLE',
      });

    expect(duplicateResponse.status).toBe(409);

    const listResponse = await request(app.getHttpServer()).get(
      '/book?page=1&limit=10',
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.meta.total).toBe(1);
    expect(listResponse.body.data[0].name).toBe('1984');

    await request(app.getHttpServer())
      .get('/book/search/name/1984')
      .expect(200)
      .expect(({ body }) => {
        expect(body.ISBN).toBe('9780451524935');
      });

    await request(app.getHttpServer())
      .get('/book/search/isbn/9780451524935')
      .expect(200)
      .expect(({ body }) => {
        expect(body.Author).toBe('George Orwell');
      });

    await request(app.getHttpServer())
      .get('/book/search/author/George Orwell')
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('1984');
      });

    const metricsResponse = await request(app.getHttpServer()).get('/metrics');

    expect(
      readMetricValue(metricsResponse.text, 'book_operations_total'),
    ).toBeGreaterThan(0);
    expect(
      readMetricValue(metricsResponse.text, 'book_fetch_requests_total'),
    ).toBeGreaterThan(0);
  });

  it('allows admins to update and delete books while blocking members', async () => {
    const admin = await registerAndLoginUser(app, {
      name: 'Admin User',
      email: 'admin.books@test.com',
      role: Role.ADMIN,
    });
    const member = await registerAndLoginUser(app, {
      name: 'Member User',
      email: 'member.books@test.com',
      role: Role.MEMBER,
    });

    const createResponse = await request(app.getHttpServer())
      .post('/book')
      .send({
        name: 'Dune',
        Author: 'Frank Herbert',
        ISBN: '9780441172719',
        status: 'AVAILABLE',
      });

    expect(createResponse.status).toBe(201);

    const forbiddenResponse = await request(app.getHttpServer())
      .patch(`/book/${createResponse.body.bookCode}`)
      .set('Authorization', `Bearer ${member.accessToken}`)
      .send({ name: 'Dune Messiah' });

    expect(forbiddenResponse.status).toBe(403);

    const adminUpdateResponse = await request(app.getHttpServer())
      .patch(`/book/${createResponse.body.bookCode}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Dune Messiah' });

    expect(adminUpdateResponse.status).toBe(200);
    expect(adminUpdateResponse.body.name).toBe('Dune Messiah');

    const adminDeleteResponse = await request(app.getHttpServer())
      .delete(`/book/${createResponse.body.bookid}`)
      .set('Authorization', `Bearer ${admin.accessToken}`);

    expect(adminDeleteResponse.status).toBe(200);
    expect(adminDeleteResponse.body.message).toContain(
      String(createResponse.body.bookid),
    );

    const metricsResponse = await request(app.getHttpServer()).get('/metrics');

    expect(
      readMetricValue(metricsResponse.text, 'book_operations_total'),
    ).toBeGreaterThan(0);
  });
});
