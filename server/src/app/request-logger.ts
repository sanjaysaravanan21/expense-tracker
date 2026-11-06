import type { RequestHandler } from 'express';

// Logs method and path only: no query strings, headers or bodies (they can hold tokens and OTPs).
export const requestLogger: RequestHandler = (req, _res, next) => {
  console.warn(new Date().toISOString(), req.method, req.path);
  next();
};
