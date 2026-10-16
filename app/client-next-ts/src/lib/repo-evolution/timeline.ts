import type { MetroLayout } from './metro';
import type { RepoEvolutionData } from './types';

export const INTRO_SEC = 3;
export const OUTRO_SEC = 3;
export const DEFAULT_TOTAL_SEC = 60;

export interface MonthSegment {
  month: number;
  start: number;
  duration: number;
}

/** Play time is linear in map x, so the playhead sweeps at a constant speed. */
export interface Timeline {
  total: number;
  monthsStart: number;
  /** When the playhead passes "today" into the planned zone. */
  futureStart: number;
  monthsEnd: number;
  x0: number;
  x1: number;
  segments: MonthSegment[];
  /** Play-time (s) at which the playhead reaches each station (data.milestones order). */
  milestoneStarts: number[];
  /** Whether a station gets a caption during playback (express and planned stops). */
  captioned: boolean[];
}

export type Phase = 'intro' | 'months' | 'future' | 'outro';

export interface Frame {
  t: number;
  phase: Phase;
  /** 0..months.length, fractional inside a month; months.length once history is done. */
  monthFloat: number;
  month: number;
  /** Last station the playhead has reached, of any kind. */
  milestone: number | null;
  /** Last captioned station the playhead has reached. */
  caption: number | null;
  /** 0..1 progress through the intro or outro. */
  phaseProgress: number;
}

export function buildTimeline(
  layout: MetroLayout,
  total = DEFAULT_TOTAL_SEC
): Timeline {
  const monthsStart = INTRO_SEC;
  const monthsEnd = total - OUTRO_SEC;
  const k = (monthsEnd - monthsStart) / Math.max(1, layout.x1 - layout.x0);
  const timeOf = (x: number) => monthsStart + (x - layout.x0) * k;
  return {
    total,
    monthsStart,
    futureStart: timeOf(layout.futureX),
    monthsEnd,
    x0: layout.x0,
    x1: layout.x1,
    segments: layout.months.map((m, month) => ({
      month,
      start: timeOf(m.x),
      duration: m.width * k,
    })),
    milestoneStarts: layout.stations.map((s) => timeOf(s.x)),
    captioned: layout.stations.map((s) => s.kind !== 'local'),
  };
}

export function playheadX(timeline: Timeline, t: number): number {
  const { monthsStart, monthsEnd, x0, x1 } = timeline;
  const k = Math.min(
    1,
    Math.max(0, (t - monthsStart) / (monthsEnd - monthsStart))
  );
  return x0 + k * (x1 - x0);
}

export function frameAt(timeline: Timeline, rawT: number): Frame {
  const t = Math.max(0, Math.min(timeline.total, rawT));
  const { segments } = timeline;
  let phase: Phase = 'months';
  let monthFloat = segments.length;
  let phaseProgress = 0;

  if (t < timeline.monthsStart) {
    phase = 'intro';
    monthFloat = 0;
    phaseProgress = t / timeline.monthsStart;
  } else if (t >= timeline.monthsEnd) {
    phase = 'outro';
    phaseProgress = Math.min(
      1,
      (t - timeline.monthsEnd) /
        Math.max(0.001, timeline.total - timeline.monthsEnd)
    );
  } else if (t >= timeline.futureStart) {
    phase = 'future';
  } else {
    const seg =
      segments.find((s) => t < s.start + s.duration) ??
      segments[segments.length - 1];
    monthFloat = seg.month + (t - seg.start) / seg.duration;
  }

  let milestone: number | null = null;
  let caption: number | null = null;
  if (phase !== 'intro') {
    timeline.milestoneStarts.forEach((start, i) => {
      if (t < start) return;
      milestone = i;
      if (timeline.captioned[i]) caption = i;
    });
  }

  return {
    t,
    phase,
    monthFloat,
    month: Math.min(segments.length - 1, Math.floor(monthFloat)),
    milestone,
    caption,
    phaseProgress,
  };
}

/** Time to seek to for milestone `i` (just as the playhead reaches its station). */
export function milestoneTime(timeline: Timeline, i: number): number {
  return timeline.milestoneStarts[i] + 0.001;
}

export function nextMilestone(timeline: Timeline, t: number): number | null {
  const i = timeline.milestoneStarts.findIndex((s) => s > t + 0.01);
  return i < 0 ? null : i;
}

export function previousMilestone(
  timeline: Timeline,
  t: number
): number | null {
  for (let i = timeline.milestoneStarts.length - 1; i >= 0; i -= 1) {
    if (timeline.milestoneStarts[i] < t - 0.01) return i;
  }
  return null;
}

export function monthTime(timeline: Timeline, month: number): number {
  const seg =
    timeline.segments[
      Math.max(0, Math.min(timeline.segments.length - 1, month))
    ];
  return seg.start + seg.duration * 0.999;
}

export interface CumulativeStats {
  commits: number;
  prs: number;
  version: string | null;
}

export function statsAt(
  data: RepoEvolutionData,
  monthFloat: number
): CumulativeStats {
  const last = data.months.length - 1;
  const month = Math.max(0, Math.min(last, Math.floor(monthFloat)));
  const frac = Math.min(1, Math.max(0, monthFloat - month));
  let commits = 0;
  let prs = 0;
  for (let i = 0; i < month; i += 1) {
    commits += data.months[i].commits;
    prs += data.months[i].prs;
  }
  commits += data.months[month].commits * frac;
  prs += data.months[month].prs * frac;
  return {
    commits: Math.round(commits),
    prs: Math.round(prs),
    version: data.months[month].version,
  };
}

export function formatMonth(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
