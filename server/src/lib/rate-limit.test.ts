import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '@/app/app';
import { createLimiter } from './rate-limit';

describe('createLimiter', () => {
  const buildApp = (perPhone: boolean) => {
    const app = express();
    app.use(express.json());
    app.post('/otp', createLimiter({ windowMs: 60_000, max: 2, perPhone }), (_req, res) => {
      res.json({ ok: true });
    });
    return app;
  };

  it('returns 429 once the limit is exceeded', async () => {
    const app = buildApp(false);
    await request(app).post('/otp').send({}).expect(200);
    await request(app).post('/otp').send({}).expect(200);
    const res = await request(app).post('/otp').send({}).expect(429);
    expect(res.body).toEqual({ message: 'Too many requests, please try again later' });
  });

  it('counts each phone number separately when perPhone is set', async () => {
    const app = buildApp(true);
    await request(app).post('/otp').send({ phoneNumber: '9000000001' }).expect(200);
    await request(app).post('/otp').send({ phoneNumber: '9000000001' }).expect(200);
    await request(app).post('/otp').send({ phoneNumber: '9000000001' }).expect(429);
    await request(app).post('/otp').send({ phoneNumber: '9000000002' }).expect(200);
  });
});

describe('security headers', () => {
  it('sets helmet headers and hides the framework', async () => {
    const res = await request(createApp()).get('/server/health').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
