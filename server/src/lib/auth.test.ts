import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler } from '@/app/error-handler';
import { getAuth, requireAuth, signToken } from './auth';

const app = express();
app.use(express.json());
app.get('/me', requireAuth, (_req, res) => {
  res.json(getAuth(res));
});
app.use(errorHandler);

const secret = 'test-secret-with-at-least-16-chars';

describe('requireAuth', () => {
  it('rejects requests without a token', async () => {
    await request(app).get('/me').expect(401);
  });

  it('accepts a raw token and a Bearer token and exposes only the verified identity', async () => {
    const token = signToken({ phoneNumber: '9876543210', userId: 'u1' });
    const raw = await request(app).get('/me').set('Authorization', token).expect(200);
    expect(raw.body).toEqual({ phoneNumber: '9876543210', userId: 'u1' });
    await request(app).get('/me').set('Authorization', `Bearer ${token}`).expect(200);
  });

  it('ignores a phone number supplied in the request body', async () => {
    const token = signToken({ phoneNumber: '9876543210' });
    const res = await request(app).get('/me').set('Authorization', token).send({ phoneNumber: '1111111111' }).expect(200);
    expect(res.body.phoneNumber).toBe('9876543210');
  });

  it('rejects tokens signed with another secret, expired tokens and alg=none', async () => {
    const wrongSecret = jwt.sign({ phoneNumber: '9876543210' }, 'another-secret-another-secret');
    const expired = jwt.sign({ phoneNumber: '9876543210' }, secret, { expiresIn: -10 });
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"phoneNumber":"9876543210"}').toString('base64url')}.`;
    for (const token of [wrongSecret, expired, none]) {
      await request(app).get('/me').set('Authorization', token).expect(401);
    }
  });

  it('rejects a validly signed token that has no phone number', async () => {
    await request(app).get('/me').set('Authorization', jwt.sign({ foo: 1 }, secret)).expect(401);
  });

  it('accepts legacy tokens whose payload is a full user object', async () => {
    const legacy = jwt.sign({ _id: 'x', phoneNumber: '9876543210', otp: '123456' }, secret);
    await request(app).get('/me').set('Authorization', legacy).expect(200);
  });
});
