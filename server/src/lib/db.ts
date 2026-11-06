import mongoose from 'mongoose';
import { getEnv } from '@/config/env';

export async function connectDb(): Promise<void> {
  await mongoose.connect(getEnv().DB_URL);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
