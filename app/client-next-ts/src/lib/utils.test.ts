import { describe, expect, it } from 'vitest';

import { cn, formatIsoDate } from './utils';

describe('formatIsoDate', () => {
  it('formats YYYY-MM-DD without timezone drift', () => {
    expect(formatIsoDate('2026-04-15')).toBe('April 15, 2026');
    expect(formatIsoDate('2026-01-01')).toBe('January 1, 2026');
  });

  it('supports short month names', () => {
    expect(formatIsoDate('2026-10-15', 'short')).toBe('Oct 15, 2026');
  });
});

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('should handle false conditional classes', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class');
  });

  it('should deduplicate conflicting Tailwind classes', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base-class', undefined, null, 'valid-class');
    expect(result).toBe('base-class valid-class');
  });

  it('should handle empty strings', () => {
    const result = cn('base-class', '', 'valid-class');
    expect(result).toBe('base-class valid-class');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('should handle objects with boolean values', () => {
    const result = cn({
      'active-class': true,
      'inactive-class': false,
      'conditional-class': true,
    });
    expect(result).toBe('active-class conditional-class');
  });
});
