export const API_PORT = 4501;
export const WEB_PORT = 4173;
export const API_URL = `http://127.0.0.1:${API_PORT}`;
export const WEB_URL = `http://127.0.0.1:${WEB_PORT}`;

// The database name must end in "-e2e": global setup drops it, so it must never be a real database.
export const E2E_DB_URL = process.env.E2E_DB_URL ?? 'mongodb://127.0.0.1:27017/expense-tracker-e2e';

export function assertSafeDbUrl(url: string): void {
  const name = new URL(url).pathname.replace(/^\//, '');
  if (!name.endsWith('-e2e')) {
    throw new Error(`Refusing to use "${name}" for E2E tests: the database name must end with "-e2e".`);
  }
}
