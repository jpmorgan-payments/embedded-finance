import { useId } from 'react';

import {
  LABEL_STYLE,
  labelWidth,
  type MetroLayout,
} from '@/lib/repo-evolution/metro';
import { formatDate, formatMonth } from '@/lib/repo-evolution/timeline';
import type { RepoEvolutionData } from '@/lib/repo-evolution/types';

const BLACK = '#111111';
const GRAY_600 = '#4b5563';
const GRAY_500 = '#6b7280';
const GRAY_300 = '#d1d5db';
const GRID = '#eef0f3';
const GHOST = '#e5e7eb';
const PAPER = '#ffffff';
const FUTURE_BG = '#f6f7f9';
const LINE_WIDTH = { main: 5, support: 3 } as const;
const PLANNED_WIDTH = 3;
const PLANNED_DASH = '6 5';
const AXIS_Y = 30;
const DIMMED = 0.18;
const BULLET_X = 24;

export interface MetroMapProps {
  data: RepoEvolutionData;
  layout: MetroLayout;
  playX: number;
  active: number | null;
  /** Fade every line except the active station's (step-by-step mode). */
  focusActive: boolean;
  onStation: (index: number) => void;
}

export function MetroMap({
  data,
  layout,
  playX,
  active,
  focusActive,
  onStation,
}: MetroMapProps) {
  const clipId = `re-reveal-${useId().replace(/:/g, '')}`;
  const ts = layout.textScale;
  const bulletScale = Math.min(ts, 1.25);
  const bulletR = 11 * bulletScale;
  const activeLine = active !== null ? data.milestones[active].line : null;
  const opacityFor = (line: string | null) =>
    focusActive && activeLine !== null && line !== activeLine ? DIMMED : 1;
  const hasPlanned = data.milestones.some((m) => m.kind === 'planned');

  // The active name is bold and may have no reserved slot: neighbours it covers step aside.
  const activeStation = active !== null ? layout.stations[active] : null;
  const activeSpan =
    active !== null && activeStation?.lane != null
      ? (() => {
          const m = data.milestones[active];
          const w = labelWidth(m.label, m.kind, ts, true);
          return {
            lane: activeStation.lane,
            side: activeStation.labelSide ?? 'above',
            from: activeStation.labelX - w / 2,
            to: activeStation.labelX + w / 2,
          };
        })()
      : null;
  const coveredByActive = (i: number) => {
    const s = layout.stations[i];
    if (!activeSpan || i === active || s.lane !== activeSpan.lane) return false;
    if (s.labelSide !== activeSpan.side) return false;
    const w = labelWidth(data.milestones[i].label, s.kind, ts);
    return (
      s.labelX - w / 2 < activeSpan.to && activeSpan.from < s.labelX + w / 2
    );
  };

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full w-full select-none"
      role="img"
      aria-label={`Subway map of the embedded-finance repository: ${data.lines.length} lines and ${data.milestones.length} stations from ${formatMonth(data.months[0].key)} to today, plus planned work.`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={playX} height={layout.height} />
        </clipPath>
      </defs>

      {hasPlanned && (
        <g>
          <rect
            x={layout.futureX}
            y={AXIS_Y}
            width={layout.width - layout.futureX}
            height={layout.mapBottom - AXIS_Y}
            fill={FUTURE_BG}
          />
          <text
            x={layout.width - 8}
            y={22}
            textAnchor="end"
            fontSize={11 * ts}
            fontWeight={700}
            letterSpacing={1.6}
            fill={GRAY_500}
          >
            PLANNED
          </text>
        </g>
      )}

      {layout.years.map((y) => (
        <g key={y.label}>
          <line
            x1={y.x}
            x2={y.x}
            y1={AXIS_Y}
            y2={layout.mapBottom}
            stroke={GRID}
          />
          <text
            x={y.x + 6}
            y={22}
            fontSize={12 * ts}
            fontWeight={700}
            fill={GRAY_500}
          >
            {y.label}
          </text>
        </g>
      ))}

      {layout.lines.map((l) => {
        const line = data.lines[l.lane];
        const open = l.startX <= playX;
        return (
          <g
            key={l.id}
            opacity={open ? opacityFor(l.id) : 1}
            className="re-ink"
          >
            <circle
              cx={BULLET_X}
              cy={l.y}
              r={bulletR}
              fill={open ? line.color : GHOST}
              className="re-ink"
            />
            <text
              x={BULLET_X}
              y={l.y + 4.6 * bulletScale}
              textAnchor="middle"
              fontSize={13 * bulletScale}
              fontWeight={700}
              fill={open ? line.bulletText : PAPER}
            >
              {line.bullet}
            </text>
            <text
              x={BULLET_X + bulletR + 8}
              y={l.y + 4.4 * bulletScale}
              fontSize={12.5 * Math.min(ts, 1.2)}
              fontWeight={700}
              fill={open ? BLACK : GRAY_300}
            >
              {line.label}
            </text>
          </g>
        );
      })}

      {/* The full route, faint, so the eye knows where the colour is heading. */}
      <g fill="none" stroke={GHOST} strokeLinejoin="round">
        {layout.lines.map((l) => (
          <g key={l.id}>
            <path d={l.d} strokeWidth={LINE_WIDTH[data.lines[l.lane].weight]} />
            {l.future && (
              <path
                d={l.future}
                strokeWidth={PLANNED_WIDTH}
                strokeDasharray={PLANNED_DASH}
              />
            )}
          </g>
        ))}
      </g>

      <g pointerEvents="none">
        <line
          x1={playX}
          x2={playX}
          y1={AXIS_Y}
          y2={layout.mapBottom}
          stroke={BLACK}
          strokeOpacity={0.35}
        />
        <path
          d={`M ${playX - 5} ${AXIS_Y - 6} L ${playX + 5} ${AXIS_Y - 6} L ${playX} ${AXIS_Y} Z`}
          fill={BLACK}
        />
      </g>

      <g clipPath={`url(#${clipId})`} fill="none" strokeLinejoin="round">
        {layout.lines.map((l) => {
          const line = data.lines[l.lane];
          const w = LINE_WIDTH[line.weight];
          return (
            <g
              key={l.id}
              stroke={line.color}
              opacity={opacityFor(l.id)}
              className="re-ink"
            >
              <path d={l.d} strokeWidth={w} />
              {l.terminusX !== null && (
                <line
                  x1={l.terminusX}
                  x2={l.terminusX}
                  y1={l.y - w - 3}
                  y2={l.y + w + 3}
                  strokeWidth={w}
                />
              )}
              {l.future && (
                <path
                  d={l.future}
                  strokeWidth={PLANNED_WIDTH}
                  strokeDasharray={PLANNED_DASH}
                />
              )}
            </g>
          );
        })}
      </g>

      {layout.stations.map((s, i) => {
        if (s.x > playX + 0.5) return null;
        const m = data.milestones[i];
        const isActive = active === i;
        const title = m.date
          ? `${m.title} — ${formatDate(m.date)}`
          : `${m.title} — planned`;

        if (s.y === null) {
          const fs = 11 * ts;
          const pillW = m.label.length * fs * 0.68 + 16;
          return (
            <g
              key={m.id}
              className="re-fade cursor-pointer"
              onClick={() => onStation(i)}
            >
              <title>{title}</title>
              <line
                x1={s.x}
                x2={s.x}
                y1={AXIS_Y}
                y2={layout.lanesBottom + 18}
                stroke={BLACK}
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <rect
                x={s.x - pillW / 2}
                y={6}
                width={pillW}
                height={fs + 8}
                rx={(fs + 8) / 2}
                fill={BLACK}
              />
              <text
                x={s.x}
                y={6 + fs + 1.5}
                textAnchor="middle"
                fontSize={fs}
                fontWeight={700}
                letterSpacing={0.6}
                fill={PAPER}
              >
                {m.label.toUpperCase()}
              </text>
            </g>
          );
        }

        const line = data.lines[s.lane ?? 0];
        const side = isActive
          ? (s.labelSide ?? 'above')
          : coveredByActive(i)
            ? null
            : s.labelSide;
        const ring = m.kind === 'planned' ? line.color : BLACK;
        let marker;
        if (isActive) {
          marker = (
            <circle
              key="active"
              cx={s.x}
              cy={s.y}
              r={8}
              fill={PAPER}
              stroke={ring}
              strokeWidth={3}
              className="re-pop"
            />
          );
        } else if (m.kind === 'local') {
          marker = (
            <circle
              key="local"
              cx={s.x}
              cy={s.y}
              r={line.weight === 'main' ? 3.2 : 2.6}
              fill={BLACK}
              className="re-pop"
            />
          );
        } else {
          marker = (
            <circle
              key={m.kind}
              cx={s.x}
              cy={s.y}
              r={m.kind === 'express' ? 5.5 : 5}
              fill={PAPER}
              stroke={ring}
              strokeWidth={2}
              className="re-pop"
            />
          );
        }

        let labelFill = GRAY_500;
        if (isActive || m.kind === 'express') labelFill = BLACK;
        else if (m.kind === 'local') labelFill = GRAY_600;

        return (
          <g
            key={m.id}
            className="re-ink cursor-pointer"
            opacity={opacityFor(m.line)}
            onClick={() => onStation(i)}
          >
            <title>{title}</title>
            <circle cx={s.x} cy={s.y} r={14} fill="transparent" />
            {isActive && (
              <circle
                key="halo"
                cx={s.x}
                cy={s.y}
                r={18}
                fill={line.color}
                className="re-pulse"
              />
            )}
            {marker}
            {side && s.labelY && (
              <text
                x={s.labelX}
                y={s.labelY[side]}
                textAnchor="middle"
                fontSize={s.labelSize}
                fontWeight={isActive ? 700 : LABEL_STYLE[m.kind].weight}
                fill={labelFill}
                stroke={PAPER}
                strokeWidth={isActive ? 5 : 3}
                strokeLinejoin="round"
                paintOrder="stroke"
                className="re-fade"
              >
                {m.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
