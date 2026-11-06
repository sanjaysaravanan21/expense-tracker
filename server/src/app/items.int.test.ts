import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app';
import { signToken } from '@/lib/auth';
import { TEST_DB_URL, useTestDb } from '@/testing/test-db';

const alice = signToken({ phoneNumber: '9000000001' });
const bob = signToken({ phoneNumber: '9000000002' });

const item = (overrides: Record<string, unknown> = {}) => ({
  category: 'food',
  amount: 100,
  type: 'expense',
  date: '2024-09-30',
  time: '12:30',
  ...overrides,
});

describe.skipIf(!TEST_DB_URL)('items API (MongoDB)', () => {
  useTestDb('items');
  const app = createApp();

  const add = (token: string, body: Record<string, unknown>) =>
    request(app).post('/items').set('Authorization', token).send(body);

  it('creates an item for the authenticated user, ignoring a spoofed phoneNumber in the body', async () => {
    const res = await add(alice, item({ phoneNumber: '9000000002' })).expect(201);
    expect(res.body.phoneNumber).toBe('9000000001');

    const bobDay = await request(app).get('/items/day/2024-09-30').set('Authorization', bob).expect(200);
    expect(bobDay.body).toEqual({ totalAmount: 0, items: [] });
  });

  it('day totals only include the caller\'s items', async () => {
    await add(alice, item({ amount: 100 }));
    await add(alice, item({ amount: 50 }));
    await add(bob, item({ amount: 999 }));

    const res = await request(app).get('/items/day/2024-09-30').set('Authorization', alice).expect(200);
    expect(res.body.totalAmount).toBe(150);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.items[0]).not.toHaveProperty('_id');
  });

  it('week view returns 7 zero-filled days with totals, week days and sorted items', async () => {
    await add(alice, item({ date: '2024-10-02', amount: 20 }));
    await add(alice, item({ date: '2024-09-29', amount: 10 }));
    await add(alice, item({ date: '2024-10-02', amount: 5 }));
    await add(alice, item({ date: '2024-10-20', amount: 1000 }));

    const res = await request(app).get('/items/week/2024-09-29').set('Authorization', alice).expect(200);
    expect(res.body.weekData).toHaveLength(7);
    expect(res.body.weekData[0]).toEqual({ amount: 10, date: '2024-09-29', weekDay: 'Sun' });
    expect(res.body.weekData[1]).toEqual({ amount: 0, date: '2024-09-30', weekDay: 'Mon' });
    expect(res.body.weekData[3]).toEqual({ amount: 25, date: '2024-10-02', weekDay: 'Wed' });
    expect(res.body.totalAmount).toBe(35);
    expect(res.body.items.map((i: { date: string }) => i.date)).toEqual(['2024-09-29', '2024-10-02', '2024-10-02']);
  });

  it('month view covers every day of the month', async () => {
    await add(alice, item({ date: '2024-02-29', amount: 7 }));
    const res = await request(app).get('/items/month/2024-02-10').set('Authorization', alice).expect(200);
    expect(res.body.monthData).toHaveLength(29);
    expect(res.body.monthData.at(-1)).toEqual({ amount: 7, date: '2024-02-29', weekDay: 'Thu' });
    expect(res.body.totalAmount).toBe(7);
  });

  it('only the owner can update or delete an item', async () => {
    const created = await add(alice, item()).expect(201);
    const id = created.body._id;

    await request(app).put(`/items/${id}`).set('Authorization', bob).send({ amount: 1 }).expect(404);
    await request(app).delete(`/items/${id}`).set('Authorization', bob).expect(404);

    const updated = await request(app).put(`/items/${id}`).set('Authorization', alice).send({ amount: 42 }).expect(200);
    expect(updated.body.amount).toBe(42);
    expect(updated.body.category).toBe('food');

    await request(app).delete(`/items/${id}`).set('Authorization', alice).expect(200);
    await request(app).delete(`/items/${id}`).set('Authorization', alice).expect(404);
  });

  it('coerces a numeric string amount (existing client behavior is Number, but be lenient)', async () => {
    const res = await add(alice, item({ amount: '12.5' })).expect(201);
    expect(res.body.amount).toBe(12.5);
  });
});
