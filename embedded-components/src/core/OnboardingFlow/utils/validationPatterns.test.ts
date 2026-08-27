import { describe, expect, it } from 'vitest';

import { containsHtmlLikeTag } from './validationPatterns';

describe('containsHtmlLikeTag', () => {
  it('detects an HTML-like tag', () => {
    expect(containsHtmlLikeTag('Hello <strong>world</strong>')).toBe(true);
  });

  it('accepts plain text', () => {
    expect(containsHtmlLikeTag('Operations and technology')).toBe(false);
  });

  it('accepts unmatched angle brackets', () => {
    expect(containsHtmlLikeTag('Revenue < 100')).toBe(false);
    expect(containsHtmlLikeTag('Revenue > 100')).toBe(false);
  });
});
