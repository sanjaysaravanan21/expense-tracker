import { z } from 'zod';

export const PHONE_PATTERN = /^\d{10}$/;
export const EMAIL_PATTERN = /.+@.+\..+/;

const phoneNumber = z.string().regex(PHONE_PATTERN, 'Expected a 10-digit phone number');

export const registerBody = z.object({
  fullName: z.string().trim().min(1).max(200),
  phoneNumber,
  email: z.string().trim().toLowerCase().regex(EMAIL_PATTERN, 'Invalid email'),
});

export const updateUserBody = registerBody
  .pick({ fullName: true, email: true })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

export const signInBody = z.object({ phoneNumber });
export const verifyOtpBody = z.object({ phoneNumber, otp: z.string().regex(/^\d{6}$/, 'Expected a 6-digit OTP') });
export const userIdParams = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });

export type RegisterBody = z.infer<typeof registerBody>;
export type UpdateUserBody = z.infer<typeof updateUserBody>;
