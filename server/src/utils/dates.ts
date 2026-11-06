export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

export function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function toDate(value: string): Date {
  if (!isValidDateString(value)) throw new RangeError(`Invalid date: ${value}`);
  return new Date(`${value}T00:00:00.000Z`);
}

const format = (date: Date): string => date.toISOString().slice(0, 10);

// All arithmetic is in UTC so results do not depend on the server time zone.
export function getDatesOfWeek(startDate: string): string[] {
  const start = toDate(startDate).getTime();
  return Array.from({ length: 7 }, (_, i) => format(new Date(start + i * DAY_MS)));
}

export function getDatesOfMonth(anyDateInMonth: string): string[] {
  const date = toDate(anyDateInMonth);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return Array.from({ length: daysInMonth }, (_, i) => format(new Date(Date.UTC(year, month, i + 1))));
}

export function getWeekDay(date: string): (typeof WEEK_DAYS)[number] {
  return WEEK_DAYS[toDate(date).getUTCDay()] as (typeof WEEK_DAYS)[number];
}
