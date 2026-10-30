import { describe, expect, it } from 'vitest';

import {
  getSpotlightSections,
  SPOTLIGHT_ITEMS,
  type SpotlightItem,
} from './spotlight-content';

describe('SPOTLIGHT_ITEMS', () => {
  it('has unique ids and https URLs', () => {
    expect(new Set(SPOTLIGHT_ITEMS.map((item) => item.id)).size).toBe(
      SPOTLIGHT_ITEMS.length
    );
    for (const item of SPOTLIGHT_ITEMS) {
      expect(item.url).toMatch(/^https:\/\//);
    }
  });
});

describe('getSpotlightSections', () => {
  it('features the newest item and groups the rest by kind, newest first', () => {
    const { latest, clientStories, thoughtLeadership } = getSpotlightSections();

    expect(latest?.id).toBe('mercado-libre');
    expect(clientStories.map((item) => item.id)).toEqual([
      'dream-payments',
      'bill',
      'walmart-marketplace',
    ]);
    expect(thoughtLeadership.map((item) => item.id)).toEqual([
      'ai-fraud-prevention',
      'saas-growth-ai',
    ]);
  });

  it('removes a thought leadership piece from its group when it is the latest', () => {
    const newest: SpotlightItem = {
      ...SPOTLIGHT_ITEMS[1],
      id: 'newest-insight',
      date: '2027-01-01',
    };
    const sections = getSpotlightSections([newest, ...SPOTLIGHT_ITEMS]);

    expect(sections.latest?.id).toBe('newest-insight');
    expect(sections.thoughtLeadership.map((item) => item.id)).not.toContain(
      'newest-insight'
    );
  });

  it('handles an empty list', () => {
    expect(getSpotlightSections([])).toEqual({
      latest: undefined,
      clientStories: [],
      thoughtLeadership: [],
    });
  });
});
