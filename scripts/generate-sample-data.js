// Generates sample expense data for local development.
// Usage: node scripts/generate-sample-data.js [count] [startDate]
// Writes to scripts/data/sample-items.json (output is generated; import it into your local MongoDB yourself).
/* global console, process */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CATEGORIES = [
  'EB',
  'grocery',
  'health',
  'internet',
  'transport',
  'children',
  'gas',
  'food',
  'entertain',
  'others',
  'decor',
  'clothing',
  'home',
];
const WEEK_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (n) => String(n).padStart(2, '0');

function randomDate(start, spreadDays) {
  const date = new Date(start);
  date.setUTCDate(date.getUTCDate() + randomInt(0, spreadDays));
  return date.toISOString().slice(0, 10);
}

export function generateSampleData(count, startDate) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  return Array.from({ length: count }, (_, i) => {
    const date = randomDate(start, i);
    return {
      category: CATEGORIES[randomInt(0, CATEGORIES.length - 1)],
      amount: randomInt(1, 1000),
      type: Math.random() < 0.5 ? 'expense' : 'income',
      date,
      time: `${pad(randomInt(0, 23))}:${pad(randomInt(0, 59))}`,
      paidTo: Math.random() < 0.5 ? `Vendor ${randomInt(1, 100)}` : 'Sample Vendor',
      weekDay: WEEK_DAYS[new Date(`${date}T00:00:00.000Z`).getUTCDay()],
    };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = Number(process.argv[2] ?? 100);
  const startDate = process.argv[3] ?? '2024-09-18';
  const out = resolve(dirname(fileURLToPath(import.meta.url)), 'data', 'sample-items.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(generateSampleData(count, startDate), null, 2));
  console.log(`Wrote ${count} items to ${out}`);
}
