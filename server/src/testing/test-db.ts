import mongoose from 'mongoose';
import { afterAll, beforeAll, beforeEach } from 'vitest';

export const TEST_DB_URL = process.env.TEST_DB_URL;

// Integration tests need a real MongoDB; they are skipped unless TEST_DB_URL is set.
export function useTestDb(name: string): void {
  beforeAll(async () => {
    await mongoose.connect(`${TEST_DB_URL}/${name}-${process.pid}`);
  });

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
}
