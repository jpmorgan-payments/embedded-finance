import { describe, expect, it } from 'vitest';

import {
  parseCloneStats,
  parseMonthlyCloneStats,
  parseMonthlyTrafficStats,
  parseReferrerStats,
  parseTrafficStats,
  transformCloneData,
  transformMonthlyCloneData,
  transformMonthlyTrafficData,
  transformReferrerData,
  transformTrafficData,
} from './csv-parser';

describe('csv-parser', () => {
  const trafficCsv = `repository_name,date,views,unique_visitors/cloners
repo-a,2024-01-01,10,5`;

  it('parseTrafficStats maps rows via transformTrafficData', () => {
    const r = parseTrafficStats(trafficCsv);
    expect(r.data).toHaveLength(1);
    expect(r.data[0]).toMatchObject({
      repository_name: 'repo-a',
      date: '2024-01-01',
      views: 10,
      unique_visitors: 5,
    });
  });

  it('transformTrafficData accepts unique_visitors column', () => {
    const row = {
      repository_name: 'r',
      date: '2024-02-01',
      views: '3',
      unique_visitors: '2',
    };
    expect(transformTrafficData(row)).toMatchObject({
      views: 3,
      unique_visitors: 2,
    });
  });

  it('transformTrafficData returns null for invalid numbers', () => {
    expect(
      transformTrafficData({
        repository_name: 'r',
        date: '',
        views: '1',
        unique_visitors: '1',
      })
    ).toBeNull();
  });

  const cloneCsv = `repository_name,date,clones,unique_cloners
repo-b,2024-01-02,4,2`;

  it('parseCloneStats maps clone rows', () => {
    const r = parseCloneStats(cloneCsv);
    expect(r.data[0]).toMatchObject({ clones: 4, unique_cloners: 2 });
  });

  it('transformCloneData returns null when date missing', () => {
    expect(
      transformCloneData({
        repository_name: 'r',
        date: '',
        clones: '1',
        unique_cloners: '1',
      })
    ).toBeNull();
  });

  const referrerCsv = `repository_name,site,views,unique_visitors/cloners
repo-c,example.com,5,2`;

  it('parseReferrerStats maps referrer rows', () => {
    const r = parseReferrerStats(referrerCsv);
    expect(r.data[0]?.referrer).toContain('example');
    expect(r.data[0]?.count).toBe(5);
  });

  it('transformReferrerData resolves alternate column names', () => {
    expect(
      transformReferrerData({
        repository_name: 'r',
        referrer: 'x',
        count: '3',
      })
    ).toMatchObject({ referrer: 'x', count: 3 });
  });

  it('transformReferrerData returns null when referrer empty', () => {
    expect(
      transformReferrerData({
        repository_name: 'r',
        site: '',
        views: '0',
      })
    ).toBeNull();
  });

  const monthlyTrafficCsv = `repository_name,month,views,unique_visitors
repo-d,2024-01,100,20`;

  it('parseMonthlyTrafficStats maps monthly traffic', () => {
    const r = parseMonthlyTrafficStats(monthlyTrafficCsv);
    expect(r.data[0]).toMatchObject({ month: '2024-01', views: 100 });
  });

  it('transformMonthlyTrafficData falls back date to month', () => {
    expect(
      transformMonthlyTrafficData({
        repository_name: 'r',
        date: '2024-03',
        views: '1',
        unique_visitors: '1',
      })
    ).toMatchObject({ month: '2024-03' });
  });

  const monthlyCloneCsv = `repository_name,month,clones,unique_cloners
repo-e,2024-02,9,3`;

  it('parseMonthlyCloneStats maps monthly clones', () => {
    const r = parseMonthlyCloneStats(monthlyCloneCsv);
    expect(r.data[0]).toMatchObject({ clones: 9, unique_cloners: 3 });
  });

  it('transformMonthlyCloneData returns null when month invalid', () => {
    expect(
      transformMonthlyCloneData({
        repository_name: 'r',
        month: '',
        clones: '1',
        unique_cloners: '1',
      })
    ).toBeNull();
  });
});
