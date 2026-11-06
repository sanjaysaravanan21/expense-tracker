import type { Request, RequestHandler } from 'express';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { getEnv } from '@/config/env';

interface LimiterOptions {
  windowMs: number;
  max: number;
  // Adds the phone number to the key so one attacker cannot lock out everyone behind a shared IP.
  perPhone?: boolean;
}

export function createLimiter({ windowMs, max, perPhone = false }: LimiterOptions): RequestHandler {
  return rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later' },
    keyGenerator: (req: Request) => {
      const ip = ipKeyGenerator(req.ip ?? '');
      const phone = perPhone && typeof req.body?.phoneNumber === 'string' ? req.body.phoneNumber : '';
      return phone ? `${ip}:${phone}` : ip;
    },
  });
}

const WINDOW_MS = 15 * 60 * 1000;
const sendOtpLimiter = createLimiter({ windowMs: WINDOW_MS, max: 5, perPhone: true });
const verifyOtpLimiter = createLimiter({ windowMs: WINDOW_MS, max: 10, perPhone: true });
const registerLimiter = createLimiter({ windowMs: WINDOW_MS, max: 10 });

// Limits stay off in tests so unrelated suites can call the endpoints freely.
const unlessTest =
  (limiter: RequestHandler): RequestHandler =>
  (req, res, next) =>
    getEnv().NODE_ENV === 'test' ? next() : limiter(req, res, next);

export const sendOtpRateLimit = unlessTest(sendOtpLimiter);
export const verifyOtpRateLimit = unlessTest(verifyOtpLimiter);
export const registerRateLimit = unlessTest(registerLimiter);
