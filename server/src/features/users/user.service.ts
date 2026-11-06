import { randomInt, timingSafeEqual } from 'node:crypto';
import { signToken } from '@/lib/auth';
import { HttpError } from '@/lib/http-error';
import { sendMail } from '@/lib/mailer';
import { User } from './user.model';
import type { RegisterBody, UpdateUserBody } from './user.schema';

const OTP_TTL_MS = 10 * 60 * 1000;

const generateOtp = (): string => randomInt(100000, 1000000).toString();

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function registerUser(body: RegisterBody) {
  if (await User.exists({ phoneNumber: body.phoneNumber })) {
    throw new HttpError(409, 'Users exists already');
  }
  return User.create(body);
}

export async function sendLoginOtp(phoneNumber: string): Promise<void> {
  const user = await User.findOne({ phoneNumber });
  if (!user) throw new HttpError(404, 'User Not Found');

  const otp = generateOtp();
  await User.updateOne({ _id: user._id }, { otp, otpExpiresAt: new Date(Date.now() + OTP_TTL_MS) });
  await sendMail(user.email, 'OTP For Login', `Your OTP for Login is ${otp}`);
}

export async function verifyLoginOtp(phoneNumber: string, otp: string) {
  const user = await User.findOne({ phoneNumber }).select('+otp +otpExpiresAt');
  if (!user) throw new HttpError(404, 'User Not Found');

  const valid = !!user.otp && !!user.otpExpiresAt && user.otpExpiresAt > new Date() && safeEqual(otp, user.otp);
  if (!valid) throw new HttpError(401, 'OTP invalid');

  // Single use: clear before issuing the token.
  await User.updateOne({ _id: user._id }, { $unset: { otp: 1, otpExpiresAt: 1 } });

  const profile = user.toObject();
  delete profile.otp;
  delete profile.otpExpiresAt;
  return { ...profile, token: signToken({ phoneNumber: user.phoneNumber, userId: String(user._id) }) };
}

async function getOwnUser(id: string, authPhoneNumber: string) {
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'User not found');
  if (user.phoneNumber !== authPhoneNumber) throw new HttpError(403, 'Forbidden');
  return user;
}

export async function updateOwnUser(id: string, authPhoneNumber: string, body: UpdateUserBody) {
  const user = await getOwnUser(id, authPhoneNumber);
  user.set(body);
  return user.save();
}

export async function deleteOwnUser(id: string, authPhoneNumber: string): Promise<void> {
  const user = await getOwnUser(id, authPhoneNumber);
  await user.deleteOne();
}
