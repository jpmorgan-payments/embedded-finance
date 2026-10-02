import { describe, expect, it } from 'vitest';

import {
  clampPosition,
  deckProgress,
  nextPosition,
  positionForTrack,
  prevPosition,
  slidesForTrack,
  totalSteps,
  type SlideMeta,
} from './deck-state';
import { CHAPTERS, SLIDES, TRACKS } from './slides';

const deck: SlideMeta[] = [
  {
    id: 'a',
    chapter: 'why',
    title: 'A',
    tracks: ['decision', 'platform'],
    builds: 0,
    notes: '',
  },
  {
    id: 'b',
    chapter: 'why',
    title: 'B',
    tracks: ['platform'],
    builds: 2,
    notes: '',
  },
  {
    id: 'c',
    chapter: 'ship',
    title: 'C',
    tracks: ['decision'],
    builds: 1,
    notes: '',
  },
];

describe('deck-state', () => {
  it('filters slides by audience track', () => {
    expect(slidesForTrack(deck, 'all').map((s) => s.id)).toEqual([
      'a',
      'b',
      'c',
    ]);
    expect(slidesForTrack(deck, 'decision').map((s) => s.id)).toEqual([
      'a',
      'c',
    ]);
    expect(slidesForTrack(deck, 'external')).toEqual([]);
  });

  it('steps through builds before advancing to the next slide', () => {
    expect(nextPosition(deck, { slideId: 'a', step: 0 })).toEqual({
      slideId: 'b',
      step: 0,
    });
    expect(nextPosition(deck, { slideId: 'b', step: 0 })).toEqual({
      slideId: 'b',
      step: 1,
    });
    expect(nextPosition(deck, { slideId: 'b', step: 2 })).toEqual({
      slideId: 'c',
      step: 0,
    });
    expect(nextPosition(deck, { slideId: 'c', step: 1 })).toBeNull();
  });

  it('goes back through builds and lands on the previous slide fully built', () => {
    expect(prevPosition(deck, { slideId: 'b', step: 1 })).toEqual({
      slideId: 'b',
      step: 0,
    });
    expect(prevPosition(deck, { slideId: 'c', step: 0 })).toEqual({
      slideId: 'b',
      step: 2,
    });
    expect(prevPosition(deck, { slideId: 'a', step: 0 })).toBeNull();
  });

  it('clamps unknown slides and out-of-range steps', () => {
    expect(clampPosition(deck, { slideId: 'nope', step: 4 })).toEqual({
      slideId: 'a',
      step: 0,
    });
    expect(clampPosition(deck, { slideId: 'b', step: 9 })).toEqual({
      slideId: 'b',
      step: 2,
    });
    expect(clampPosition(deck, { slideId: 'b', step: -3 })).toEqual({
      slideId: 'b',
      step: 0,
    });
    expect(clampPosition(deck, { slideId: 'b', step: Number.NaN })).toEqual({
      slideId: 'b',
      step: 0,
    });
  });

  it('keeps or moves the position when the track changes', () => {
    expect(
      positionForTrack(deck, { slideId: 'a', step: 0 }, 'decision')
    ).toEqual({ slideId: 'a', step: 0 });
    expect(
      positionForTrack(deck, { slideId: 'b', step: 1 }, 'decision')
    ).toEqual({ slideId: 'c', step: 0 });
    expect(
      positionForTrack(deck, { slideId: 'c', step: 1 }, 'platform')
    ).toEqual({ slideId: 'b', step: 0 });
  });

  it('reports progress across every build step', () => {
    expect(totalSteps(deck)).toBe(6);
    expect(deckProgress(deck, { slideId: 'a', step: 0 })).toBe(0);
    expect(deckProgress(deck, { slideId: 'b', step: 1 })).toBeCloseTo(2 / 5);
    expect(deckProgress(deck, { slideId: 'c', step: 1 })).toBe(1);
  });
});

describe('presentation content', () => {
  it('has unique slide ids that each belong to a known chapter and audience', () => {
    const ids = SLIDES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const chapterIds = CHAPTERS.map((c) => c.id);
    const audienceIds = TRACKS.map((t) => t.id).filter((id) => id !== 'all');
    for (const slide of SLIDES) {
      expect(chapterIds).toContain(slide.chapter);
      expect(slide.tracks.length).toBeGreaterThan(0);
      slide.tracks.forEach((t) => expect(audienceIds).toContain(t));
      expect(slide.notes.length).toBeGreaterThan(0);
    }
  });

  it('gives every audience its own opening and closing slide', () => {
    for (const track of ['decision', 'platform', 'external'] as const) {
      const visible = slidesForTrack(SLIDES, track);
      expect(visible[0].id).toBe('welcome');
      expect(visible[visible.length - 1].id).toBe('next-steps');
    }
  });
});
