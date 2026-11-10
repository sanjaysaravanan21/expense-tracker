import { Router } from 'express';
import { getAuth, requireAuth, signToken } from '@/lib/auth';
import { HttpError } from '@/lib/http-error';
import { registerBody, signInBody, updateUserBody, userIdParams, verifyOtpBody } from '@/features/users/user.schema';
import { findUser, MOCK_OTP, removeUser, saveUser } from './mock-store';

export const mockUserRouter = Router();

mockUserRouter.post('/', (req, res) => {
  const body = registerBody.parse(req.body);
  if (findUser(body.phoneNumber)) throw new HttpError(409, 'Users exists already');
  res.status(201).json(saveUser(body));
});

mockUserRouter.post('/sign-in', (req, res) => {
  const { phoneNumber } = signInBody.parse(req.body);
  if (!findUser(phoneNumber)) throw new HttpError(404, 'User Not Found');
  res.status(200).json({ message: 'OTP Sent Successfully' });
});

mockUserRouter.post('/verify-otp', (req, res) => {
  const { phoneNumber, otp } = verifyOtpBody.parse(req.body);
  const user = findUser(phoneNumber);
  if (!user) throw new HttpError(404, 'User Not Found');
  if (otp !== MOCK_OTP) throw new HttpError(401, 'OTP invalid');
  const token = signToken({ phoneNumber, userId: user._id });
  res.status(200).json({ message: 'User Logged In Successfully', userDetails: { ...user, token } });
});

function ownUser(id: string, phoneNumber: string) {
  const user = findUser(phoneNumber);
  if (!user || user._id !== id) throw new HttpError(404, 'User not found');
  return user;
}

mockUserRouter.put('/:id', requireAuth, (req, res) => {
  const { id } = userIdParams.parse(req.params);
  const body = updateUserBody.parse(req.body);
  res.json(Object.assign(ownUser(id, getAuth(res).phoneNumber), body));
});

mockUserRouter.delete('/:id', requireAuth, (req, res) => {
  const { id } = userIdParams.parse(req.params);
  removeUser(ownUser(id, getAuth(res).phoneNumber).phoneNumber);
  res.json({ message: 'User deleted successfully' });
});
