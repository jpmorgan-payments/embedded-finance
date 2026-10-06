import { describe, expect, it } from 'vitest';

import { categorizeReferrer, summarizeReferrers } from './referrers';

describe('categorizeReferrer', () => {
  it.each([
    ['github.com', 'github'],
    ['Google', 'search'],
    ['search.brave.com', 'search'],
    ['m.sogou.com', 'search'],
    ['yandex.ru', 'search'],
    ['chatgpt.com', 'ai'],
    ['gemini.google.com', 'ai'],
    ['copilot.microsoft.com', 'ai'],
    ['l.threads.com', 'social'],
    ['com.linkedin.android', 'social'],
    ['t.co', 'social'],
    ['developer.payments.jpmorgan.com', 'jpm'],
    ['next.embedded-finance-dev.com', 'jpm'],
    ['jpmorganchase.github.io', 'jpm'],
    ['statics.teams.cdn.office.net', 'chat-email'],
    ['teams.public.onecdn.static.microsoft', 'chat-email'],
    ['com.google.android.gm', 'chat-email'],
    ['confluence.prod.aws.jpmchase.net', 'internal'],
    ['sp004.jpmchase.net', 'internal'],
    ['confluence.example.com', 'partner'],
    ['jira.example.eu', 'partner'],
    ['p97.sharepoint.com', 'partner'],
    ['theforage.com', 'other'],
    ['pr-1.abc.amplifyapp.com', 'other'],
  ])('%s -> %s', (site, category) => {
    expect(categorizeReferrer(site)).toBe(category);
  });
});

describe('summarizeReferrers', () => {
  it('uses only the latest dated window and hides intranet host names', () => {
    const s = summarizeReferrers([
      { date: '2026-10-04', site: 'github.com', count: 90, uniques: 50 },
      { date: '2026-10-05', site: 'github.com', count: 100, uniques: 56 },
      { date: '2026-10-05', site: 'Google', count: 30, uniques: 26 },
      { date: '2026-10-05', site: 'Bing', count: 2, uniques: 2 },
      { date: '2026-10-05', site: 'a.jpmchase.net', count: 5, uniques: 1 },
      { date: '2026-10-05', site: 'b.jpmchase.net', count: 1, uniques: 1 },
      { date: '2026-09-01', site: 'old.example.org', count: 9, uniques: 9 },
    ]);
    expect(s.basis).toBe('latest-window');
    expect(s.asOf).toBe('2026-10-05');
    expect(s.total).toBe(138);
    expect(s.sitesEverSeen).toBe(6);
    expect(s.groups.map((g) => [g.category, g.count, g.siteCount])).toEqual([
      ['github', 100, 1],
      ['search', 32, 2],
      ['internal', 6, 2],
    ]);
    expect(s.groups[1].sites.map((x) => x.site)).toEqual(['Google', 'Bing']);
    expect(s.groups[2].sites).toEqual([]);
    expect(JSON.stringify(s.groups)).not.toContain('jpmchase');
  });

  it('falls back to last-seen counts when the source has no dates', () => {
    const s = summarizeReferrers([
      { date: null, site: 'github.com', count: 28, uniques: 21 },
    ]);
    expect(s).toMatchObject({ basis: 'last-seen', asOf: null, total: 28 });
  });
});
