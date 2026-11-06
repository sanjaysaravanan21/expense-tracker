import { createApp } from '@/app/app';
import { getEnv } from '@/config/env';
import { connectDb, disconnectDb } from '@/lib/db';

async function main() {
  const { PORT } = getEnv();
  await connectDb();
  console.warn('Connected to MongoDB');

  const server = createApp().listen(PORT, () => console.warn('Server listening on', PORT));

  const stop = (signal: string) => {
    console.warn(`${signal} received, closing server`);
    server.close(() => void disconnectDb().finally(() => process.exit(0)));
  };
  process.on('SIGINT', () => stop('SIGINT'));
  process.on('SIGTERM', () => stop('SIGTERM'));
}

main().catch((error) => {
  console.error('Failed to start server:', error instanceof Error ? error.message : error);
  process.exit(1);
});
