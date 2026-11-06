import { describe, expect, it } from 'vitest';
import { getDatesOfMonth, getDatesOfWeek, getWeekDay, isValidDateString } from './dates';

describe('dates', () => {
  it('validates real calendar dates only', () => {
    expect(isValidDateString('2024-02-29')).toBe(true);
    expect(isValidDateString('2023-02-29')).toBe(false);
    expect(isValidDateString('2024-13-01')).toBe(false);
    expect(isValidDateString('24-1-1')).toBe(false);
  });

  it('returns 7 consecutive days starting at the given date, across a month boundary', () => {
    expect(getDatesOfWeek('2024-09-29')).toEqual([
      '2024-09-29',
      '2024-09-30',
      '2024-10-01',
      '2024-10-02',
      '2024-10-03',
      '2024-10-04',
      '2024-10-05',
    ]);
  });

  it('returns every day of the month for any date inside it, including leap years', () => {
    const feb = getDatesOfMonth('2024-02-10');
    expect(feb).toHaveLength(29);
    expect(feb[0]).toBe('2024-02-01');
    expect(feb.at(-1)).toBe('2024-02-29');
    expect(getDatesOfMonth('2023-02-01')).toHaveLength(28);
    expect(getDatesOfMonth('2024-12-31')).toHaveLength(31);
  });

  it('maps dates to week days independent of time zone', () => {
    expect(getWeekDay('2024-09-29')).toBe('Sun');
    expect(getWeekDay('2024-10-05')).toBe('Sat');
  });

  it('rejects invalid input', () => {
    expect(() => getDatesOfWeek('nope')).toThrow(RangeError);
  });
});
