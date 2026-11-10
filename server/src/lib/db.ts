import mongoose from 'mongoose';
import { getEnv } from '@/config/env';

let mockMode = false;

export function isMockMode(): boolean {
  return mockMode;
}

export async function connectDb(): Promise<void> {
  const { DB_URL } = getEnv();
  if (!DB_URL) throw new Error('DB_URL is not configured');
  await mongoose.connect(DB_URL, { serverSelectionTimeoutMS: 5000 });
}

// Connects to MongoDB, or switches the API to in-memory mock data when it is not configured/reachable.
export async function connectDbOrMock(): Promise<'mongo' | 'mock'> {
  const { MOCK_DATA, DB_URL } = getEnv();
  if (MOCK_DATA === 'always') {
    mockMode = true;
    return 'mock';
  }
  try {
    await connectDb();
    return 'mongo';
  } catch (error) {
    if (MOCK_DATA === 'never') throw error;
    console.warn(
      DB_URL ? 'MongoDB is unreachable' : 'DB_URL is not set',
      '- serving mock data (set MOCK_DATA=never to disable)',
    );
    mockMode = true;
    return 'mock';
  }
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
