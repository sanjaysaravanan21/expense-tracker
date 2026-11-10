import mongoose from 'mongoose';
import { E2E_DB_URL, assertSafeDbUrl } from './env';

// Short-lived connection straight to the dedicated E2E database (never the app's DB_URL).
export async function withE2eDb<T>(fn: (db: mongoose.mongo.Db) => Promise<T>): Promise<T> {
  assertSafeDbUrl(E2E_DB_URL);
  const connection = await mongoose.createConnection(E2E_DB_URL).asPromise();
  try {
    return await fn(connection.db!);
  } finally {
    await connection.close();
  }
}

export async function dropE2eDb(): Promise<void> {
  await withE2eDb((db) => db.dropDatabase());
}

// The API runs with MAIL_TRANSPORT=disabled, so the OTP it generated is read from the test database.
export async function readOtp(phoneNumber: string): Promise<string> {
  const user = await withE2eDb((db) => db.collection('users').findOne({ phoneNumber }));
  if (!user?.otp) throw new Error(`No OTP stored for ${phoneNumber}`);
  return String(user.otp);
}

export async function findItemId(phoneNumber: string, paidTo: string): Promise<string> {
  const item = await withE2eDb((db) => db.collection('items').findOne({ phoneNumber, paidTo }));
  if (!item) throw new Error(`No item for ${phoneNumber} / ${paidTo}`);
  return String(item._id);
}
