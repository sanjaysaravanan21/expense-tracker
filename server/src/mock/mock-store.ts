import { randomBytes } from 'node:crypto';
import { getWeekDay } from '@/utils/dates';
import seed from './items.seed.json';

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
// Pre-registered account that owns the seeded data; every other user starts empty.
export const DEMO_PHONE = '9999999999';

const DAY_MS = 24 * 60 * 60 * 1000;
const toMs = (date: string) => Date.parse(`${date}T00:00:00.000Z`);
const newId = () => randomBytes(12).toString('hex');

// Shifts the static seed so its latest entry is today, keeping the UI populated whenever it is run.
function buildSeed(): MockItem[] {
  const latest = Math.max(...seed.map((item) => toMs(item.date)));
  const today = toMs(new Date().toISOString().slice(0, 10));
  const shiftDays = Math.round((today - latest) / DAY_MS);
  return seed.map((item) => {
    const date = new Date(toMs(item.date) + shiftDays * DAY_MS).toISOString().slice(0, 10);
    return { ...item, date, weekDay: getWeekDay(date) };
  });
}

const itemsByPhone = new Map<string, (MockItem & { _id: string })[]>();
const users = new Map<string, MockUser>();

function seedUsers(): void {
  users.set(DEMO_PHONE, { _id: newId(), fullName: 'Demo User', phoneNumber: DEMO_PHONE, email: 'demo@example.com' });
}
seedUsers();

export function itemsFor(phoneNumber: string): (MockItem & { _id: string })[] {
  let items = itemsByPhone.get(phoneNumber);
  if (!items) {
    items = phoneNumber === DEMO_PHONE ? buildSeed().map((item) => ({ ...item, _id: newId() })) : [];
    itemsByPhone.set(phoneNumber, items);
  }
  return items;
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
  users.clear();
  seedUsers();
}
