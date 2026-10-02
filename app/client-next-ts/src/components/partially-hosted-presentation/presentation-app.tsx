import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Maximize2,
  Minimize2,
  Moon,
  Pause,
  Play,
  StickyNote,
  Sun,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';

import {
  clampPosition,
  deckProgress,
  DEFAULT_DWELL_MS,
  nextPosition,
  positionForTrack,
  prevPosition,
  slidesForTrack,
  type DeckPosition,
  type DeckTheme,
  type SlideMeta,
  type TrackId,
} from './deck-state';
import { SLIDE_VIEWS } from './slide-views';
import { CHAPTERS, SLIDES, TRACKS } from './slides';

import './presentation.css';

export interface PresentationState {
  slide: string;
  step: number;
  track: TrackId;
  theme: DeckTheme;
  autoplay: boolean;
}

export interface PresentationAppProps {
  initial?: Partial<PresentationState>;
  onStateChange?: (state: PresentationState) => void;
}

const STAGE_W = 1600;
const STAGE_H = 900;
const VIEWPORT_PAD = 20;

function useStageScale() {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const update = () => {
      const width = el.clientWidth - VIEWPORT_PAD * 2;
      const height = el.clientHeight - VIEWPORT_PAD * 2;
      if (width > 0 && height > 0) {
        setScale(Math.min(width / STAGE_W, height / STAGE_H));
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, scale };
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}

function ChromeButton({
  label,
  shortcut,
  pressed,
  disabled,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  pressed?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="ph-icon-btn"
      aria-label={label}
      aria-pressed={pressed}
      aria-keyshortcuts={shortcut}
      title={shortcut ? `${label} (${shortcut})` : label}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
      <span className="ph-btn-label">{label}</span>
    </button>
  );
}

export function PresentationApp({
  initial,
  onStateChange,
}: PresentationAppProps) {
  const [track, setTrack] = useState<TrackId>(initial?.track ?? 'all');
  const [position, setPosition] = useState<DeckPosition>(() =>
    positionForTrack(
      SLIDES,
      clampPosition(SLIDES, { slideId: initial?.slide, step: initial?.step }),
      initial?.track ?? 'all'
    )
  );
  const [theme, setTheme] = useState<DeckTheme>(initial?.theme ?? 'light');
  const [autoplay, setAutoplay] = useState(Boolean(initial?.autoplay));
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const onStateChangeRef = useRef(onStateChange);
  const { ref: viewportRef, scale } = useStageScale();

  const visible = useMemo(() => slidesForTrack(SLIDES, track), [track]);
  const index = Math.max(
    visible.findIndex((s) => s.id === position.slideId),
    0
  );
  const slide = visible[index];
  const SlideView = SLIDE_VIEWS[slide.id];
  const chapterIndex = CHAPTERS.findIndex((c) => c.id === slide.chapter);
  const progress = deckProgress(visible, position);
  const dwell = slide.dwellMs ?? DEFAULT_DWELL_MS;
  const atStart = prevPosition(visible, position) === null;
  const atEnd = nextPosition(visible, position) === null;

  const go = useCallback(
    (direction: 1 | -1) => {
      setPosition(
        (current) =>
          (direction === 1
            ? nextPosition(visible, current)
            : prevPosition(visible, current)) ?? current
      );
    },
    [visible]
  );

  const jumpTo = useCallback((slideId: string, step = 0) => {
    setPosition({ slideId, step });
    setOverviewOpen(false);
  }, []);

  const changeTrack = (next: TrackId) => {
    setTrack(next);
    setPosition((current) => positionForTrack(SLIDES, current, next));
  };

  const toggleAutoplay = useCallback(() => {
    if (!autoplay && atEnd) setPosition({ slideId: visible[0].id, step: 0 });
    setAutoplay(!autoplay);
  }, [autoplay, atEnd, visible]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => undefined);
    } else {
      rootRef.current?.requestFullscreen?.().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    onStateChangeRef.current?.({
      slide: position.slideId,
      step: position.step,
      track,
      theme,
      autoplay,
    });
  }, [position, track, theme, autoplay]);

  useEffect(() => {
    if (!autoplay) return undefined;
    const next = nextPosition(visible, position);
    if (!next) {
      setAutoplay(false);
      return undefined;
    }
    const id = window.setTimeout(() => setPosition(next), dwell);
    return () => window.clearTimeout(id);
  }, [autoplay, position, visible, dwell]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return;
      }
      if (isTypingTarget(event.target)) return;
      const onControl =
        event.target instanceof HTMLElement &&
        ['BUTTON', 'A'].includes(event.target.tagName);
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

      switch (key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          go(1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          go(-1);
          break;
        case ' ':
          if (onControl) return;
          go(event.shiftKey ? -1 : 1);
          break;
        case 'Home':
          jumpTo(visible[0].id);
          break;
        case 'End': {
          const last = visible[visible.length - 1];
          jumpTo(last.id, last.builds);
          break;
        }
        case 'Escape':
          if (overviewOpen) setOverviewOpen(false);
          else if (notesOpen) setNotesOpen(false);
          else return;
          break;
        case 'g':
        case 'o':
          setOverviewOpen((open) => !open);
          break;
        case 't':
          setTheme((t) => (t === 'light' ? 'dark' : 'light'));
          break;
        case 'p':
          toggleAutoplay();
          break;
        case 'n':
          setNotesOpen((open) => !open);
          break;
        case 'f':
          toggleFullscreen();
          break;
        default:
          return;
      }
      event.preventDefault();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    go,
    jumpTo,
    visible,
    overviewOpen,
    notesOpen,
    toggleAutoplay,
    toggleFullscreen,
  ]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    document.documentElement.classList.add('ph-deck-active');
    return () => {
      document.title = previousTitle;
      document.documentElement.classList.remove('ph-deck-active');
    };
  }, []);

  useEffect(() => {
    document.title = `${slide.title} · Partially Hosted UI`;
  }, [slide.title]);

  return (
    <div ref={rootRef} className="ph-root" data-theme={theme}>
      <header className="ph-chrome">
        <div className="flex shrink-0 items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-ph-brand text-[13px] font-bold text-ph-on-brand">
            PH
          </span>
          <div className="leading-tight">
            <p className="ph-heading text-[15px] font-bold">
              Partially Hosted UI
            </p>
            <p className="text-[12px] text-ph-muted">Interactive overview</p>
          </div>
        </div>

        <nav
          aria-label="Chapters"
          className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto"
        >
          {CHAPTERS.map((chapter, i) => {
            const first = visible.find((s) => s.chapter === chapter.id);
            const isCurrent = i === chapterIndex;
            return (
              <button
                key={chapter.id}
                type="button"
                className="ph-rail-btn"
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`Chapter ${i + 1}: ${chapter.label}`}
                title={chapter.label}
                data-done={i < chapterIndex}
                disabled={!first}
                onClick={() => first && jumpTo(first.id)}
              >
                <span>{i + 1}</span>
                <span className="ph-rail-label">{chapter.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <label className="sr-only" htmlFor="ph-track">
            Audience
          </label>
          <select
            id="ph-track"
            className="ph-select"
            value={track}
            onChange={(e) => changeTrack(e.target.value as TrackId)}
          >
            {TRACKS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <ChromeButton
            label="Dark theme"
            shortcut="T"
            pressed={theme === 'dark'}
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
          >
            {theme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </ChromeButton>
          <ChromeButton
            label="Auto-play"
            shortcut="P"
            pressed={autoplay}
            onClick={toggleAutoplay}
          >
            {autoplay ? (
              <span className="relative grid h-5 w-5 place-items-center">
                <svg
                  viewBox="0 0 24 24"
                  className="absolute inset-0 -rotate-90"
                  aria-hidden
                >
                  <circle
                    key={`${position.slideId}-${position.step}`}
                    cx="12"
                    cy="12"
                    r="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="ph-autoplay-ring"
                    style={{ animationDuration: `${dwell}ms` }}
                  />
                </svg>
                <Pause className="h-3 w-3" />
              </span>
            ) : (
              <Play className="h-4 w-4" />
            )}
          </ChromeButton>
          <ChromeButton
            label="Overview"
            shortcut="G"
            pressed={overviewOpen}
            onClick={() => setOverviewOpen((open) => !open)}
          >
            <LayoutGrid className="h-4 w-4" />
          </ChromeButton>
          <ChromeButton
            label="Notes"
            shortcut="N"
            pressed={notesOpen}
            onClick={() => setNotesOpen((open) => !open)}
          >
            <StickyNote className="h-4 w-4" />
          </ChromeButton>
          <ChromeButton
            label="Full screen"
            shortcut="F"
            pressed={fullscreen}
            onClick={toggleFullscreen}
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </ChromeButton>
        </div>
      </header>

      <div ref={viewportRef} className="ph-viewport">
        <div
          className="ph-stage-frame"
          style={{ width: STAGE_W * scale, height: STAGE_H * scale }}
        >
          <div className="ph-stage" style={{ transform: `scale(${scale})` }}>
            <section
              key={slide.id}
              className="ph-slide"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${visible.length}: ${slide.title}`}
            >
              <SlideView step={position.step} autoplay={autoplay} />
            </section>
          </div>
        </div>
      </div>

      {notesOpen ? (
        <aside className="ph-notes" aria-label="Speaker notes">
          <div className="mx-auto flex max-w-[1400px] items-baseline gap-6">
            <p className="shrink-0 text-[12px] font-bold uppercase tracking-[0.16em] text-ph-brand">
              Speaker notes
            </p>
            <div>
              <p className="text-[17px] leading-relaxed">{slide.notes}</p>
              <p className="mt-1 text-[12px] text-ph-muted">
                Visible to your audience if you share this whole window.
              </p>
            </div>
          </div>
        </aside>
      ) : null}

      <footer className="ph-footer">
        <ChromeButton
          label="Previous"
          disabled={atStart}
          onClick={() => go(-1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </ChromeButton>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div
            className="ph-progress"
            role="progressbar"
            aria-label="Deck progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <div style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="flex items-center justify-between gap-4 text-[12px] text-ph-muted">
            <span className="truncate">
              {CHAPTERS[chapterIndex]?.label} · {slide.title}
            </span>
            {slide.builds > 0 ? (
              <span
                className="flex shrink-0 items-center gap-1.5"
                aria-label={`Step ${position.step + 1} of ${slide.builds + 1}`}
              >
                {Array.from({ length: slide.builds + 1 }, (_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-2 w-2 rounded-full',
                      i <= position.step ? 'bg-ph-brand' : 'bg-ph-border'
                    )}
                  />
                ))}
              </span>
            ) : null}
          </div>
        </div>
        <span className="shrink-0 text-[13px] font-semibold tabular-nums">
          {index + 1} / {visible.length}
        </span>
        <ChromeButton label="Next" disabled={atEnd} onClick={() => go(1)}>
          <ChevronRight className="h-4 w-4" />
        </ChromeButton>
      </footer>

      <p className="sr-only" aria-live="polite">
        {`Slide ${index + 1} of ${visible.length}: ${slide.title}`}
      </p>

      {overviewOpen ? (
        <Overview
          slides={visible}
          currentId={slide.id}
          trackLabel={TRACKS.find((t) => t.id === track)?.label ?? ''}
          onSelect={jumpTo}
          onClose={() => setOverviewOpen(false)}
        />
      ) : null}
    </div>
  );
}

function Overview({
  slides,
  currentId,
  trackLabel,
  onSelect,
  onClose,
}: {
  slides: SlideMeta[];
  currentId: string;
  trackLabel: string;
  onSelect: (slideId: string) => void;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <div
      className="ph-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Slide overview"
      onClick={onClose}
    >
      <div
        className="ph-panel flex w-full max-w-[1400px] flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-ph-border px-6 py-4">
          <div>
            <p className="ph-heading text-[22px] font-bold">Overview</p>
            <p className="text-[14px] text-ph-muted">
              {trackLabel} · {slides.length} slides
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="ph-icon-btn"
            aria-label="Close overview"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-6">
          {CHAPTERS.map((chapter) => {
            const items = slides.filter((s) => s.chapter === chapter.id);
            if (items.length === 0) return null;
            return (
              <section key={chapter.id} className="mb-6">
                <h3 className="mb-3 text-[13px] font-bold uppercase tracking-[0.16em] text-ph-brand">
                  {chapter.label}
                </h3>
                <ol className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {items.map((s) => {
                    const isCurrent = s.id === currentId;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(s.id)}
                          aria-current={isCurrent ? 'true' : undefined}
                          className={cn(
                            'flex h-full w-full flex-col gap-1.5 rounded-xl border p-4 text-left',
                            isCurrent
                              ? 'border-ph-brand bg-ph-brand-soft'
                              : 'border-ph-border hover:bg-ph-soft'
                          )}
                        >
                          <span className="text-[12px] font-bold text-ph-muted">
                            {slides.indexOf(s) + 1}
                          </span>
                          <span className="text-[16px] font-semibold leading-snug">
                            {s.title}
                          </span>
                          <span className="mt-auto text-[12px] text-ph-muted">
                            {s.builds + 1} {s.builds === 0 ? 'step' : 'steps'}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
        <p className="border-t border-ph-border px-6 py-3 text-[13px] text-ph-muted">
          → Space PageDown next · ← PageUp back · Home / End · G overview · T
          theme · P auto-play · N notes · F full screen · Esc close
        </p>
      </div>
    </div>
  );
}
