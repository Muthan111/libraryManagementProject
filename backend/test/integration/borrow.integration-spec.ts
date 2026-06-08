import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Role } from '../../src/user/user.enum';
import { BorrowStatus } from '../../src/borrow/borrow.entity';
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

describe('Borrow integration', () => {
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

  it('borrows a book, prevents duplicate borrows, returns it, and exposes history', async () => {
    const member = await registerAndLoginUser(app, {
      name: 'Borrowing Member',
      email: 'member.borrow@test.com',
      role: Role.MEMBER,
    });

    const bookResponse = await request(app.getHttpServer()).post('/book').send({
      name: 'The Hobbit',
      Author: 'J.R.R. Tolkien',
      ISBN: '9780547928227',
      status: 'AVAILABLE',
    });

    expect(bookResponse.status).toBe(201);

    const borrowResponse = await request(app.getHttpServer())
      .post('/borrow')
      .send({
        customerCode: member.customerCode,
        bookCode: bookResponse.body.bookCode,
        dueDate: '2026-06-01T00:00:00.000Z',
      });

    expect(borrowResponse.status).toBe(201);
    expect(borrowResponse.body.status).toBe(BorrowStatus.BORROWED);

    const duplicateBorrowResponse = await request(app.getHttpServer())
      .post('/borrow')
      .send({
        customerCode: member.customerCode,
        bookCode: bookResponse.body.bookCode,
        dueDate: '2026-06-10T00:00:00.000Z',
      });

    expect(duplicateBorrowResponse.status).toBe(400);

    await request(app.getHttpServer())
      .get('/borrow/active')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].user.customerCode).toBe(member.customerCode);
      });

    await request(app.getHttpServer())
      .get(`/borrow/user/${member.customerCode}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].book.bookCode).toBe(bookResponse.body.bookCode);
      });

    const returnResponse = await request(app.getHttpServer())
    .post(
      `/borrow/return`,
    ).send({ borrowCode: borrowResponse.body.borrowCode })

    expect(returnResponse.status).toBe(201);
    expect(returnResponse.body.status).toBe(BorrowStatus.RETURNED);
    expect(returnResponse.body.returnDate).toBeTruthy();

    const duplicateReturnResponse = await request(app.getHttpServer()).post(
      `/borrow/return`,
    ).send({ borrowCode: borrowResponse.body.borrowCode })

    expect(duplicateReturnResponse.status).toBe(400);

    const metricsResponse = await request(app.getHttpServer()).get('/metrics');

    expect(
      readMetricValue(metricsResponse.text, 'book_operations_total'),
    ).toBeGreaterThan(0);
    expect(
      readMetricValue(metricsResponse.text, 'http_errors_total'),
    ).toBeGreaterThan(0);
  });
});
