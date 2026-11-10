import dotenv from 'dotenv';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4500),
    // Optional only so the API can serve mock data for frontend work; required in production.
    DB_URL: z.string().min(1).optional(),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').optional(),
    // "auto" falls back to mock data when the DB is missing/unreachable; "always" skips the DB; "never" disables mock data.
    MOCK_DATA: z.enum(['auto', 'always', 'never']).default('auto'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    // Comma-separated allowlist. "*" is only accepted outside production.
    CORS_ORIGIN: z.string().default('*'),
    // Number of reverse proxies in front of the app (needed for correct client IPs when rate limiting).
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    MAIL_USER: z.string().optional(),
    MAIL_KEY: z.string().optional(),
    // "disabled" skips delivery so end-to-end tests can read the OTP from the test database.
    MAIL_TRANSPORT: z.enum(['gmail', 'disabled']).default('gmail'),
  })
  .refine((env) => env.NODE_ENV !== 'production' || !!env.DB_URL, {
    path: ['DB_URL'],
    message: 'DB_URL is required in production',
  })
  .refine((env) => !env.DB_URL || !!env.JWT_SECRET, {
    path: ['JWT_SECRET'],
    message: 'JWT_SECRET must be at least 16 characters',
  })
  .refine((env) => env.NODE_ENV === 'test' || env.MAIL_TRANSPORT !== 'disabled', {
    path: ['MAIL_TRANSPORT'],
    message: '"disabled" is only allowed when NODE_ENV=test',
  })
  .refine((env) => env.NODE_ENV !== 'production' || !env.CORS_ORIGIN.split(',').some((o) => o.trim() === '*'), {
    path: ['CORS_ORIGIN'],
    message: 'must list explicit origins in production; "*" is not allowed',
  })
  // Mock mode never touches real data, so a fixed development secret is acceptable there.
  // Production never falls back to mock data.
  .transform((env) => ({
    ...env,
    JWT_SECRET: env.JWT_SECRET ?? 'mock-mode-development-secret',
    MOCK_DATA: env.NODE_ENV === 'production' ? ('never' as const) : env.MOCK_DATA,
  }));

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return result.data;
}

let cached: Env | undefined;

// Loads .env (if present) once and validates it; the only place that reads process.env.
export function getEnv(): Env {
  if (!cached) {
    dotenv.config({ quiet: true });
    cached = parseEnv(process.env);
  }
  return cached;
}

export function resetEnvCache(): void {
  cached = undefined;
}
