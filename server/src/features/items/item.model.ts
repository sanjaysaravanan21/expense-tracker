import mongoose from 'mongoose';
import { ITEM_CATEGORIES, ITEM_TYPES, TIME_PATTERN } from './item.schema';
import { DATE_PATTERN } from '@/utils/dates';

const itemSchema = new mongoose.Schema(
  {
    category: { type: String, enum: ITEM_CATEGORIES, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ITEM_TYPES, required: true },
    date: { type: String, required: true, match: DATE_PATTERN },
    time: { type: String, required: true, match: TIME_PATTERN },
    paidTo: { type: String, required: false },
    weekDay: { type: String, required: false },
    phoneNumber: { type: String, required: true },
  },
  { timestamps: true },
);

// Every read is scoped to a user and a date range.
itemSchema.index({ phoneNumber: 1, date: 1 });

export const Item = mongoose.model('Item', itemSchema);
