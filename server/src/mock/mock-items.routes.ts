import { Router } from 'express';
import { getAuth, requireAuth } from '@/lib/auth';
import { HttpError } from '@/lib/http-error';
import { createItemBody, dateParams, itemIdParams, startDateParams, updateItemBody } from '@/features/items/item.schema';
import { getDatesOfMonth, getDatesOfWeek, getWeekDay } from '@/utils/dates';
import { generateId, itemsFor, type MockItem } from './mock-store';

export const mockItemRouter = Router();

mockItemRouter.use(requireAuth);

const publicItem = ({ _id: _omit, ...item }: MockItem) => item;
const sum = (items: { amount: number }[]) => items.reduce((total, item) => total + item.amount, 0);

function summarize(phoneNumber: string, dates: string[]) {
  const items = itemsFor(phoneNumber)
    .filter((item) => dates.includes(item.date))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(publicItem);
  const series = dates.map((date) => ({
    amount: sum(items.filter((item) => item.date === date)),
    date,
    weekDay: getWeekDay(date),
  }));
  return { series, items, totalAmount: sum(series) };
}

mockItemRouter.get('/day/:date', (req, res) => {
  const { date } = dateParams.parse(req.params);
  const items = itemsFor(getAuth(res).phoneNumber)
    .filter((item) => item.date === date)
    .map(publicItem);
  res.json({ totalAmount: sum(items), items });
});

mockItemRouter.get('/week/:startDate', (req, res) => {
  const { startDate } = startDateParams.parse(req.params);
  const { series, items, totalAmount } = summarize(getAuth(res).phoneNumber, getDatesOfWeek(startDate));
  res.json({ weekData: series, items, totalAmount });
});

mockItemRouter.get('/month/:startDate', (req, res) => {
  const { startDate } = startDateParams.parse(req.params);
  const { series, items, totalAmount } = summarize(getAuth(res).phoneNumber, getDatesOfMonth(startDate));
  res.json({ monthData: series, items, totalAmount });
});

mockItemRouter.post('/', (req, res) => {
  const body = createItemBody.parse(req.body);
  const item = { ...body, weekDay: getWeekDay(body.date), _id: generateId() };
  itemsFor(getAuth(res).phoneNumber).push(item);
  res.status(201).json(item);
});

mockItemRouter.put('/:id', (req, res) => {
  const { id } = itemIdParams.parse(req.params);
  const body = updateItemBody.parse(req.body);
  const item = itemsFor(getAuth(res).phoneNumber).find((candidate) => candidate._id === id);
  if (!item) throw new HttpError(404, 'Item not found');
  Object.assign(item, body);
  item.weekDay = getWeekDay(item.date);
  res.json(item);
});

mockItemRouter.delete('/:id', (req, res) => {
  const { id } = itemIdParams.parse(req.params);
  const items = itemsFor(getAuth(res).phoneNumber);
  const index = items.findIndex((candidate) => candidate._id === id);
  if (index === -1) throw new HttpError(404, 'Item not found');
  items.splice(index, 1);
  res.json({ message: 'Item deleted successfully' });
});
