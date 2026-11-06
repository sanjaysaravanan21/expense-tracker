import { Router } from 'express';
import { getAuth, requireAuth } from '@/lib/auth';
import {
  createItemBody,
  dateParams,
  itemIdParams,
  startDateParams,
  updateItemBody,
} from './item.schema';
import * as items from './item.service';

export const itemRouter = Router();

itemRouter.use(requireAuth);

itemRouter.get('/day/:date', async (req, res) => {
  const { date } = dateParams.parse(req.params);
  res.json(await items.getDay(getAuth(res).phoneNumber, date));
});

itemRouter.get('/week/:startDate', async (req, res) => {
  const { startDate } = startDateParams.parse(req.params);
  res.json(await items.getWeek(getAuth(res).phoneNumber, startDate));
});

itemRouter.get('/month/:startDate', async (req, res) => {
  const { startDate } = startDateParams.parse(req.params);
  res.json(await items.getMonth(getAuth(res).phoneNumber, startDate));
});

itemRouter.post('/', async (req, res) => {
  const body = createItemBody.parse(req.body);
  res.status(201).json(await items.createItem(getAuth(res).phoneNumber, body));
});

itemRouter.put('/:id', async (req, res) => {
  const { id } = itemIdParams.parse(req.params);
  const body = updateItemBody.parse(req.body);
  res.json(await items.updateItem(getAuth(res).phoneNumber, id, body));
});

itemRouter.delete('/:id', async (req, res) => {
  const { id } = itemIdParams.parse(req.params);
  await items.deleteItem(getAuth(res).phoneNumber, id);
  res.json({ message: 'Item deleted successfully' });
});
