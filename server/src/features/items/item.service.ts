import { HttpError } from '@/lib/http-error';
import { getDatesOfMonth, getDatesOfWeek, getWeekDay } from '@/utils/dates';
import { Item } from './item.model';
import type { CreateItemBody, UpdateItemBody } from './item.schema';

const PUBLIC_FIELDS = { _id: 0, __v: 0 } as const;

type DayTotal = { amount: number; date: string; weekDay: string };

async function findInDates(phoneNumber: string, dates: string[]) {
  return Item.find({ phoneNumber, date: { $in: dates } }, PUBLIC_FIELDS, { sort: { date: 1 } }).lean();
}

function summarize(dates: string[], items: { amount: number; date: string }[]) {
  const totals = new Map<string, number>();
  for (const { date, amount } of items) totals.set(date, (totals.get(date) ?? 0) + amount);

  const series: DayTotal[] = dates.map((date) => ({ amount: totals.get(date) ?? 0, date, weekDay: getWeekDay(date) }));
  const totalAmount = series.reduce((sum, day) => sum + day.amount, 0);
  return { series, totalAmount };
}

export async function getDay(phoneNumber: string, date: string) {
  const items = await Item.find({ phoneNumber, date }, PUBLIC_FIELDS).lean();
  return { totalAmount: items.reduce((sum, item) => sum + item.amount, 0), items };
}

export async function getWeek(phoneNumber: string, startDate: string) {
  const dates = getDatesOfWeek(startDate);
  const items = await findInDates(phoneNumber, dates);
  const { series, totalAmount } = summarize(dates, items);
  return { weekData: series, items, totalAmount };
}

export async function getMonth(phoneNumber: string, startDate: string) {
  const dates = getDatesOfMonth(startDate);
  const items = await findInDates(phoneNumber, dates);
  const { series, totalAmount } = summarize(dates, items);
  return { monthData: series, items, totalAmount };
}

export async function createItem(phoneNumber: string, body: CreateItemBody) {
  return Item.create({ ...body, phoneNumber });
}

export async function updateItem(phoneNumber: string, id: string, body: UpdateItemBody) {
  const item = await Item.findOneAndUpdate({ _id: id, phoneNumber }, body, { returnDocument: 'after', runValidators: true });
  if (!item) throw new HttpError(404, 'Item not found');
  return item;
}

export async function deleteItem(phoneNumber: string, id: string): Promise<void> {
  const item = await Item.findOneAndDelete({ _id: id, phoneNumber });
  if (!item) throw new HttpError(404, 'Item not found');
}
