import type { RepoEvolutionData, RepoLine, StationKind } from './types';

/** Design-space units (SVG viewBox px). Diagonals run at 45°, so a branch is as wide as it is tall. */
export const LANE_GAP = 56;
export const GUTTER = 168;
export const TOP = 60;
/** Gap between a lane and its label text. */
const LABEL_CLEARANCE = 9;

export const LABEL_STYLE: Record<
  StationKind,
  { size: number; weight: number }
> = {
  express: { size: 13, weight: 700 },
  local: { size: 12, weight: 500 },
  planned: { size: 12, weight: 500 },
};

// Arial advance widths (1/1000 em) for a-z / A-Z; Helvetica shares these metrics.
const AFM = {
  regular: {
    lower: [
      556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
      556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500,
    ],
    upper: [
      667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
      667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611,
    ],
  },
  bold: {
    lower: [
      556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
      611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500,
    ],
    upper: [
      722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
      667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611,
    ],
  },
};
const OTHER_GLYPHS: Record<string, number> = {
  ' ': 278,
  '.': 278,
  ',': 278,
  '-': 333,
  '&': 722,
  '/': 278,
  ':': 333,
};

/** Rendered width of `text` in Arial/Helvetica, in px. */
export function textWidth(text: string, size: number, bold: boolean): number {
  const table = bold ? AFM.bold : AFM.regular;
  let units = 0;
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 97 && code <= 122) units += table.lower[code - 97];
    else if (code >= 65 && code <= 90) units += table.upper[code - 65];
    else if (code >= 48 && code <= 57) units += 556;
    else units += OTHER_GLYPHS[ch] ?? 722;
  }
  return (units * size) / 1000;
}

const STATION_GAP: Record<StationKind, number> = {
  express: 34,
  local: 22,
  planned: 46,
};
const RIGHT = 40;
const MONTH_MIN = 2;
const MONTH_SPAN = 9;
const FUTURE_LEAD = 36;
const TAIL = 24;
/** Room below the last lane for its labels. */
const BOTTOM = 30;
export const LABEL_PAD = 10;

export type LabelSide = 'above' | 'below';

export interface MetroMonth {
  x: number;
  width: number;
}

export interface MetroLine {
  id: string;
  lane: number;
  y: number;
  /** Where the line (or its branch) leaves; the playhead opens it here. */
  startX: number;
  /** x of the terminus bar for lines that do not branch. */
  terminusX: number | null;
  /** Built track, up to today. */
  d: string;
  /** Dashed extension to the line's planned stations, if any. */
  future: string | null;
}

export interface MetroStation {
  kind: StationKind;
  x: number;
  /** null for whole-map markers. */
  lane: number | null;
  y: number | null;
  /** Placed label side, or null when it would collide (shown only while active). */
  labelSide: LabelSide | null;
  labelX: number;
  /** Baselines for both sides, so an active station can show an unplaced label. */
  labelY: Record<LabelSide, number> | null;
  labelSize: number;
}

export interface MetroLayout {
  width: number;
  height: number;
  /** The playhead sweeps x0 → x1; history ends (and the planned zone starts) at futureX. */
  x0: number;
  futureX: number;
  x1: number;
  lanesBottom: number;
  /** Bottom of the year grid, playhead and planned zone. */
  mapBottom: number;
  /** Text scale applied to every SVG label; > 1 keeps them legible when the map is shrunk. */
  textScale: number;
  months: MetroMonth[];
  lines: MetroLine[];
  /** Same order as data.milestones. */
  stations: MetroStation[];
  years: { x: number; label: string }[];
}

type MetroEvent =
  | { kind: 'line'; date: string; month: number; line: RepoLine }
  | { kind: 'station'; date: string; month: number; index: number };

interface Interval {
  from: number;
  to: number;
}

export const labelWidth = (
  label: string,
  kind: StationKind,
  textScale = 1,
  bold = LABEL_STYLE[kind].weight >= 700
) =>
  textWidth(label, LABEL_STYLE[kind].size * textScale, bold) * 1.04 +
  LABEL_PAD * textScale;

/** Largest text scale that still fits two label rows between neighbouring lanes. */
export const MAX_TEXT_SCALE = 1.4;

const overlaps = (row: Interval[], a: Interval) =>
  row.some((b) => a.from < b.to && b.from < a.to);

const LABEL_PRIORITY: StationKind[] = ['express', 'planned', 'local'];

/**
 * Lays the repo out as a subway map. x is story time: each month gets a little room for its
 * commit volume and every station/branch a fixed slot, so quiet stretches stay short. Planned
 * stations follow "today" on dashed extensions. `textScale` only affects labels, never x/y.
 */
export function layoutMetro(
  data: RepoEvolutionData,
  textScale = 1
): MetroLayout {
  const ts = Math.min(MAX_TEXT_SCALE, Math.max(1, textScale));
  const laneOf = new Map(data.lines.map((l, i) => [l.id, i]));
  const yOf = (lane: number) => TOP + lane * LANE_GAP;
  const maxCommits = Math.max(1, ...data.months.map((m) => m.commits));

  const events: MetroEvent[] = [
    ...data.lines.map((line): MetroEvent => ({
      kind: 'line',
      date: line.start,
      month: line.month,
      line,
    })),
    ...data.milestones.flatMap((m, index): MetroEvent[] =>
      m.date !== null && m.month !== null
        ? [{ kind: 'station', date: m.date, month: m.month, index }]
        : []
    ),
  ].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.kind === b.kind ? 0 : a.kind === 'line' ? -1 : 1)
  );

  const opened = new Map<
    string,
    { y: number; startX: number; head: string; terminusX: number | null }
  >();
  const branches: { from: number; to: number; laneA: number; laneB: number }[] =
    [];
  const stationX: number[] = new Array(data.milestones.length).fill(0);
  const months: MetroMonth[] = [];
  const x0 = GUTTER + 12;
  let x = x0;

  const place = (index: number) => {
    const gap = STATION_GAP[data.milestones[index].kind];
    x += gap / 2;
    stationX[index] = x;
    x += gap / 2;
  };

  data.months.forEach((month, mi) => {
    const start = x;
    const base = MONTH_MIN + MONTH_SPAN * Math.sqrt(month.commits / maxCommits);
    x += base / 2;
    for (const e of events) {
      if (e.month !== mi) continue;
      if (e.kind === 'station') {
        place(e.index);
        continue;
      }
      const lane = laneOf.get(e.line.id) ?? 0;
      const y = yOf(lane);
      const parent = e.line.branchFrom
        ? opened.get(e.line.branchFrom)
        : undefined;
      if (parent) {
        const dy = Math.abs(y - parent.y);
        opened.set(e.line.id, {
          y,
          startX: x,
          head: `M ${x} ${parent.y} L ${x + dy} ${y}`,
          terminusX: null,
        });
        const parentLane = laneOf.get(e.line.branchFrom ?? '') ?? lane;
        branches.push({
          from: x,
          to: x + dy,
          laneA: Math.min(lane, parentLane),
          laneB: Math.max(lane, parentLane),
        });
        x += dy;
      } else {
        opened.set(e.line.id, {
          y,
          startX: x,
          head: `M ${x} ${y}`,
          terminusX: x,
        });
      }
    }
    x += base / 2;
    months.push({ x: start, width: x - start });
  });

  const futureX = x;
  const planned = data.milestones.flatMap((m, i) =>
    m.kind === 'planned' ? [i] : []
  );
  if (planned.length > 0) {
    x += FUTURE_LEAD;
    planned.forEach(place);
  }
  x += TAIL;

  const x1 = x;
  const width = x1 + RIGHT;
  const lanesBottom = yOf(data.lines.length - 1);
  const mapBottom = lanesBottom + BOTTOM;

  const lines: MetroLine[] = data.lines.map((l, lane) => {
    const o = opened.get(l.id) ?? {
      y: yOf(lane),
      startX: x0,
      head: `M ${x0} ${yOf(lane)}`,
      terminusX: x0,
    };
    const ahead = planned
      .filter((i) => data.milestones[i].line === l.id)
      .map((i) => stationX[i]);
    return {
      id: l.id,
      lane,
      y: o.y,
      startX: o.startX,
      terminusX: o.terminusX,
      d: `${o.head} L ${futureX} ${o.y}`,
      future:
        ahead.length > 0
          ? `M ${futureX} ${o.y} L ${Math.max(...ahead) + TAIL / 2} ${o.y}`
          : null,
    };
  });

  // Label rows: `${lane}:above|below`. Branch diagonals block every row they cross.
  const rows = new Map<string, Interval[]>();
  const row = (lane: number, side: LabelSide) => {
    const key = `${lane}:${side}`;
    if (!rows.has(key)) rows.set(key, []);
    return rows.get(key) as Interval[];
  };
  for (const b of branches) {
    for (let lane = b.laneA; lane <= b.laneB; lane += 1) {
      const blocked = { from: b.from - 4, to: b.to + 4 };
      if (lane < b.laneB) row(lane, 'below').push(blocked);
      if (lane > b.laneA) row(lane, 'above').push(blocked);
    }
  }

  const stations: MetroStation[] = data.milestones.map((m, i) => {
    const lane = m.line === null ? null : (laneOf.get(m.line) ?? null);
    const y = lane === null ? null : yOf(lane);
    const size = LABEL_STYLE[m.kind].size * ts;
    return {
      kind: m.kind,
      x: stationX[i],
      lane,
      y,
      labelSide: null,
      labelX: stationX[i],
      labelY:
        y === null
          ? null
          : {
              above: y - LABEL_CLEARANCE - size * 0.2,
              below: y + LABEL_CLEARANCE + size * 0.75,
            },
      labelSize: size,
    };
  });

  // Express names claim space first, then planned, then local detail stops.
  for (const kind of LABEL_PRIORITY) {
    stations.forEach((s, i) => {
      if (s.kind !== kind || s.lane === null) return;
      const w = labelWidth(data.milestones[i].label, kind, ts);
      const labelX = Math.min(Math.max(s.x, GUTTER + w / 2), width - w / 2);
      const span = { from: labelX - w / 2, to: labelX + w / 2 };
      const lane = s.lane;
      const side =
        (['above', 'below'] as const).find(
          (sd) => !overlaps(row(lane, sd), span)
        ) ?? null;
      if (side) row(lane, side).push(span);
      s.labelSide = side;
      s.labelX = labelX;
    });
  }

  const years = data.months.flatMap((m, i) =>
    i === 0 || m.key.endsWith('-01')
      ? [{ x: months[i].x, label: m.key.slice(0, 4) }]
      : []
  );

  return {
    width,
    height: mapBottom + 4,
    x0,
    futureX,
    x1,
    lanesBottom,
    mapBottom,
    textScale: ts,
    months,
    lines,
    stations,
    years,
  };
}
