import { describe, expect, it } from 'vitest';

import { parseCountCsv, parseReferrerCsv } from './parse';

describe('parseCountCsv', () => {
  it('reads the embedded-finance daily format', () => {
    const r = parseCountCsv(`repository_name,date,views,unique_visitors/cloners
embedded-banking,2024-01-18,24,3
embedded-banking,2024-01-17,8,2`);
    expect(r.points).toEqual([
      { date: '2024-01-17', count: 8, uniques: 2 },
      { date: '2024-01-18', count: 24, uniques: 3 },
    ]);
    expect(r.names).toEqual([
      { name: 'embedded-banking', from: '2024-01-17', to: '2024-01-18' },
    ]);
  });

  it('reads the unicorn-finance snapshot format', () => {
    const r = parseCountCsv(`Date,Total Clones,Unique Clones
2025-11-15 06:08:01,114,55`);
    expect(r.points).toEqual([{ date: '2025-11-15', count: 114, uniques: 55 }]);
    expect(r.names).toEqual([]);
  });

  it('keeps the last snapshot of a day and records renames', () => {
    const r = parseCountCsv(`repository_name,date,views,unique_visitors/cloners
jpmorgan-payments/pdp-skills,2026-08-20 05:14:37,400,100
jpmorgan-payments/pdp-skills,2026-08-20 06:09:05,423,105
jpmorgan-payments/ai,2026-09-17 06:00:00,900,200`);
    expect(r.points).toEqual([
      { date: '2026-08-20', count: 423, uniques: 105 },
      { date: '2026-09-17', count: 900, uniques: 200 },
    ]);
    expect(r.names.map((n) => n.name)).toEqual([
      'jpmorgan-payments/pdp-skills',
      'jpmorgan-payments/ai',
    ]);
  });

  it('skips rows without a valid date or counts', () => {
    const r = parseCountCsv(`repository_name,date,clones,unique_cloners
r,2024-07-01,10,4
r,not-a-date,1,1
r,2024-07-02,x,1`);
    expect(r.points).toEqual([{ date: '2024-07-01', count: 10, uniques: 4 }]);
    expect(r.skippedRows).toBe(2);
  });
});

describe('parseReferrerCsv', () => {
  it('reads undated referrers', () => {
    expect(
      parseReferrerCsv(`repository_name,site,views,unique_visitors/cloners
embedded-banking,github.com,28,21`)
    ).toEqual([{ date: null, site: 'github.com', count: 28, uniques: 21 }]);
  });

  it('reads dated referrers and drops the no-referrers marker', () => {
    expect(
      parseReferrerCsv(`Date,Referrer,Count,Uniques
2025-11-15 06:08:02,no-referrers,0,0
2026-10-05 06:33:22,Google,11,6`)
    ).toEqual([{ date: '2026-10-05', site: 'Google', count: 11, uniques: 6 }]);
  });
});
