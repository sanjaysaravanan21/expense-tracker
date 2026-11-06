import { beforeEach } from 'vitest';
import { resetEnvCache } from '@/config/env';

export const TEST_ENV = {
  NODE_ENV: 'test',
  PORT: '4500',
  DB_URL: 'mongodb://localhost:27017/expense-tracker-test',
  JWT_SECRET: 'test-secret-with-at-least-16-chars',
  JWT_EXPIRES_IN: '1h',
  CORS_ORIGIN: '*',
} as const;

Object.assign(process.env, TEST_ENV);

beforeEach(() => {
  Object.assign(process.env, TEST_ENV);
  resetEnvCache();
});
