import { describe, expect, it } from 'vitest';

import {
  clampPosition,
  deckProgress,
  nextPosition,
  prevPosition,
  totalSteps,
  type SlideMeta,
} from './deck-state';
import { CHAPTERS, SLIDES } from './slides';

const deck: SlideMeta[] = [
  { id: 'a', chapter: 'why', title: 'A', builds: 0, notes: '' },
  { id: 'b', chapter: 'why', title: 'B', builds: 2, notes: '' },
  { id: 'c', chapter: 'ship', title: 'C', builds: 1, notes: '' },
];

describe('deck-state', () => {
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

  it('reports progress across every build step', () => {
    expect(totalSteps(deck)).toBe(6);
    expect(deckProgress(deck, { slideId: 'a', step: 0 })).toBe(0);
    expect(deckProgress(deck, { slideId: 'b', step: 1 })).toBeCloseTo(2 / 5);
    expect(deckProgress(deck, { slideId: 'c', step: 1 })).toBe(1);
  });
});

describe('presentation content', () => {
  it('has unique slide ids that each belong to a known chapter', () => {
    const ids = SLIDES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const chapterIds = CHAPTERS.map((c) => c.id);
    for (const slide of SLIDES) {
      expect(chapterIds).toContain(slide.chapter);
      expect(slide.notes.length).toBeGreaterThan(0);
    }
  });

  it('opens with the title slide and closes with next steps', () => {
    expect(SLIDES[0].id).toBe('welcome');
    expect(SLIDES[SLIDES.length - 1].id).toBe('next-steps');
  });
});
