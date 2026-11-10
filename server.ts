import { createApp } from '@/app/app';
import { getEnv } from '@/config/env';
import { connectDbOrMock, disconnectDb } from '@/lib/db';

async function main() {
  const { PORT } = getEnv();
  const mode = await connectDbOrMock();
  console.warn(mode === 'mongo' ? 'Connected to MongoDB' : 'Running with mock data (login with 9999999999, OTP 123456)');

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
