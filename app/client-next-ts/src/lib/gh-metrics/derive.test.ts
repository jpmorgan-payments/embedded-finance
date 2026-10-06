import { describe, expect, it } from 'vitest';

import {
  addDays,
  buildDaily,
  cloneBursts,
  compareLatestWindow,
  findGaps,
  gapsInRange,
  inRange,
  monthlyTotals,
  sumWindow,
  trailingMean,
  weekdayIndex,
  weekdayProfile,
  windowsFromDaily,
  windowsFromSnapshots,
  workweekSplit,
  yearOverYear,
  type DailyPoint,
  type WindowPoint,
} from './derive';
import type { ParsedSeries } from './parse';

function series(entries: [string, number, number][]): ParsedSeries {
  return {
    points: entries.map(([date, count, uniques]) => ({ date, count, uniques })),
    names: [],
    skippedRows: 0,
  };
}

function days(from: string, n: number, views = 10, clones = 2): DailyPoint[] {
  return Array.from({ length: n }, (_, i) => ({
    date: addDays(from, i),
    observed: true,
    views,
    visitors: 1,
    clones,
    cloners: 1,
  }));
}

const missing = (date: string): DailyPoint => ({
  date,
  observed: false,
  views: null,
  visitors: null,
  clones: null,
  cloners: null,
});

describe('date helpers', () => {
  it('adds days across month and DST boundaries', () => {
    expect(addDays('2026-03-07', 2)).toBe('2026-03-09');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('indexes weekdays from Monday', () => {
    expect(weekdayIndex('2026-10-05')).toBe(0); // Monday
    expect(weekdayIndex('2026-10-04')).toBe(6); // Sunday
  });
});

describe('buildDaily', () => {
  it('treats a day present in either file as collected and missing values as zero', () => {
    const daily = buildDaily(
      series([['2024-01-01', 5, 2]]),
      series([
        ['2024-01-02', 3, 1],
        ['2024-01-04', 1, 1],
      ])
    );
    expect(daily.map((d) => [d.date, d.observed, d.views, d.clones])).toEqual([
      ['2024-01-01', true, 5, 0],
      ['2024-01-02', true, 0, 3],
      ['2024-01-03', false, null, null],
      ['2024-01-04', true, 0, 1],
    ]);
  });

  it('returns nothing for empty input', () => {
    expect(buildDaily(series([]), series([]))).toEqual([]);
  });
});

describe('windowsFromDaily', () => {
  it('sums 14 collected days and blanks windows that touch a gap', () => {
    const daily = [...days('2024-01-01', 15), missing('2024-01-16')];
    const w = windowsFromDaily(daily);
    expect(w[12].views).toBeNull();
    expect(w[13]).toMatchObject({ views: 140, clones: 28, visitors: null });
    expect(w[14].views).toBe(140);
    expect(w[15].views).toBeNull();
  });
});

describe('windowsFromSnapshots', () => {
  it('keeps GitHub totals and leaves days without a snapshot empty', () => {
    const w = windowsFromSnapshots(
      series([
        ['2025-11-15', 156, 16],
        ['2025-11-17', 140, 15],
      ]),
      series([['2025-11-15', 114, 55]])
    );
    expect(w).toEqual([
      {
        date: '2025-11-15',
        views: 156,
        visitors: 16,
        clones: 114,
        cloners: 55,
      },
      {
        date: '2025-11-16',
        views: null,
        visitors: null,
        clones: null,
        cloners: null,
      },
      {
        date: '2025-11-17',
        views: 140,
        visitors: 15,
        clones: null,
        cloners: null,
      },
    ]);
  });
});

describe('compareLatestWindow', () => {
  const point = (date: string, views: number | null): WindowPoint => ({
    date,
    views,
    visitors: null,
    clones: null,
    cloners: null,
  });

  it('compares with the window 14 days earlier', () => {
    expect(
      compareLatestWindow(
        [point('2026-09-21', 40), point('2026-10-05', 360)],
        'views'
      )
    ).toEqual({
      date: '2026-10-05',
      current: 360,
      previousDate: '2026-09-21',
      previous: 40,
      change: 8,
    });
  });

  it('accepts a snapshot one day off and skips trailing empty days', () => {
    const r = compareLatestWindow(
      [
        point('2026-09-20', 50),
        point('2026-10-04', 100),
        point('2026-10-05', null),
      ],
      'views'
    );
    expect(r).toMatchObject({ current: 100, previousDate: '2026-09-20' });
  });

  it('reports no change when there is no earlier window', () => {
    expect(
      compareLatestWindow([point('2026-10-05', 10)], 'views')
    ).toMatchObject({ previous: null, change: null });
    expect(compareLatestWindow([point('2026-10-05', null)], 'views')).toBe(
      null
    );
  });
});

describe('findGaps / gapsInRange', () => {
  it('groups consecutive missing days', () => {
    const gaps = findGaps([
      { date: '2026-02-04', observed: true },
      { date: '2026-02-05', observed: false },
      { date: '2026-02-06', observed: false },
      { date: '2026-02-07', observed: true },
      { date: '2026-02-08', observed: false },
    ]);
    expect(gaps).toEqual([
      { from: '2026-02-05', to: '2026-02-06', days: 2 },
      { from: '2026-02-08', to: '2026-02-08', days: 1 },
    ]);
    expect(gapsInRange(gaps, '30d', '2026-03-09')).toHaveLength(1);
    expect(gapsInRange(gaps, 'all', '2026-03-09')).toHaveLength(2);
  });
});

describe('monthlyTotals', () => {
  it('labels complete, partial, missing and in-progress months', () => {
    const daily = [
      ...days('2024-01-17', 15), // Jan 17-31
      ...days('2024-02-01', 29),
      ...Array.from({ length: 31 }, (_, i) =>
        missing(addDays('2024-03-01', i))
      ),
      ...days('2024-04-01', 10),
    ];
    const months = monthlyTotals(daily);
    expect(months.map((m) => [m.month, m.status, m.views])).toEqual([
      ['2024-01', 'partial', 150],
      ['2024-02', 'complete', 290],
      ['2024-03', 'no-data', null],
      ['2024-04', 'in-progress', 100],
    ]);
  });
});

describe('weekday statistics', () => {
  it('computes medians per weekday and weekday vs weekend', () => {
    // 2026-09-07 is a Monday; weekends get 1 view
    const daily = Array.from({ length: 28 }, (_, i) => {
      const date = addDays('2026-09-07', i);
      return { ...days(date, 1)[0], views: weekdayIndex(date) < 5 ? 40 : 1 };
    });
    const profile = weekdayProfile(daily);
    expect(profile[0]).toEqual({ day: 'Mon', median: 40, samples: 4 });
    expect(profile[6]).toEqual({ day: 'Sun', median: 1, samples: 4 });
    expect(workweekSplit(daily)).toEqual({
      weekdayMedian: 40,
      weekendMedian: 1,
    });
    expect(workweekSplit(daily.slice(0, 3))).toBeNull();
  });
});

describe('sumWindow / yearOverYear', () => {
  it('compares the latest 28 days with the same weekdays a year earlier', () => {
    const daily = [
      ...days('2025-08-01', 60, 20),
      ...days(addDays('2025-08-01', 60), 340, 5),
    ];
    const last = daily[daily.length - 1].date;
    expect(sumWindow(daily, last, 28, 'views')).toBe(140);
    expect(yearOverYear(daily)).toMatchObject({
      end: last,
      previousEnd: addDays(last, -364),
      current: 140,
      previous: 560,
      days: 28,
    });
  });

  it('returns null when a window was not fully collected', () => {
    const daily = [...days('2026-01-01', 10), missing('2026-01-11')];
    expect(sumWindow(daily, '2026-01-11', 3, 'views')).toBeNull();
    expect(yearOverYear(daily)).toBeNull();
  });
});

describe('cloneBursts', () => {
  it('counts days where each cloner averages 10+ clones', () => {
    const daily = [
      { ...days('2026-09-10', 1)[0], clones: 1552, cloners: 14 },
      { ...days('2026-09-11', 1)[0], clones: 863, cloners: 840 },
      { ...days('2026-09-12', 1)[0], clones: 50, cloners: 1 },
    ];
    expect(cloneBursts(daily)).toEqual({
      days: 1,
      burstClones: 1552,
      totalClones: 2465,
    });
  });
});

describe('trailingMean / inRange', () => {
  it('averages only fully collected windows', () => {
    const daily = [...days('2026-01-01', 7, 7), missing('2026-01-08')];
    const mean = trailingMean(daily, 'views', 7);
    expect(mean[5]).toBeNull();
    expect(mean[6]).toBe(7);
    expect(mean[7]).toBeNull();
  });

  it('filters to the range ending on the given day', () => {
    const daily = days('2026-01-01', 100);
    expect(inRange(daily, '30d', '2026-04-10')).toHaveLength(30);
    expect(inRange(daily, 'all', '2026-04-10')).toHaveLength(100);
  });
});
