import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';

import { REPO_EVOLUTION } from '@/data/repo-evolution.generated';
import { layoutMetro, MAX_TEXT_SCALE } from '@/lib/repo-evolution/metro';
import {
  buildTimeline,
  formatMonth,
  frameAt,
  milestoneTime,
  monthTime,
  nextMilestone,
  playheadX,
  previousMilestone,
  statsAt,
} from '@/lib/repo-evolution/timeline';
import type { RepoEvolutionData } from '@/lib/repo-evolution/types';

import { Caption, Controls, IntroOverlay, Outro, TopBar } from './hud';
import { MetroMap } from './metro-map';

import './repo-evolution.css';

/** Smallest on-screen size (px) for express station names. */
const MIN_LABEL_PX = 12;
const BASE_LABEL_PX = 13;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Enlarges SVG text when the map is scaled down to fit, in 0.1 steps to limit relayouts. */
function useTextScale(
  ref: RefObject<HTMLElement | null>,
  width: number,
  height: number
) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      if (w <= 0 || h <= 0) return;
      const fit = Math.min(w / width, h / height);
      const wanted =
        Math.ceil((MIN_LABEL_PX / (BASE_LABEL_PX * fit)) * 10) / 10;
      setScale(Math.min(MAX_TEXT_SCALE, Math.max(1, wanted)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, width, height]);
  return scale;
}

export interface RepoEvolutionAppProps {
  /** Milestone id to open in step-by-step mode. */
  initialMilestone?: string;
  onMilestoneChange?: (id: string | undefined) => void;
  data?: RepoEvolutionData;
}

export function RepoEvolutionApp({
  initialMilestone,
  onMilestoneChange,
  data = REPO_EVOLUTION,
}: RepoEvolutionAppProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const baseLayout = useMemo(() => layoutMetro(data), [data]);
  const textScale = useTextScale(mapRef, baseLayout.width, baseLayout.height);
  const layout = useMemo(
    () => (textScale === 1 ? baseLayout : layoutMetro(data, textScale)),
    [baseLayout, data, textScale]
  );
  // Text scale never moves stations, so the timeline only depends on the base layout.
  const timeline = useMemo(() => buildTimeline(baseLayout), [baseLayout]);

  const initialIndex = data.milestones.findIndex(
    (m) => m.id === initialMilestone
  );
  const [t, setT] = useState(() =>
    initialIndex >= 0 ? milestoneTime(timeline, initialIndex) : 0
  );
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(initialIndex >= 0);
  const [pinned, setPinned] = useState<number | null>(
    initialIndex >= 0 ? initialIndex : null
  );

  const tRef = useRef(t);
  const tweenRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add('repo-evolution-active');
    return () => {
      document.documentElement.classList.remove('repo-evolution-active');
      cancelAnimationFrame(tweenRef.current);
    };
  }, []);

  const setTime = useCallback((v: number) => {
    tRef.current = v;
    setT(v);
  }, []);

  // Playback clock. rAF timestamps can precede performance.now(), so clamp the delta.
  useEffect(() => {
    if (!playing) return undefined;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.max(0, now - last) / 1000;
      last = now;
      const next = Math.min(timeline.total, tRef.current + dt);
      setTime(next);
      if (next >= timeline.total) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, timeline.total, setTime]);

  /** Slides the playhead to `target` so the drawing stays visible. */
  const seek = useCallback(
    (target: number) => {
      cancelAnimationFrame(tweenRef.current);
      const from = tRef.current;
      const dist = Math.abs(target - from);
      if (dist < 0.05 || prefersReducedMotion()) {
        setTime(target);
        return;
      }
      const duration = Math.min(1200, 300 + dist * 80);
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, Math.max(0, now - t0) / duration);
        setTime(from + (target - from) * (1 - (1 - k) ** 3));
        if (k < 1) tweenRef.current = requestAnimationFrame(step);
      };
      tweenRef.current = requestAnimationFrame(step);
    },
    [setTime]
  );

  const frame = frameAt(timeline, t);
  const active = pinned ?? frame.caption;

  const pin = useCallback(
    (index: number | null) => {
      setPinned(index);
      onMilestoneChange?.(
        index === null ? undefined : data.milestones[index].id
      );
    },
    [data.milestones, onMilestoneChange]
  );

  const goToMilestone = useCallback(
    (index: number) => {
      setStarted(true);
      setPlaying(false);
      pin(index);
      seek(milestoneTime(timeline, index));
    },
    [pin, seek, timeline]
  );

  const goToEnd = useCallback(() => {
    setPlaying(false);
    pin(null);
    seek(timeline.total);
  }, [pin, seek, timeline.total]);

  const play = useCallback(() => {
    cancelAnimationFrame(tweenRef.current);
    if (tRef.current >= timeline.total - 0.01) setTime(0);
    setStarted(true);
    pin(null);
    setPlaying(true);
  }, [pin, setTime, timeline.total]);

  const pause = useCallback(() => setPlaying(false), []);

  const next = useCallback(() => {
    const current = pinned ?? frameAt(timeline, tRef.current).milestone;
    const i =
      current !== null ? current + 1 : nextMilestone(timeline, tRef.current);
    if (i === null || i >= data.milestones.length) goToEnd();
    else goToMilestone(i);
  }, [data.milestones.length, goToEnd, goToMilestone, pinned, timeline]);

  const prev = useCallback(() => {
    const f = frameAt(timeline, tRef.current);
    const current =
      f.phase === 'outro' && pinned === null
        ? data.milestones.length
        : (pinned ?? f.milestone);
    const i =
      current !== null
        ? current - 1
        : previousMilestone(timeline, tRef.current);
    goToMilestone(Math.max(0, i ?? 0));
  }, [data.milestones.length, goToMilestone, pinned, timeline]);

  const seekMonth = useCallback(
    (month: number) => {
      const target = Math.max(0, Math.min(data.months.length - 1, month));
      setStarted(true);
      setPlaying(false);
      pin(null);
      seek(monthTime(timeline, target));
    },
    [data.months.length, pin, seek, timeline]
  );

  const restart = useCallback(() => {
    cancelAnimationFrame(tweenRef.current);
    pin(null);
    setTime(0);
    setStarted(true);
    setPlaying(true);
  }, [pin, setTime]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ') {
        e.preventDefault();
        if (playing) pause();
        else play();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) seekMonth(frameAt(timeline, tRef.current).month + 1);
        else next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) seekMonth(frameAt(timeline, tRef.current).month - 1);
        else prev();
      } else if (e.key === 'Home') {
        restart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, pause, play, playing, prev, restart, seekMonth, timeline]);

  const playX = playheadX(timeline, t);

  // On narrow screens the map scrolls sideways; keep the playhead in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth + 1) return;
    el.scrollLeft = Math.max(
      0,
      (playX / layout.width) * el.scrollWidth - el.clientWidth / 2
    );
  }, [playX, layout.width]);

  const stats = statsAt(data, frame.monthFloat);
  const inFuture = frame.phase === 'future' || frame.phase === 'outro';
  const showOutro = frame.phase === 'outro' && pinned === null;
  const title =
    inFuture && (pinned === null || data.milestones[pinned].kind === 'planned')
      ? 'Next stops'
      : formatMonth(data.months[frame.month].key);

  return (
    <div className="re-root relative flex h-screen w-full flex-col overflow-hidden bg-white text-black">
      <TopBar data={data} title={title} stats={stats} />

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden px-4 py-3 md:px-8"
      >
        <div ref={mapRef} className="h-full min-w-[900px]">
          <MetroMap
            data={data}
            layout={layout}
            playX={playX}
            active={frame.phase === 'intro' ? null : active}
            focusActive={pinned !== null}
            onStation={goToMilestone}
          />
        </div>
      </div>

      <section className="h-[176px] shrink-0 overflow-y-auto border-t border-gray-200 px-6 py-4 md:px-10">
        {showOutro ? (
          <Outro
            data={data}
            onReplay={restart}
            onExplore={() => goToMilestone(0)}
          />
        ) : (
          active !== null &&
          frame.phase !== 'intro' && (
            <Caption key={active} data={data} index={active} />
          )
        )}
      </section>

      <Controls
        t={frame.t}
        total={timeline.total}
        playing={playing}
        onTogglePlay={playing ? pause : play}
        onPrev={prev}
        onNext={next}
        onRestart={restart}
      />

      {(frame.phase === 'intro' || !started) && (
        <IntroOverlay
          data={data}
          started={started}
          progress={frame.phaseProgress}
          totalSeconds={timeline.total}
          onPlay={play}
          onExplore={() => goToMilestone(0)}
        />
      )}
    </div>
  );
}
