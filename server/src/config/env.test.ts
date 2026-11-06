import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

const valid = { DB_URL: 'mongodb://localhost/db', JWT_SECRET: 'a-secret-with-16+chars' };

describe('parseEnv', () => {
  it('applies defaults', () => {
    const env = parseEnv(valid);
    expect(env).toMatchObject({
      PORT: 4500,
      NODE_ENV: 'development',
      CORS_ORIGIN: '*',
      JWT_EXPIRES_IN: '7d',
      TRUST_PROXY: 0,
    });
  });

  it('rejects a wildcard CORS origin in production', () => {
    expect(() => parseEnv({ ...valid, NODE_ENV: 'production' })).toThrow(/CORS_ORIGIN/);
    expect(() => parseEnv({ ...valid, NODE_ENV: 'production', CORS_ORIGIN: 'https://a.com, *' })).toThrow(/CORS_ORIGIN/);
    expect(parseEnv({ ...valid, NODE_ENV: 'production', CORS_ORIGIN: 'https://a.com' }).CORS_ORIGIN).toBe('https://a.com');
  });

  it('coerces PORT to a number', () => {
    expect(parseEnv({ ...valid, PORT: '8080' }).PORT).toBe(8080);
  });

  it('reports every problem with the variable name, without echoing secret values', () => {
    const run = () => parseEnv({ JWT_SECRET: 'short' });
    expect(run).toThrow(/DB_URL/);
    expect(run).toThrow(/JWT_SECRET/);
    expect(run).not.toThrow(/short/);
  });
});
