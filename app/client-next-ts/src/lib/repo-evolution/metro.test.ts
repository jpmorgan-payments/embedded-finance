import { describe, expect, it } from 'vitest';

import { REPO_EVOLUTION } from '@/data/repo-evolution.generated';

import { GUTTER, labelWidth, layoutMetro, MAX_TEXT_SCALE } from './metro';

const data = REPO_EVOLUTION;
const layout = layoutMetro(data);

describe('repo-evolution subway layout', () => {
  it('gives every month a contiguous slice of the x axis, then the planned zone', () => {
    expect(layout.months).toHaveLength(data.months.length);
    expect(layout.months[0].x).toBe(layout.x0);
    layout.months.forEach((m, i) => {
      expect(m.width).toBeGreaterThan(0);
      const next = layout.months[i + 1];
      if (next) expect(next.x).toBeCloseTo(m.x + m.width);
    });
    const last = layout.months[layout.months.length - 1];
    expect(last.x + last.width).toBeCloseTo(layout.futureX);
    expect(layout.x1).toBeGreaterThan(layout.futureX);
  });

  it('places stations in order, history inside its month, planned after today', () => {
    layout.stations.forEach((s, i) => {
      const m = data.milestones[i];
      if (i > 0) expect(s.x).toBeGreaterThan(layout.stations[i - 1].x);
      if (m.kind === 'planned') {
        expect(m.date).toBeNull();
        expect(s.x).toBeGreaterThan(layout.futureX);
        expect(s.x).toBeLessThan(layout.x1);
      } else {
        const month = layout.months[m.month ?? -1];
        expect(s.x).toBeGreaterThan(month.x);
        expect(s.x).toBeLessThan(month.x + month.width);
      }
      if (m.line === null) {
        expect(s.lane).toBeNull();
      } else {
        const line = layout.lines.find((l) => l.id === m.line);
        expect(s.y).toBe(line?.y);
        expect(s.x).toBeGreaterThan(line?.startX ?? Infinity);
      }
    });
  });

  it('extends only lines with planned stations into the planned zone', () => {
    for (const line of layout.lines) {
      const hasPlans = data.milestones.some(
        (m) => m.kind === 'planned' && m.line === line.id
      );
      expect(line.future !== null).toBe(hasPlans);
      expect(line.d.endsWith(`L ${layout.futureX} ${line.y}`)).toBe(true);
    }
  });

  it('branches each line off a parent that is already open', () => {
    for (const l of data.lines) {
      const line = layout.lines.find((x) => x.id === l.id);
      if (!l.branchFrom) {
        expect(line?.terminusX).toBe(line?.startX);
        continue;
      }
      const parent = layout.lines.find((x) => x.id === l.branchFrom);
      expect(line?.terminusX).toBeNull();
      expect(line?.startX).toBeGreaterThan(parent?.startX ?? Infinity);
      expect(line?.d.startsWith(`M ${line?.startX} ${parent?.y} L`)).toBe(true);
    }
  });

  it.each([1, 1.2, MAX_TEXT_SCALE])(
    'never lets two placed labels overlap at text scale %s, and names every express stop',
    (scale) => {
      const scaled = layoutMetro(data, scale);
      expect(scaled.width).toBe(layout.width);
      const placed = scaled.stations.flatMap((s, i) => {
        if (!s.labelSide || !s.labelY) return [];
        const w = labelWidth(data.milestones[i].label, s.kind, scale);
        return [
          {
            y: s.labelY[s.labelSide],
            from: s.labelX - w / 2,
            to: s.labelX + w / 2,
          },
        ];
      });
      for (const a of placed) {
        expect(a.from).toBeGreaterThanOrEqual(GUTTER);
        expect(a.to).toBeLessThanOrEqual(scaled.width);
        for (const b of placed) {
          if (a === b || a.y !== b.y) continue;
          expect(a.from < b.to && b.from < a.to).toBe(false);
        }
      }
      scaled.stations.forEach((s, i) => {
        if (s.kind === 'express' && s.lane !== null) {
          expect(s.labelSide, data.milestones[i].id).not.toBeNull();
        }
      });
    }
  );

  it('labels a year at its first month', () => {
    expect(layout.years[0]).toEqual({
      x: layout.x0,
      label: data.months[0].key.slice(0, 4),
    });
    expect(layout.years.map((y) => y.label)).toEqual([
      ...new Set(data.months.map((m) => m.key.slice(0, 4))),
    ]);
  });
});
