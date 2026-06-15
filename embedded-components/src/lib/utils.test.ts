import { describe, expect, it } from 'vitest';

import { _get, cn, createRegExpAndMessage, isValueEmpty } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names', () => {
      const result = cn('eb-text-sm', 'eb-font-bold');
      expect(result).toContain('eb-text-sm');
      expect(result).toContain('eb-font-bold');
    });

    it('handles conditional classes', () => {
      const result = cn('eb-base', false && 'eb-hidden', 'eb-flex');
      expect(result).toContain('eb-base');
      expect(result).toContain('eb-flex');
      expect(result).not.toContain('eb-hidden');
    });

    it('deduplicates conflicting tailwind classes', () => {
      const result = cn('eb-p-4', 'eb-p-2');
      expect(result).toBe('eb-p-2');
    });

    it('handles undefined and null', () => {
      const result = cn('eb-flex', undefined, null, 'eb-gap-2');
      expect(result).toContain('eb-flex');
      expect(result).toContain('eb-gap-2');
    });

    it('returns empty string for no inputs', () => {
      expect(cn()).toBe('');
    });
  });

  describe('isValueEmpty', () => {
    it('returns true for undefined', () => {
      expect(isValueEmpty(undefined)).toBe(true);
    });

    it('returns true for null', () => {
      expect(isValueEmpty(null)).toBe(true);
    });

    it('returns true for empty string', () => {
      expect(isValueEmpty('')).toBe(true);
    });

    it('returns true for empty array', () => {
      expect(isValueEmpty([])).toBe(true);
    });

    it('returns true for empty object', () => {
      expect(isValueEmpty({})).toBe(true);
    });

    it('returns false for non-empty string', () => {
      expect(isValueEmpty('hello')).toBe(false);
    });

    it('returns false for non-empty array', () => {
      expect(isValueEmpty([1, 2])).toBe(false);
    });

    it('returns false for non-empty object', () => {
      expect(isValueEmpty({ key: 'value' })).toBe(false);
    });

    it('returns false for number 0', () => {
      expect(isValueEmpty(0)).toBe(false);
    });

    it('returns false for boolean false', () => {
      expect(isValueEmpty(false)).toBe(false);
    });
  });

  describe('_get', () => {
    const obj = {
      a: { b: { c: 42 } },
      arr: [{ id: 1 }, { id: 2 }],
      simple: 'value',
    };

    it('gets nested value with dot path', () => {
      expect(_get(obj, 'a.b.c')).toBe(42);
    });

    it('gets top-level value', () => {
      expect(_get(obj, 'simple')).toBe('value');
    });

    it('returns defaultValue when path does not exist', () => {
      expect(_get(obj, 'a.b.x', 'default')).toBe('default');
    });

    it('returns defaultValue for null object', () => {
      expect(_get(null, 'a.b', 'fallback')).toBe('fallback');
    });

    it('returns defaultValue for undefined object', () => {
      expect(_get(undefined, 'x', 'nope')).toBe('nope');
    });

    it('handles array path format', () => {
      expect(_get(obj, ['a', 'b', 'c'])).toBe(42);
    });

    it('handles bracket notation for standalone indices', () => {
      const obj2 = { 0: 'zero', 1: 'one' };
      expect(_get({ arr: obj2 }, 'arr.0')).toBe('zero');
    });

    it('returns undefined when no defaultValue and path missing', () => {
      expect(_get(obj, 'missing')).toBeUndefined();
    });
  });

  describe('createRegExpAndMessage', () => {
    it('creates regex allowing alphanumeric and spaces by default', () => {
      const [regex, message] = createRegExpAndMessage('', 'Allowed: ');
      expect(regex.test('Hello World 123')).toBe(true);
      expect(regex.test('Hello@World')).toBe(false);
      expect(message).toBe('Allowed: ');
    });

    it('allows specified special characters', () => {
      const [regex] = createRegExpAndMessage('-_.', 'Chars: ');
      expect(regex.test('hello-world_v2.0')).toBe(true);
      expect(regex.test('hello@world')).toBe(false);
    });

    it('escapes regex special characters like ^', () => {
      const [regex] = createRegExpAndMessage('^', 'Msg: ');
      expect(regex.test('test^value')).toBe(true);
    });

    it('escapes backslash character', () => {
      const [regex] = createRegExpAndMessage('\\', 'Msg: ');
      expect(regex.test('path\\file')).toBe(true);
    });

    it('includes special chars in message separated by spaces', () => {
      const [, message] = createRegExpAndMessage('-_.', 'Allowed: ');
      expect(message).toBe('Allowed: - _ .');
    });

    it('handles undefined specialCharacters', () => {
      const [regex, message] = createRegExpAndMessage(undefined, 'Msg: ');
      expect(regex.test('abc123')).toBe(true);
      expect(message).toBe('Msg: ');
    });
  });
});
