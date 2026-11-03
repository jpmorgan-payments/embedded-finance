import { describe, expect, it } from 'vitest';

import { addDays, buildDaily, windowsFromSnapshots } from './derive';
import type { CountPoint, ParsedSeries } from './parse';
import {
  weekEndSnapshots,
  weeklyTotals,
  weekOverWeek,
  weekStart,
} from './weekly';

function series(points: CountPoint[]): ParsedSeries {
  return { points, names: [], skippedRows: 0 };
}

function days(from: string, values: number[], uniques = 2): CountPoint[] {
  return values.map((count, i) => ({
    date: addDays(from, i),
    count,
    uniques,
  }));
}

describe('weekStart', () => {
  it('returns the Monday of the week', () => {
    expect(weekStart('2026-10-26')).toBe('2026-10-26'); // Monday
    expect(weekStart('2026-11-01')).toBe('2026-10-26'); // Sunday
    expect(weekStart('2026-11-03')).toBe('2026-11-02'); // Tuesday
  });
});

describe('weeklyTotals', () => {
  // Mon Oct 19 .. Tue Nov 3: two full weeks and two days of a third.
  const views = days('2026-10-19', [
    ...[1, 2, 3, 4, 5, 6, 7],
    ...[10, 10, 10, 10, 10, 30, 10],
    ...[4, 6],
  ]);
  const clones = days(
    '2026-10-19',
    Array.from({ length: 16 }, (_, i) => (i === 3 ? 200 : 1)),
    1
  );
  const weeks = weeklyTotals(buildDaily(series(views), series(clones)));

  it('groups days into Monday–Sunday weeks', () => {
    expect(weeks.map((w) => [w.start, w.end, w.views])).toEqual([
      ['2026-10-19', '2026-10-25', 28],
      ['2026-10-26', '2026-11-01', 90],
      ['2026-11-02', '2026-11-08', 10],
    ]);
  });

  it('flags complete and in-progress weeks', () => {
    expect(weeks.map((w) => [w.complete, w.inProgress])).toEqual([
      [true, false],
      [true, false],
      [false, true],
    ]);
    expect(weeks[2].observedDays).toBe(2);
  });

  it('keeps the peak day, median daily uniques and automation days', () => {
    expect(weeks[1].peak).toEqual({ date: '2026-10-31', views: 30 });
    expect(weeks[0].visitorsPerDay).toBe(2);
    expect(weeks[0].automationDays).toBe(1);
    expect(weeks[1].automationDays).toBe(0);
  });

  it('compares complete weeks only', () => {
    expect(weekOverWeek(weeks, 0)).toBeNull();
    expect(weekOverWeek(weeks, 1)).toBeCloseTo(90 / 28 - 1);
    expect(weekOverWeek(weeks, 2)).toBeNull();
  });

  it('does not count a week with a missed day as complete', () => {
    const gappy = days('2026-10-19', [1, 1, 1, 1, 1, 1, 1, 1]).filter(
      (p) => p.date !== '2026-10-21'
    );
    const [week] = weeklyTotals(buildDaily(series(gappy), series([])));
    expect(week.observedDays).toBe(6);
    expect(week.complete).toBe(false);
  });

  it('returns nothing for an empty series', () => {
    expect(weeklyTotals([])).toEqual([]);
  });
});

describe('weekEndSnapshots', () => {
  // Daily 14-day snapshots from Sun Sep 6 to Tue Nov 3, views rising by 1 a day.
  const snapshots = days(
    '2026-09-06',
    Array.from({ length: 59 }, (_, i) => 100 + i),
    5
  ).filter((p) => p.date !== '2026-10-25'); // a missed Sunday
  const windows = windowsFromSnapshots(series(snapshots), series([]));
  const rows = weekEndSnapshots(windows);

  it('starts with the latest snapshot, then one row per earlier Sunday', () => {
    expect(rows[0]).toMatchObject({
      end: '2026-11-03',
      latest: true,
      views: 158,
    });
    expect(rows.slice(1).map((r) => r.end)).toEqual([
      '2026-11-01',
      '2026-10-25',
      '2026-10-18',
      '2026-10-11',
      '2026-10-04',
      '2026-09-27',
      '2026-09-20',
    ]);
  });

  it('falls back to a snapshot one day off a missed Sunday', () => {
    expect(rows[2]).toMatchObject({ end: '2026-10-25', date: '2026-10-24' });
  });

  it('compares each row with the non-overlapping window 14 days earlier', () => {
    expect(rows[1].views).toBe(156);
    expect(rows[1].previousViews).toBe(142);
    expect(rows[7].previousViews).toBe(100);
  });

  it('returns nothing without snapshots', () => {
    expect(weekEndSnapshots([])).toEqual([]);
  });
});
