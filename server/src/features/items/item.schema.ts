import { z } from 'zod';
import { isValidDateString } from '@/utils/dates';

export const ITEM_CATEGORIES = [
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
] as const;

export const ITEM_TYPES = ['expense', 'income'] as const;

export const TIME_PATTERN = /^(?:[01]\d|2[0-3]):?[0-5]\d$/;

const dateString = z.string().refine(isValidDateString, 'Expected a valid date in YYYY-MM-DD format');

export const createItemBody = z.object({
  category: z.enum(ITEM_CATEGORIES),
  amount: z.coerce.number().positive().finite(),
  type: z.enum(ITEM_TYPES),
  date: dateString,
  time: z.string().regex(TIME_PATTERN, 'Expected a 24-hour time such as 18:30'),
  paidTo: z.string().trim().max(200).optional(),
});

export const updateItemBody = createItemBody
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

export const itemIdParams = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id') });
export const dateParams = z.object({ date: dateString });
export const startDateParams = z.object({ startDate: dateString });

export type CreateItemBody = z.infer<typeof createItemBody>;
export type UpdateItemBody = z.infer<typeof updateItemBody>;
