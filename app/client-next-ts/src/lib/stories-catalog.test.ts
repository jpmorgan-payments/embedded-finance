import { describe, expect, it } from 'vitest';

import { getStory, STORIES, STORY_IDS } from './stories-catalog';

describe('stories catalog', () => {
  it('has unique ids', () => {
    expect(new Set(STORY_IDS).size).toBe(STORIES.length);
  });

  it('is sorted newest first by publish date', () => {
    const dates = STORIES.map((story) => story.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('only sets updated when it is after the publish date', () => {
    for (const story of STORIES) {
      if (story.updated) {
        expect(story.updated > story.date).toBe(true);
      }
    }
  });

  it('includes the October 2026 recipes', () => {
    expect(STORY_IDS).toEqual(
      expect.arrayContaining([
        'ux-atlas',
        'publicly-traded-companies-recipe',
        'approved-client-maintenance-recipe',
        'list-transactions-recipe',
        'digital-onboarding-recipe',
      ])
    );
  });

  it('looks up a story by id', () => {
    expect(getStory('ux-atlas')?.interactiveLink?.to).toBe('/ux-atlas');
  });
});
