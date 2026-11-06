import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import { signToken } from '@/lib/auth';
import { TEST_DB_URL, useTestDb } from '@/testing/test-db';

const sent: { to: string; subject: string; text: string }[] = [];
vi.mock('@/lib/mailer', () => ({
  sendMail: async (to: string, subject: string, text: string) => {
    sent.push({ to, subject, text });
  },
}));

const person = { fullName: 'Asha Rao', phoneNumber: '9111111111', email: 'asha@example.com' };
const lastOtp = () => /(\d{6})$/.exec(sent.at(-1)?.text ?? '')?.[1] ?? '';

describe.skipIf(!TEST_DB_URL)('users API (MongoDB)', () => {
  useTestDb('users');
  const app = createApp();

  it('registers a user once and never returns OTP fields', async () => {
    const res = await request(app).post('/users').send(person).expect(201);
    expect(res.body).toMatchObject(person);
    expect(res.body).not.toHaveProperty('otp');
    await request(app).post('/users').send(person).expect(409);
  });

  it('sign-in returns 404 for unknown users', async () => {
    await request(app).post('/users/sign-in').send({ phoneNumber: '9222222222' }).expect(404);
  });

  it('full login flow: OTP is emailed, verifies once, and token works on /items', async () => {
    await request(app).post('/users').send(person);
    await request(app).post('/users/sign-in').send({ phoneNumber: person.phoneNumber }).expect(200);
    expect(sent.at(-1)).toMatchObject({ to: person.email, subject: 'OTP For Login' });

    const otp = lastOtp();
    const wrong = otp === '000000' ? '111111' : '000000';
    await request(app).post('/users/verify-otp').send({ phoneNumber: person.phoneNumber, otp: wrong }).expect(401);

    const login = await request(app).post('/users/verify-otp').send({ phoneNumber: person.phoneNumber, otp }).expect(200);
    const { token, ...details } = login.body.userDetails;
    expect(details).toMatchObject(person);
    expect(details).not.toHaveProperty('otp');
    expect(login.body.message).toBe('User Logged In Successfully');

    await request(app).get('/items/day/2024-09-30').set('Authorization', token).expect(200);
    // OTP is single use
    await request(app).post('/users/verify-otp').send({ phoneNumber: person.phoneNumber, otp }).expect(401);
  });

  it('verify-otp on an unknown user is a 404, not a crash', async () => {
    await request(app).post('/users/verify-otp').send({ phoneNumber: '9333333333', otp: '123456' }).expect(404);
  });

  it('only the user themself can update or delete their account', async () => {
    const created = await request(app).post('/users').send(person).expect(201);
    const other = await request(app).post('/users').send({ ...person, phoneNumber: '9444444444', email: 'b@example.com' });
    const me = signToken({ phoneNumber: person.phoneNumber });

    await request(app).put(`/users/${other.body._id}`).set('Authorization', me).send({ fullName: 'Hacked' }).expect(403);
    await request(app).delete(`/users/${other.body._id}`).set('Authorization', me).expect(403);

    const updated = await request(app)
      .put(`/users/${created.body._id}`)
      .set('Authorization', me)
      .send({ fullName: 'Asha R', phoneNumber: '9999999999' })
      .expect(200);
    expect(updated.body.fullName).toBe('Asha R');
    expect(updated.body.phoneNumber).toBe(person.phoneNumber);

    await request(app).delete(`/users/${created.body._id}`).set('Authorization', me).expect(200);
  });
});
