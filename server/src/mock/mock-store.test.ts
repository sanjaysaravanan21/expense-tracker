import { afterEach, describe, expect, it, vi } from 'vitest';
import { itemsFor, itemsForDates, resetMockStore } from './mock-store';

afterEach(() => {
  vi.restoreAllMocks();
  resetMockStore();
});

describe('mock item generation', () => {
  it('uses random values for each new date and does not regenerate deleted data', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.5);

    const items = itemsForDates('9000000021', ['2024-12-31', '2025-01-01']);
    expect(items.map(({ category, amount }) => ({ category, amount }))).toEqual([
      { category: 'EB', amount: 1 },
      { category: 'clothing', amount: 501 },
    ]);

    itemsFor('9000000021').splice(0, 1);
    expect(itemsForDates('9000000021', ['2024-12-31'])).toEqual([]);
    expect(Math.random).toHaveBeenCalledTimes(4);
  });
});
