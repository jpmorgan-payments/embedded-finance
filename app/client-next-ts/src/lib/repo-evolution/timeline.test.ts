import { describe, expect, it } from 'vitest';

import { REPO_EVOLUTION } from '@/data/repo-evolution.generated';

import { layoutMetro } from './metro';
import {
  buildTimeline,
  DEFAULT_TOTAL_SEC,
  frameAt,
  INTRO_SEC,
  milestoneTime,
  nextMilestone,
  playheadX,
  previousMilestone,
  statsAt,
} from './timeline';

const data = REPO_EVOLUTION;
const layout = layoutMetro(data);
const timeline = buildTimeline(layout);
const indexOf = (kind: string) =>
  data.milestones.findIndex((m) => m.kind === kind);

describe('repo-evolution timeline', () => {
  it('plays the whole story in at most 60 seconds', () => {
    expect(timeline.total).toBeLessThanOrEqual(DEFAULT_TOTAL_SEC);
    expect(timeline.segments).toHaveLength(data.months.length);
    const last = timeline.segments[timeline.segments.length - 1];
    expect(last.start + last.duration).toBeCloseTo(timeline.futureStart);
    expect(timeline.futureStart).toBeLessThan(timeline.monthsEnd);
  });

  it('runs intro → history → planned → outro', () => {
    expect(frameAt(timeline, 0).phase).toBe('intro');
    expect(frameAt(timeline, INTRO_SEC + 0.01).phase).toBe('months');
    expect(frameAt(timeline, timeline.futureStart + 0.01).phase).toBe('future');
    expect(frameAt(timeline, timeline.total).phase).toBe('outro');
  });

  it('sweeps the playhead across the map at constant speed', () => {
    expect(playheadX(timeline, 0)).toBe(layout.x0);
    expect(playheadX(timeline, timeline.total)).toBe(layout.x1);
    const mid = (timeline.monthsStart + timeline.monthsEnd) / 2;
    expect(playheadX(timeline, mid)).toBeCloseTo((layout.x0 + layout.x1) / 2);
  });

  it('reaches each station exactly when the playhead does, history in its own month', () => {
    data.milestones.forEach((m, i) => {
      const t = milestoneTime(timeline, i);
      const frame = frameAt(timeline, t);
      expect(frame.milestone).toBe(i);
      expect(playheadX(timeline, t)).toBeGreaterThanOrEqual(
        layout.stations[i].x
      );
      if (m.month !== null) expect(frame.month).toBe(m.month);
      else expect(frame.phase).toBe('future');
    });
  });

  it('captions express and planned stops, and rides past local ones', () => {
    const local = indexOf('local');
    const frame = frameAt(timeline, milestoneTime(timeline, local));
    expect(frame.milestone).toBe(local);
    expect(frame.caption).not.toBe(local);
    expect(data.milestones[frame.caption ?? 0].kind).toBe('express');

    const planned = indexOf('planned');
    expect(frameAt(timeline, milestoneTime(timeline, planned)).caption).toBe(
      planned
    );
  });

  it('steps forward and back between all stations', () => {
    const t1 = milestoneTime(timeline, 1);
    expect(nextMilestone(timeline, t1)).toBe(2);
    expect(previousMilestone(timeline, t1)).toBe(0);
    expect(nextMilestone(timeline, timeline.total)).toBeNull();
  });

  it('accumulates commits and PRs to the repository totals', () => {
    const final = statsAt(data, data.months.length - 1 + 0.9999);
    expect(final.commits).toBe(data.totals.commits);
    expect(final.prs).toBe(data.totals.prs);
    expect(statsAt(data, 0).commits).toBe(0);
    const outro = frameAt(timeline, timeline.total);
    expect(statsAt(data, outro.monthFloat).commits).toBe(data.totals.commits);
    expect(outro.month).toBe(data.months.length - 1);
  });

  it('keeps generated references consistent and free of author data', () => {
    const ids = new Set(data.lines.map((l) => l.id));
    for (const m of data.milestones) {
      if (m.line !== null) expect(ids.has(m.line)).toBe(true);
      if (m.kind === 'planned') {
        expect(m.source?.path).toBeTruthy();
        expect(m.source?.line).toBeGreaterThan(0);
      } else {
        expect(m.month).toBeGreaterThanOrEqual(0);
        expect(m.month).toBeLessThan(data.months.length);
        expect(m.sha).toMatch(/^[0-9a-f]{8}$/);
      }
    }
    for (const l of data.lines) {
      if (l.branchFrom) expect(ids.has(l.branchFrom)).toBe(true);
    }
    expect(JSON.stringify(data)).not.toMatch(/author|@users\.noreply|email/i);
  });
});
