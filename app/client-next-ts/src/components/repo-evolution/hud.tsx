import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';

import {
  formatDate,
  type CumulativeStats,
} from '@/lib/repo-evolution/timeline';
import type {
  RepoEvolutionData,
  RepoLine,
  StationKind,
} from '@/lib/repo-evolution/types';
import { cn } from '@/lib/utils';

const fmt = (n: number) => n.toLocaleString('en-US');
const pad = (n: number) => String(n).padStart(2, '0');
const META = 'text-[11px] font-bold uppercase tracking-[0.18em] text-gray-500';

const KIND_LABEL: Record<StationKind, string> = {
  express: 'Express stop',
  local: 'Local stop',
  planned: 'Planned',
};

export function Bullet({
  line,
  size = 28,
  className,
}: {
  line: RepoLine;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none',
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.56,
        background: line.color,
        color: line.bulletText,
      }}
      title={line.label}
      aria-hidden="true"
    >
      {line.bullet}
    </span>
  );
}

// ------------------------------------------------------------------ header

/** MTA-style black signage band. */
export function TopBar({
  data,
  title,
  stats,
}: {
  data: RepoEvolutionData;
  title: string;
  stats: CumulativeStats;
}) {
  const items = [
    { label: 'Commits', value: fmt(stats.commits) },
    { label: 'PRs merged', value: fmt(stats.prs) },
    { label: 'Library', value: stats.version ? `v${stats.version}` : '—' },
  ];
  return (
    <header className="shrink-0 bg-black pt-1.5 text-white">
      <div className="h-0.5 bg-white" />
      <div className="flex items-center justify-between gap-6 px-6 py-3 md:px-10">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/60">
            embedded-finance · repository subway map
          </p>
          <h1 className="mt-0.5 truncate text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
        </div>
        <div className="hidden items-center gap-1.5 lg:flex">
          {data.lines.map((l) => (
            <Bullet key={l.id} line={l} size={30} />
          ))}
        </div>
        <dl className="hidden gap-8 sm:flex">
          {items.map(({ label, value }) => (
            <div key={label} className="text-right">
              <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">
                {label}
              </dt>
              <dd className="mt-0.5 text-2xl font-bold tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}

// ------------------------------------------------------------------ caption

export function Caption({
  data,
  index,
}: {
  data: RepoEvolutionData;
  index: number;
}) {
  const m = data.milestones[index];
  const line = data.lines.find((l) => l.id === m.line);
  const href = m.source
    ? `${data.repoUrl}/blob/${data.head.sha}/${m.source.path}#L${m.source.line}`
    : `${data.repoUrl}/commit/${m.sha}`;
  const linkText = m.source
    ? `${m.source.path.split('/').pop()} · line ${m.source.line}`
    : `commit ${m.sha}`;
  return (
    <article className="re-rise flex max-w-4xl gap-4" aria-live="polite">
      {line ? (
        <Bullet line={line} size={44} className="mt-1" />
      ) : (
        <span
          className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-[10px] font-bold uppercase tracking-wider text-white"
          aria-hidden="true"
        >
          Now
        </span>
      )}
      <div className="min-w-0">
        <p
          className={cn(META, 'flex flex-wrap items-center gap-x-2.5 gap-y-1')}
        >
          <span className="tabular-nums text-black">
            {pad(index + 1)} / {pad(data.milestones.length)}
          </span>
          <span aria-hidden="true">·</span>
          {m.kind === 'planned' ? (
            <span className="rounded-sm bg-[#FCCC0A] px-1.5 py-0.5 text-black">
              Planned
            </span>
          ) : (
            <span>{KIND_LABEL[m.kind]}</span>
          )}
          <span aria-hidden="true">·</span>
          <span>{line ? line.label : 'All lines'}</span>
          {m.date && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={m.date}>{formatDate(m.date)}</time>
            </>
          )}
        </p>
        <h2 className="mt-1.5 text-3xl font-bold leading-tight tracking-tight text-black">
          {m.title}
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
          {m.blurb}
        </p>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-gray-500 underline decoration-gray-300 underline-offset-4 hover:text-black"
        >
          {linkText}
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

// ------------------------------------------------------------------ intro + outro

const solidBtn =
  'inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-bold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2';
const outlineBtn =
  'inline-flex items-center gap-2 rounded-full border-2 border-black px-6 py-2.5 text-sm font-bold text-black transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2';

const yearsOf = (data: RepoEvolutionData) =>
  `${data.months[0].key.slice(0, 4)}–${data.months[data.months.length - 1].key.slice(0, 4)}`;

export function IntroOverlay({
  data,
  started,
  progress,
  totalSeconds,
  onPlay,
  onExplore,
}: {
  data: RepoEvolutionData;
  started: boolean;
  progress: number;
  totalSeconds: number;
  onPlay: () => void;
  onExplore: () => void;
}) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex items-center justify-center p-6 text-center',
        started ? 'pointer-events-none' : 'bg-white/90'
      )}
      style={{
        opacity: started ? Math.max(0, 1 - progress * progress * 1.4) : 1,
      }}
    >
      <div className="max-w-2xl">
        <p className={META}>{yearsOf(data)}</p>
        <h2 className="mt-3 text-5xl font-bold leading-tight tracking-tight text-black md:text-6xl">
          The embedded-finance subway
        </h2>
        <p className="mt-4 text-base text-gray-600 md:text-lg">
          Every line is a product area, every stop a milestone — drawn from{' '}
          {fmt(data.totals.commits)} commits and {fmt(data.totals.prs)} pull
          requests, with the planned extensions straight from the backlog.
        </p>
        <ul className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {data.lines.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-1.5 text-sm font-bold text-black"
            >
              <Bullet line={l} size={24} />
              {l.label}
            </li>
          ))}
        </ul>
        {!started && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={onPlay} className={solidBtn}>
              <Play className="h-4 w-4" aria-hidden="true" />
              Express · {Math.round(totalSeconds)}s
            </button>
            <button type="button" onClick={onExplore} className={outlineBtn}>
              Local · every stop
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Outro({
  data,
  onReplay,
  onExplore,
}: {
  data: RepoEvolutionData;
  onReplay: () => void;
  onExplore: () => void;
}) {
  const built = data.milestones.filter(
    (m) => m.line !== null && m.kind !== 'planned'
  ).length;
  const planned = data.milestones.filter((m) => m.kind === 'planned').length;
  return (
    <div className="re-rise flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p className={META}>
          {yearsOf(data)}
          {data.head.version ? ` · v${data.head.version}` : ''}
        </p>
        <h2 className="mt-1.5 text-3xl font-bold leading-tight tracking-tight text-black">
          {data.lines.length} lines · {built} stops · {planned} under
          construction
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-600 md:text-base">
          {fmt(data.totals.commits)} commits and {fmt(data.totals.prs)} merged
          pull requests, drawn from git history up to commit {data.head.sha}.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onReplay} className={solidBtn}>
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Replay
        </button>
        <button type="button" onClick={onExplore} className={outlineBtn}>
          Every stop
        </button>
        <a
          href={data.repoUrl}
          target="_blank"
          rel="noreferrer"
          className={outlineBtn}
        >
          GitHub
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ controls

const fmtClock = (s: number) =>
  `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;

const iconBtn =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-gray-200 text-black transition hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black';

function Legend() {
  return (
    <ul className="hidden items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-gray-500 md:flex">
      <li className="flex items-center gap-1.5">
        <svg width="14" height="14" aria-hidden="true">
          <circle
            cx="7"
            cy="7"
            r="5"
            fill="#fff"
            stroke="#111"
            strokeWidth="2"
          />
        </svg>
        Express
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="14" height="14" aria-hidden="true">
          <circle cx="7" cy="7" r="3.2" fill="#111" />
        </svg>
        Local
      </li>
      <li className="flex items-center gap-1.5">
        <svg width="26" height="14" aria-hidden="true">
          <line
            x1="1"
            x2="25"
            y1="7"
            y2="7"
            stroke="#6b7280"
            strokeWidth="3"
            strokeDasharray="6 5"
          />
        </svg>
        Planned
      </li>
    </ul>
  );
}

export function Controls({
  t,
  total,
  playing,
  onTogglePlay,
  onPrev,
  onNext,
  onRestart,
}: {
  t: number;
  total: number;
  playing: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onRestart: () => void;
}) {
  return (
    <footer className="flex shrink-0 items-center gap-2 border-t border-gray-200 px-6 py-3 md:px-10">
      <button
        type="button"
        className={iconBtn}
        onClick={onRestart}
        aria-label="Restart"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={iconBtn}
        onClick={onPrev}
        aria-label="Previous stop"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        className={cn(
          iconBtn,
          'h-10 w-10 border-black bg-black text-white hover:bg-gray-800'
        )}
        onClick={onTogglePlay}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
      <button
        type="button"
        className={iconBtn}
        onClick={onNext}
        aria-label="Next stop"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
      <span className="ml-2 font-mono text-xs tabular-nums text-gray-500">
        {fmtClock(t)} / {fmtClock(total)}
      </span>
      <div className="ml-auto flex items-center gap-6">
        <Legend />
        <span className="hidden text-[11px] text-gray-500 2xl:block">
          Space play/pause · ←/→ every stop · Shift+←/→ months
        </span>
      </div>
    </footer>
  );
}
