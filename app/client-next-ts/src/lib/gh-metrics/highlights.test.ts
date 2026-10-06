import { describe, expect, it } from 'vitest';

import { addDays } from './derive';
import { formatChange, formatSpan } from './format';
import { buildHighlights } from './highlights';
import type { ParsedSeries } from './parse';
import { buildRepoView } from './repo-view';
import { REPO_SOURCES } from './sources';

const [efSource, ufSource, aiSource] = REPO_SOURCES;

function series(
  from: string,
  values: (number | null)[],
  uniques = 1
): ParsedSeries {
  return {
    points: values.flatMap((count, i) =>
      count === null ? [] : [{ date: addDays(from, i), count, uniques }]
    ),
    names: [],
    skippedRows: 0,
  };
}

const constant = (n: number, value: number) => Array<number>(n).fill(value);
const blank = (n: number) => Array<null>(n).fill(null);

describe('buildRepoView', () => {
  it('derives 14-day totals for a daily repo and keeps uniques unknown', () => {
    const view = buildRepoView(
      efSource,
      series('2026-09-01', constant(28, 10)),
      series('2026-09-01', constant(28, 2)),
      []
    );
    expect(view.latestViews).toMatchObject({
      date: '2026-09-28',
      current: 140,
      previous: 140,
      change: 0,
    });
    expect(view.latestVisitors).toBeNull();
    expect(view.collectedDays).toBe(28);
    expect(view.gaps).toEqual([]);
  });

  it('uses GitHub totals for a snapshot repo and reports gaps', () => {
    const view = buildRepoView(
      ufSource,
      series('2026-09-01', [43, ...constant(13, 50), null, null, 357], 87),
      series('2026-09-01', [100, ...constant(13, 120), null, null, 511], 216),
      []
    );
    expect(view.latestViews).toMatchObject({
      date: '2026-09-17',
      current: 357,
      previous: 50,
    });
    expect(view.latestVisitors).toBe(87);
    expect(view.latestCloners).toBe(216);
    expect(view.gaps).toEqual([
      { from: '2026-09-15', to: '2026-09-16', days: 2 },
    ]);
  });
});

describe('buildHighlights', () => {
  it('names the top repo, the biggest mover and long collection gaps', () => {
    const ef = buildRepoView(
      efSource,
      series('2026-08-01', [
        ...constant(30, 10),
        ...blank(10),
        ...constant(28, 10),
      ]),
      series('2026-08-01', [
        ...constant(30, 1),
        ...blank(10),
        ...constant(28, 1),
      ]),
      []
    );
    const uf = buildRepoView(
      ufSource,
      series('2026-09-21', [40, ...constant(13, 40), 360]),
      series('2026-09-21', constant(15, 10)),
      []
    );
    const ai = buildRepoView(
      aiSource,
      series('2026-10-05', [1106]),
      series('2026-10-05', [194]),
      []
    );

    const highlights = buildHighlights([ef, uf, ai]);
    const byId = Object.fromEntries(highlights.map((h) => [h.id, h]));

    expect(byId['top-repo'].text).toBe(
      'ai had the most views in the latest 14 days: 1,106 (unicorn-finance 360, embedded-finance 140).'
    );
    expect(byId.mover).toMatchObject({
      tone: 'up',
      text: 'unicorn-finance: 40 → 360 views versus the previous 14 days (9.0×).',
    });
    expect(byId.gap.text).toBe(
      'embedded-finance has no data for Aug 31 – Sep 9, 2026 (10 days). Charts leave missing days blank instead of showing zero.'
    );
  });

  it('returns nothing to say for a single empty repo', () => {
    const view = buildRepoView(
      aiSource,
      series('2026-10-05', []),
      series('2026-10-05', []),
      []
    );
    expect(buildHighlights([view])).toEqual([]);
  });
});

describe('format', () => {
  it('formats changes and spans', () => {
    expect(formatChange(0.25)).toBe('+25%');
    expect(formatChange(-0.4)).toBe('−40%');
    expect(formatChange(7.3)).toBe('8.3×');
    expect(formatSpan('2026-02-05', '2026-05-13')).toBe('Feb 5 – May 13, 2026');
    expect(formatSpan('2025-12-30', '2026-01-02')).toBe(
      'Dec 30, 2025 – Jan 2, 2026'
    );
  });
});
