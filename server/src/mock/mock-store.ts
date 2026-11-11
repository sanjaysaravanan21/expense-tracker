import { randomBytes } from 'node:crypto';
import { ITEM_CATEGORIES } from '@/features/items/item.schema';
import { getWeekDay } from '@/utils/dates';

export type MockItem = {
  category: string;
  amount: number;
  type: string;
  date: string;
  time: string;
  paidTo?: string | undefined;
  weekDay: string;
  _id?: string;
};

export type MockUser = { _id: string; fullName: string; phoneNumber: string; email: string };

export const MOCK_OTP = '123456';
export const DEMO_PHONE = '9999999999';

const newId = () => randomBytes(12).toString('hex');

const itemsByPhone = new Map<string, (MockItem & { _id: string })[]>();
const generatedDatesByPhone = new Map<string, Set<string>>();
const users = new Map<string, MockUser>();

function seedUsers(): void {
  users.set(DEMO_PHONE, { _id: newId(), fullName: 'Demo User', phoneNumber: DEMO_PHONE, email: 'demo@example.com' });
}
seedUsers();

export function itemsFor(phoneNumber: string): (MockItem & { _id: string })[] {
  let items = itemsByPhone.get(phoneNumber);
  if (!items) {
    items = [];
    itemsByPhone.set(phoneNumber, items);
  }
  return items;
}

export function itemsForDates(phoneNumber: string, dates: string[]): (MockItem & { _id: string })[] {
  const items = itemsFor(phoneNumber);
  let generatedDates = generatedDatesByPhone.get(phoneNumber);
  if (!generatedDates) {
    generatedDates = new Set();
    generatedDatesByPhone.set(phoneNumber, generatedDates);
  }
  for (const date of dates) {
    if (generatedDates.has(date)) continue;
    const category = ITEM_CATEGORIES[Math.floor(Math.random() * ITEM_CATEGORIES.length)];
    if (category === undefined) throw new Error('Failed to select a mock item category');
    items.push({
      _id: newId(),
      category,
      amount: Math.floor(Math.random() * 1000) + 1,
      type: 'expense',
      date,
      time: '12:00',
      weekDay: getWeekDay(date),
    });
    generatedDates.add(date);
  }
  const requestedDates = new Set(dates);
  return items.filter((item) => requestedDates.has(item.date));
}

export function generateId(): string {
  return newId();
}

export function findUser(phoneNumber: string): MockUser | undefined {
  return users.get(phoneNumber);
}

export function saveUser(user: Omit<MockUser, '_id'>): MockUser {
  const saved = { ...user, _id: newId() };
  users.set(user.phoneNumber, saved);
  return saved;
}

export function removeUser(phoneNumber: string): void {
  users.delete(phoneNumber);
}

export function resetMockStore(): void {
  itemsByPhone.clear();
  generatedDatesByPhone.clear();
  users.clear();
  seedUsers();
}
