import type { Express } from 'express';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { signToken } from '@/lib/auth';

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

  it('generates consistent day, week and month data for each user and preserves changes', async () => {
    const owner = { Authorization: signToken({ phoneNumber: '9000000011' }) };
    const other = { Authorization: signToken({ phoneNumber: '9000000012' }) };
    const date = '2024-02-29';
    const day = await request(app).get(`/items/day/${date}`).set(owner).expect(200);
    expect(day.body.items.length).toBeGreaterThan(0);
    expect(day.body.totalAmount).toBeGreaterThan(0);

    const week = await request(app).get('/items/week/2024-02-28').set(owner).expect(200);
    const month = await request(app).get(`/items/month/${date}`).set(owner).expect(200);
    expect(week.body.weekData).toHaveLength(7);
    expect(month.body.monthData).toHaveLength(29);
    expect(week.body.items.filter((item: { date: string }) => item.date === date)).toEqual(day.body.items);
    expect(month.body.items.filter((item: { date: string }) => item.date === date)).toEqual(day.body.items);
    expect(week.body.weekData[1].amount).toBe(day.body.totalAmount);
    expect(month.body.monthData[28].amount).toBe(day.body.totalAmount);
    expect(week.body.totalAmount).toBe(week.body.weekData.reduce((sum: number, entry: { amount: number }) => sum + entry.amount, 0));
    expect(month.body.totalAmount).toBe(month.body.monthData.reduce((sum: number, entry: { amount: number }) => sum + entry.amount, 0));

    const created = await request(app).post('/items').set(owner)
      .send({ category: 'food', amount: 42, type: 'expense', date, time: '10:00', paidTo: 'Owner only' })
      .expect(201);
    const otherDay = await request(app).get(`/items/day/${date}`).set(other).expect(200);
    expect(otherDay.body.items.length).toBeGreaterThan(0);
    expect(otherDay.body.items).not.toContainEqual(expect.objectContaining({ paidTo: 'Owner only' }));
    await request(app).put(`/items/${created.body._id}`).set(other).send({ amount: 1 }).expect(404);
    await request(app).delete(`/items/${created.body._id}`).set(other).expect(404);
    await request(app).put(`/items/${created.body._id}`).set(owner).send({ amount: 43 }).expect(200);
    const updated = await request(app).get(`/items/day/${date}`).set(owner).expect(200);
    expect(updated.body.items).toContainEqual(expect.objectContaining({ amount: 43, paidTo: 'Owner only' }));
    await request(app).delete(`/items/${created.body._id}`).set(owner).expect(200);
    const afterDelete = await request(app).get(`/items/day/${date}`).set(owner).expect(200);
    expect(afterDelete.body).toEqual(day.body);
  });

  it('validates mock item dates and protects every GET endpoint', async () => {
    for (const period of ['day', 'week', 'month']) {
      await request(app).get(`/items/${period}/2024-02-29`).expect(401);
      await request(app).get(`/items/${period}/2024-02-30`).set('Authorization', token).expect(400);
    }
  });

  it('serves current month data and supports create/delete for the demo user', async () => {
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
