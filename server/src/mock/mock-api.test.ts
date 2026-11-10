import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ isMockMode: () => true }));

const today = new Date().toISOString().slice(0, 10);

describe('mock data API', () => {
  let app: Express;
  let token: string;

  beforeAll(async () => {
    const { createApp } = await import('@/app/app');
    app = createApp();
    await request(app).post('/users/sign-in').send({ phoneNumber: '9876543210' }).expect(404);
    await request(app).post('/users/sign-in').send({ phoneNumber: '9999999999' }).expect(200);
    await request(app).post('/users/verify-otp').send({ phoneNumber: '9999999999', otp: '000000' }).expect(401);
    const res = await request(app).post('/users/verify-otp').send({ phoneNumber: '9999999999', otp: '123456' }).expect(200);
    token = res.body.userDetails.token;
  });

  it('requires auth', async () => {
    await request(app).get(`/items/day/${today}`).expect(401);
  });

  it('serves seeded data ending today and supports create/delete', async () => {
    const auth = { Authorization: token };
    const month = await request(app).get(`/items/month/${today}`).set(auth).expect(200);
    expect(month.body.items.length).toBeGreaterThan(0);
    expect(month.body.monthData.length).toBeGreaterThanOrEqual(28);

    const created = await request(app)
      .post('/items')
      .set(auth)
      .send({ category: 'food', amount: 10, type: 'expense', date: today, time: '10:00' })
      .expect(201);
    const day = await request(app).get(`/items/day/${today}`).set(auth).expect(200);
    expect(day.body.items.some((i: { amount: number }) => i.amount === 10)).toBe(true);

    await request(app).delete(`/items/${created.body._id}`).set(auth).expect(200);
    await request(app).delete(`/items/${created.body._id}`).set(auth).expect(404);
  });
});
