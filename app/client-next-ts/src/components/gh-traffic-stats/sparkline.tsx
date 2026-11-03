import { useId, useMemo, useState, type PointerEvent } from 'react';

import { formatDay, formatNumber } from '@/lib/gh-metrics/format';

interface SparklineProps {
  points: { date: string; value: number | null }[];
  color: string;
  /** Text shown under the line when nothing is hovered. */
  caption: string;
  unit: string;
  height?: number;
}

const WIDTH = 240;

/**
 * A small area chart with its own y-scale, so a quiet repository's shape is as
 * readable as a busy one's. Missing days break the line. The caption row has a
 * fixed height and doubles as the hover readout.
 */
export function Sparkline({
  points,
  color,
  caption,
  unit,
  height = 44,
}: SparklineProps) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const values = points.map((p) => p.value);
    const max = Math.max(1, ...values.map((v) => v ?? 0));
    const step = points.length > 1 ? WIDTH / (points.length - 1) : 0;
    const x = (i: number) => i * step;
    const y = (v: number) => height - 2 - (v / max) * (height - 6);

    const lines: string[] = [];
    const areas: string[] = [];
    let run: [number, number][] = [];
    const flush = () => {
      if (run.length === 0) return;
      const d = run.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`);
      lines.push(d.join(''));
      areas.push(
        `${d.join('')}L${run[run.length - 1][0]},${height}L${run[0][0]},${height}Z`
      );
      run = [];
    };
    values.forEach((v, i) => {
      if (v === null) flush();
      else run.push([x(i), y(v)]);
    });
    flush();
    return { lines, areas, x, y, step };
  }, [points, height]);

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width === 0 || points.length === 0) return;
    const ratio = (e.clientX - box.left) / box.width;
    setHover(
      Math.min(
        points.length - 1,
        Math.max(0, Math.round(ratio * (points.length - 1)))
      )
    );
  };

  const hovered = hover === null ? null : points[hover];

  return (
    <div>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        preserveAspectRatio="none"
        className="block w-full touch-none"
        style={{ height }}
        role="img"
        aria-label={caption}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {geometry.areas.map((d) => (
          <path key={d} d={d} fill={`url(#${gradientId})`} />
        ))}
        {geometry.lines.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {hovered && hover !== null && (
          <line
            x1={geometry.x(hover)}
            x2={geometry.x(hover)}
            y1={0}
            y2={height}
            stroke="#898781"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <p className="mt-1 h-4 truncate text-[11px] tabular-nums text-muted-foreground">
        {hovered
          ? hovered.value === null
            ? `${formatDay(hovered.date)} · no data`
            : `${formatDay(hovered.date)} · ${formatNumber(hovered.value)} ${unit}`
          : caption}
      </p>
    </div>
  );
}
