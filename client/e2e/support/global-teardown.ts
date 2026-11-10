import { dropE2eDb } from './db';

export default async function globalTeardown(): Promise<void> {
  await dropE2eDb();
}
