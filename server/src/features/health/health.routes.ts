import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ message: 'I am Up & Running Fine' });
});
