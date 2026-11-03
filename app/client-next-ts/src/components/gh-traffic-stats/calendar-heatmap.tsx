import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';

import { addDays, WEEKDAYS } from '@/lib/gh-metrics/derive';
import { formatDay, formatNumber } from '@/lib/gh-metrics/format';
import { weekStart } from '@/lib/gh-metrics/weekly';

/** One-hue sequential ramp, light → dark (step 100 → 650). */
const RAMP = ['#cde2fb', '#86b6ef', '#3987e5', '#256abf', '#104281'];
const CELL = 12;
const GAP = 3;
const LEFT = 30;
const TOP = 16;

export interface CalendarCell {
  date: string;
  value: number | null;
}

interface CalendarHeatmapProps {
  cells: CalendarCell[];
  end: string;
  weeks?: number;
  unit: string;
}

/** Quantile thresholds over non-zero values so a few spikes don't wash out the rest. */
function thresholds(values: number[]): number[] {
  const sorted = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return [1, 1, 1];
  const q = (p: number) => sorted[Math.floor(p * (sorted.length - 1))];
  return [q(0.25), q(0.5), q(0.75)];
}

function bucket(value: number, cuts: number[]): number {
  if (value <= 0) return 0;
  if (value <= cuts[0]) return 1;
  if (value <= cuts[1]) return 2;
  if (value <= cuts[2]) return 3;
  return 4;
}

/**
 * GitHub-style calendar: one column per week (Monday on top). Days the
 * collector missed are hatched rather than drawn as zero.
 */
export function CalendarHeatmap({
  cells,
  end,
  weeks = 53,
  unit,
}: CalendarHeatmapProps) {
  const [hover, setHover] = useState<CalendarCell | null>(null);

  const grid = useMemo(() => {
    const byDate = new Map(cells.map((c) => [c.date, c]));
    const first = addDays(weekStart(end), -(weeks - 1) * 7);
    const cuts = thresholds(cells.map((c) => c.value ?? 0));
    const columns: {
      x: number;
      month: string | null;
      days: { date: string; y: number; cell: CalendarCell | null }[];
    }[] = [];
    let lastMonth = '';
    for (let w = 0; w < weeks; w += 1) {
      const monday = addDays(first, w * 7);
      const month = monday.slice(0, 7);
      columns.push({
        x: LEFT + w * (CELL + GAP),
        month: month !== lastMonth && w < weeks - 2 ? month : null,
        days: Array.from({ length: 7 }, (_, d) => {
          const date = addDays(monday, d);
          return {
            date,
            y: TOP + d * (CELL + GAP),
            cell: date > end ? null : (byDate.get(date) ?? null),
          };
        }),
      });
      lastMonth = month;
    }
    return { columns, cuts };
  }, [cells, end, weeks]);

  const width = LEFT + weeks * (CELL + GAP);
  const height = TOP + 7 * (CELL + GAP);
  const legend = [
    `0`,
    `1–${formatNumber(grid.cuts[0])}`,
    `${formatNumber(grid.cuts[0] + 1)}–${formatNumber(grid.cuts[1])}`,
    `${formatNumber(grid.cuts[1] + 1)}–${formatNumber(grid.cuts[2])}`,
    `${formatNumber(grid.cuts[2] + 1)}+`,
  ];

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ minWidth: width }}
          role="img"
          aria-label={`Calendar of ${unit} per day for the last ${weeks} weeks`}
          className="block h-auto w-full"
          onPointerLeave={() => setHover(null)}
        >
          <defs>
            <pattern
              id="gh-cal-hatch"
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="4" height="4" fill="#f0efec" />
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="4"
                stroke="#c3c2b7"
                strokeWidth="1.5"
              />
            </pattern>
          </defs>
          {[0, 2, 4].map((d) => (
            <text
              key={d}
              x={0}
              y={TOP + d * (CELL + GAP) + CELL - 2}
              className="fill-muted-foreground text-[10px]"
            >
              {WEEKDAYS[d]}
            </text>
          ))}
          {grid.columns.map((col) => (
            <g key={col.x}>
              {col.month && (
                <text
                  x={col.x}
                  y={10}
                  className="fill-muted-foreground text-[10px]"
                >
                  {format(parseISO(`${col.month}-01`), 'MMM')}
                </text>
              )}
              {col.days.map(({ date, y, cell }) => {
                if (date > end) return null;
                const value = cell?.value ?? null;
                return (
                  <rect
                    key={date}
                    x={col.x}
                    y={y}
                    width={CELL}
                    height={CELL}
                    rx={2.5}
                    fill={
                      value === null
                        ? 'url(#gh-cal-hatch)'
                        : RAMP[bucket(value, grid.cuts)]
                    }
                    stroke={hover?.date === date ? '#0b0b0b' : 'none'}
                    strokeWidth={1.5}
                    onPointerEnter={() => setHover({ date, value })}
                  />
                );
              })}
            </g>
          ))}
        </svg>
      </div>
      <div className="flex h-5 flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {hover
            ? hover.value === null
              ? `${formatDay(hover.date)} · not collected`
              : `${formatDay(hover.date)} · ${formatNumber(hover.value)} ${unit}`
            : 'Hover a day for its count.'}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width={CELL} height={CELL} aria-hidden>
            <rect
              width={CELL}
              height={CELL}
              rx={2.5}
              fill="url(#gh-cal-hatch)"
            />
          </svg>
          Not collected
          <span className="ml-2">Fewer</span>
          {RAMP.map((color, i) => (
            <span
              key={color}
              title={legend[i]}
              className="inline-block h-3 w-3 rounded-[3px]"
              style={{ backgroundColor: color }}
            />
          ))}
          More
        </span>
      </div>
    </div>
  );
}
