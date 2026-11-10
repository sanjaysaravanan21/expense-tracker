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

  it('only allows the disabled mail transport when NODE_ENV is test', () => {
    expect(() => parseEnv({ ...valid, MAIL_TRANSPORT: 'disabled' })).toThrow(/MAIL_TRANSPORT/);
    expect(() => parseEnv({ ...valid, NODE_ENV: 'production', CORS_ORIGIN: 'https://a.com', MAIL_TRANSPORT: 'disabled' })).toThrow(
      /MAIL_TRANSPORT/,
    );
    expect(parseEnv({ ...valid, NODE_ENV: 'test', MAIL_TRANSPORT: 'disabled' }).MAIL_TRANSPORT).toBe('disabled');
  });

  it('coerces PORT to a number', () => {
    expect(parseEnv({ ...valid, PORT: '8080' }).PORT).toBe(8080);
  });

  it('reports every problem with the variable name, without echoing secret values', () => {
    const run = () => parseEnv({ DB_URL: 'mongodb://localhost/db', JWT_SECRET: 'short' });
    expect(run).toThrow(/JWT_SECRET/);
    expect(run).not.toThrow(/short/);
  });

  it('requires DB_URL in production', () => {
    expect(() => parseEnv({ NODE_ENV: 'production', JWT_SECRET: 'a-secret-with-16+chars' })).toThrow(/DB_URL/);
  });

  it('allows a missing DB_URL outside production for mock data', () => {
    const env = parseEnv({});
    expect(env.DB_URL).toBeUndefined();
    expect(env.MOCK_DATA).toBe('auto');
  });
});
