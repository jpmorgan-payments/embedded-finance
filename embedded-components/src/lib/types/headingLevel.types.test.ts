import { describe, expect, test } from 'vitest';

import {
  getChildHeadingLevel,
  getHeadingTag,
  type HeadingLevel,
} from './headingLevel.types';

describe('headingLevel.types', () => {
  describe('getChildHeadingLevel', () => {
    test('returns next level for default offset', () => {
      expect(getChildHeadingLevel(1)).toBe(2);
      expect(getChildHeadingLevel(2)).toBe(3);
      expect(getChildHeadingLevel(3)).toBe(4);
      expect(getChildHeadingLevel(4)).toBe(5);
      expect(getChildHeadingLevel(5)).toBe(6);
    });

    test('clamps to 6 when exceeding maximum', () => {
      expect(getChildHeadingLevel(6)).toBe(6);
      expect(getChildHeadingLevel(5, 2)).toBe(6);
      expect(getChildHeadingLevel(4, 3)).toBe(6);
      expect(getChildHeadingLevel(6, 1)).toBe(6);
    });

    test('supports custom offset', () => {
      expect(getChildHeadingLevel(1, 2)).toBe(3);
      expect(getChildHeadingLevel(2, 3)).toBe(5);
    });

    test('offset of 0 returns same level', () => {
      expect(getChildHeadingLevel(2, 0)).toBe(2);
      expect(getChildHeadingLevel(4, 0)).toBe(4);
    });
  });

  describe('getHeadingTag', () => {
    test('returns correct tag for each level', () => {
      const levels: HeadingLevel[] = [1, 2, 3, 4, 5, 6];
      const expected = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

      levels.forEach((level, index) => {
        expect(getHeadingTag(level)).toBe(expected[index]);
      });
    });
  });
});
