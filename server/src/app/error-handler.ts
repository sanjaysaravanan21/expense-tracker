import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { ZodError } from 'zod';
import { HttpError } from '@/lib/http-error';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ message: 'Not Found' });
};

const hasProp = <K extends string>(value: unknown, key: K, expected: unknown): boolean =>
  typeof value === 'object' && value !== null && (value as Record<K, unknown>)[key] === expected;

// Clients only ever see { message } (plus field errors for validation); internals are logged, not leaked.
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      errors: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: error.message });
    return;
  }
  if (hasProp(error, 'code', 11000)) {
    res.status(409).json({ message: 'Resource already exists' });
    return;
  }
  if (hasProp(error, 'type', 'entity.parse.failed')) {
    res.status(400).json({ message: 'Malformed JSON body' });
    return;
  }

  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
};
