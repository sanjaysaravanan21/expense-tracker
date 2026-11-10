import { dropE2eDb } from './db';

export default async function globalSetup(): Promise<void> {
  await dropE2eDb();
}
