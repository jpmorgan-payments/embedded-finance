export type TrackId = 'all' | 'decision' | 'platform' | 'external';
export type AudienceId = Exclude<TrackId, 'all'>;
export type ChapterId =
  'why' | 'journey' | 'experiences' | 'utility' | 'customize' | 'ship';
export type DeckTheme = 'light' | 'dark';

export interface TrackMeta {
  id: TrackId;
  label: string;
  description: string;
}

export interface ChapterMeta {
  id: ChapterId;
  label: string;
}

export interface SlideMeta {
  id: string;
  chapter: ChapterId;
  title: string;
  tracks: readonly AudienceId[];
  /** Number of reveal steps after the initial state. */
  builds: number;
  notes: string;
  /** Autoplay dwell per step; defaults to DEFAULT_DWELL_MS. */
  dwellMs?: number;
}

export interface DeckPosition {
  slideId: string;
  step: number;
}

export const DEFAULT_DWELL_MS = 6500;

export function slidesForTrack(
  slides: readonly SlideMeta[],
  track: TrackId
): SlideMeta[] {
  if (track === 'all') return [...slides];
  return slides.filter((slide) => slide.tracks.includes(track));
}

export function clampPosition(
  slides: readonly SlideMeta[],
  position: Partial<DeckPosition>
): DeckPosition {
  const slide = slides.find((s) => s.id === position.slideId) ?? slides[0];
  const step = Math.min(
    Math.max(Math.trunc(position.step ?? 0), 0),
    slide.builds
  );
  return { slideId: slide.id, step: Number.isFinite(step) ? step : 0 };
}

export function nextPosition(
  slides: readonly SlideMeta[],
  position: DeckPosition
): DeckPosition | null {
  const index = slides.findIndex((s) => s.id === position.slideId);
  if (index === -1) return null;
  if (position.step < slides[index].builds) {
    return { slideId: position.slideId, step: position.step + 1 };
  }
  const next = slides[index + 1];
  return next ? { slideId: next.id, step: 0 } : null;
}

/** Going back lands on the previous slide fully built, like a slide deck. */
export function prevPosition(
  slides: readonly SlideMeta[],
  position: DeckPosition
): DeckPosition | null {
  const index = slides.findIndex((s) => s.id === position.slideId);
  if (index === -1) return null;
  if (position.step > 0) {
    return { slideId: position.slideId, step: position.step - 1 };
  }
  const prev = slides[index - 1];
  return prev ? { slideId: prev.id, step: prev.builds } : null;
}

/**
 * Keep the current slide when it belongs to the new track; otherwise move to
 * the next slide in deck order that does, falling back to the track's last.
 */
export function positionForTrack(
  allSlides: readonly SlideMeta[],
  position: DeckPosition,
  track: TrackId
): DeckPosition {
  const visible = slidesForTrack(allSlides, track);
  if (visible.some((s) => s.id === position.slideId)) return position;

  const fromIndex = allSlides.findIndex((s) => s.id === position.slideId);
  const after = allSlides
    .slice(Math.max(fromIndex, 0))
    .find((s) => visible.includes(s));
  const target = after ?? visible[visible.length - 1];
  return { slideId: target.id, step: 0 };
}

export function totalSteps(slides: readonly SlideMeta[]): number {
  return slides.reduce((sum, slide) => sum + slide.builds + 1, 0);
}

/** 0 at the first step of the first slide, 1 at the last step of the last. */
export function deckProgress(
  slides: readonly SlideMeta[],
  position: DeckPosition
): number {
  const total = totalSteps(slides);
  if (total <= 1) return 1;
  let done = 0;
  for (const slide of slides) {
    if (slide.id === position.slideId) {
      return (done + position.step) / (total - 1);
    }
    done += slide.builds + 1;
  }
  return 0;
}
