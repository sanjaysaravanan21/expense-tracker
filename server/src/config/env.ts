import dotenv from 'dotenv';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4500),
    DB_URL: z.string().min(1, 'DB_URL is required'),
    JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    // Comma-separated allowlist. "*" is only accepted outside production.
    CORS_ORIGIN: z.string().default('*'),
    // Number of reverse proxies in front of the app (needed for correct client IPs when rate limiting).
    TRUST_PROXY: z.coerce.number().int().min(0).default(0),
    MAIL_USER: z.string().optional(),
    MAIL_KEY: z.string().optional(),
  })
  .refine((env) => env.NODE_ENV !== 'production' || !env.CORS_ORIGIN.split(',').some((o) => o.trim() === '*'), {
    path: ['CORS_ORIGIN'],
    message: 'must list explicit origins in production; "*" is not allowed',
  });

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
