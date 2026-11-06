import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { signToken } from '@/lib/auth';
import { createApp } from './app';

const auth = () => signToken({ phoneNumber: '9876543210' });

describe('app (no database)', () => {
  const app = createApp();

  it('serves the health check without auth', async () => {
    const res = await request(app).get('/server/health').expect(200);
    expect(res.body).toEqual({ message: 'I am Up & Running Fine' });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/nope').expect(404);
    expect(res.body).toEqual({ message: 'Not Found' });
  });

  it('protects every /items route', async () => {
    await request(app).get('/items/day/2024-06-01').expect(401);
    await request(app).post('/items').send({}).expect(401);
    await request(app).put('/items/507f1f77bcf86cd799439011').send({}).expect(401);
    await request(app).delete('/items/507f1f77bcf86cd799439011').expect(401);
  });

  it('no longer exposes user listing, and protects user update/delete', async () => {
    await request(app).get('/users').expect(404);
    await request(app).put('/users/507f1f77bcf86cd799439011').send({ fullName: 'x' }).expect(401);
    await request(app).delete('/users/507f1f77bcf86cd799439011').expect(401);
  });

  it('validates path params before touching the database', async () => {
    const res = await request(app).get('/items/week/not-a-date').set('Authorization', auth()).expect(400);
    expect(res.body.message).toBe('Validation failed');
    await request(app).delete('/items/123').set('Authorization', auth()).expect(400);
  });

  it('validates item bodies at the edge', async () => {
    const res = await request(app)
      .post('/items')
      .set('Authorization', auth())
      .send({ category: 'nope', amount: -5, type: 'expense', date: '2024-02-30', time: '25:00' })
      .expect(400);
    const paths = res.body.errors.map((e: { path: string }) => e.path);
    expect(paths).toEqual(expect.arrayContaining(['category', 'amount', 'date', 'time']));
  });

  it('rejects empty item updates', async () => {
    await request(app).put('/items/507f1f77bcf86cd799439011').set('Authorization', auth()).send({}).expect(400);
  });

  it('validates user payloads', async () => {
    await request(app).post('/users').send({ fullName: 'A', phoneNumber: '123', email: 'bad' }).expect(400);
    await request(app).post('/users/sign-in').send({ phoneNumber: 'abc' }).expect(400);
    await request(app).post('/users/verify-otp').send({ phoneNumber: '9876543210', otp: '12' }).expect(400);
  });

  it('returns 400 for malformed JSON without leaking internals', async () => {
    const res = await request(app).post('/users').set('Content-Type', 'application/json').send('{bad').expect(400);
    expect(res.body).toEqual({ message: 'Malformed JSON body' });
  });
});
