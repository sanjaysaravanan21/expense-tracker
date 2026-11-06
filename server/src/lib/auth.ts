import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getEnv } from '@/config/env';
import { HttpError } from './http-error';

const tokenPayloadSchema = z.object({ phoneNumber: z.string().min(1), userId: z.string().optional() });

export type AuthContext = z.infer<typeof tokenPayloadSchema>;

export function signToken(payload: AuthContext): string {
  const { JWT_SECRET, JWT_EXPIRES_IN } = getEnv();
  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): AuthContext {
  const decoded = jwt.verify(token, getEnv().JWT_SECRET, { algorithms: ['HS256'] });
  return tokenPayloadSchema.parse(decoded);
}

// Accepts the raw token (what the client sends today) or "Bearer <token>".
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization?.trim();
  const token = header?.replace(/^Bearer\s+/i, '');
  if (!token) return next(new HttpError(401, 'Unauthorized'));

  try {
    res.locals.auth = verifyToken(token);
    next();
  } catch {
    next(new HttpError(401, 'Unauthorized'));
  }
}

// The authenticated identity comes only from the verified token, never from the request body.
export function getAuth(res: Response): AuthContext {
  const auth = res.locals.auth as AuthContext | undefined;
  if (!auth) throw new HttpError(401, 'Unauthorized');
  return auth;
}
