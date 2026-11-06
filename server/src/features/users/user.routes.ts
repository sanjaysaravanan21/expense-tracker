import { Router } from 'express';
import { requireAuth, getAuth } from '@/lib/auth';
import { registerRateLimit, sendOtpRateLimit, verifyOtpRateLimit } from '@/lib/rate-limit';
import { registerBody, signInBody, updateUserBody, userIdParams, verifyOtpBody } from './user.schema';
import * as users from './user.service';

export const userRouter = Router();

userRouter.post('/', registerRateLimit, async (req, res) => {
  const body = registerBody.parse(req.body);
  res.status(201).json(await users.registerUser(body));
});

userRouter.post('/sign-in', sendOtpRateLimit, async (req, res) => {
  const { phoneNumber } = signInBody.parse(req.body);
  await users.sendLoginOtp(phoneNumber);
  res.status(200).json({ message: 'OTP Sent Successfully' });
});

userRouter.post('/verify-otp', verifyOtpRateLimit, async (req, res) => {
  const { phoneNumber, otp } = verifyOtpBody.parse(req.body);
  const userDetails = await users.verifyLoginOtp(phoneNumber, otp);
  res.status(200).json({ message: 'User Logged In Successfully', userDetails });
});

userRouter.put('/:id', requireAuth, async (req, res) => {
  const { id } = userIdParams.parse(req.params);
  const body = updateUserBody.parse(req.body);
  res.json(await users.updateOwnUser(id, getAuth(res).phoneNumber, body));
});

userRouter.delete('/:id', requireAuth, async (req, res) => {
  const { id } = userIdParams.parse(req.params);
  await users.deleteOwnUser(id, getAuth(res).phoneNumber);
  res.json({ message: 'User deleted successfully' });
});
