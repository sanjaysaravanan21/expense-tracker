import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { getEnv } from '@/config/env';
import { healthRouter } from '@/features/health/health.routes';
import { itemRouter } from '@/features/items/item.routes';
import { isMockMode } from '@/lib/db';
import { mockItemRouter } from '@/mock/mock-items.routes';
import { mockUserRouter } from '@/mock/mock-users.routes';
import { userRouter } from '@/features/users/user.routes';
import { errorHandler, notFoundHandler } from './error-handler';
import { requestLogger } from './request-logger';

function corsOrigins(): string[] | true {
  const origins = getEnv()
    .CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return origins.includes('*') ? true : origins;
}

// Builds the app without touching the database so it can be tested in isolation.
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', getEnv().TRUST_PROXY);
  app.use(helmet());
  app.use(cors({ origin: corsOrigins() }));
  app.use(express.json({ limit: '100kb' }));
  app.use(requestLogger);

  app.use('/server', healthRouter);
  // Decided once at startup (see connectDbOrMock); mock routers serve in-memory dummy data.
  app.use('/users', isMockMode() ? mockUserRouter : userRouter);
  app.use('/items', isMockMode() ? mockItemRouter : itemRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
