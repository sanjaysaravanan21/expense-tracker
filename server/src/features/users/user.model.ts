import mongoose from 'mongoose';
import { EMAIL_PATTERN, PHONE_PATTERN } from './user.schema';

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phoneNumber: { type: String, required: true, match: PHONE_PATTERN },
    email: { type: String, required: true, unique: true, match: EMAIL_PATTERN },
    // Never returned by default; the service selects them explicitly for OTP checks.
    otp: { type: String, required: false, select: false },
    otpExpiresAt: { type: Date, required: false, select: false },
  },
  { timestamps: true },
);

export const User = mongoose.model('User', userSchema);
