import { afterEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import { activateI18nInstance, deactivateI18nInstance } from './activeI18n';
import { createI18nInstance, i18n } from './config';

const firstMessage = (schema: z.ZodType, value: unknown) =>
  schema.safeParse(value).error?.issues[0]?.message;

describe('zodI18nErrorMap', () => {
  afterEach(async () => {
    await i18n.changeLanguage('enUS');
  });

  it('translates missing values as required', () => {
    expect(firstMessage(z.object({ name: z.string() }), {})).toBe('Required');
    expect(firstMessage(z.string(), null)).toBe('Required');
  });

  it('translates type mismatches', () => {
    expect(firstMessage(z.string(), 5)).toBe(
      'Expected string, received number'
    );
    expect(firstMessage(z.date(), new Date('invalid'))).toBe('Invalid date');
  });

  // Parity with zod-i18n-map on Zod 3 (verified side by side during the upgrade).
  it('matches Zod 3 messages for missing or wrongly typed enum values', () => {
    const phoneType = z.object({ phoneType: z.enum(['MOBILE', 'BUSINESS']) });
    expect(firstMessage(phoneType, {})).toBe('Required');
    expect(firstMessage(z.enum(['A', 'B']), null)).toBe('Required');
    expect(firstMessage(z.enum(['A', 'B']), 1)).toBe(
      "Expected 'A' | 'B', received number"
    );
    expect(firstMessage(z.enum({ A: 'A_VAL', B: 'B_VAL' }), undefined)).toBe(
      'Required'
    );
    // Single-value enums are still enums, not literals.
    expect(firstMessage(z.enum(['ONLY']), 'x')).toBe(
      "Invalid enum value. Expected 'ONLY', received 'x'"
    );
  });

  it('matches Zod 3 messages for integers', () => {
    expect(firstMessage(z.number().int(), 1.5)).toBe(
      'Expected integer, received float'
    );
  });

  it('translates size constraints by origin and range kind', () => {
    expect(firstMessage(z.string().min(2), 'a')).toBe(
      'String must contain at least 2 character(s)'
    );
    expect(firstMessage(z.array(z.string()).length(2), ['a'])).toBe(
      'Array must contain exactly 2 element(s)'
    );
    expect(firstMessage(z.number().lt(5), 5)).toBe(
      'Number must be less than 5'
    );
  });

  it('translates enum, literal and string format issues', () => {
    expect(firstMessage(z.enum(['a', 'b']), 'c')).toBe(
      "Invalid enum value. Expected 'a' | 'b', received 'c'"
    );
    expect(firstMessage(z.literal('a'), 'b')).toBe(
      'Invalid literal value, expected "a"'
    );
    expect(firstMessage(z.email(), 'nope')).toBe('Invalid email');
    expect(firstMessage(z.string().startsWith('ab'), 'zz')).toBe(
      'Invalid input: must start with "ab"'
    );
  });

  it('supports i18n keys on custom issues', () => {
    const schema = z.string().refine(() => false, {
      params: { i18n: 'errors.invalid_date' },
    });
    expect(firstMessage(schema, 'x')).toBe('Invalid date');
  });

  it('keeps schema-level messages ahead of the global map', () => {
    expect(firstMessage(z.string().min(2, 'Too short'), 'a')).toBe('Too short');
  });

  it('follows the active language', async () => {
    await i18n.changeLanguage('frCA');
    expect(firstMessage(z.string(), undefined)).toBe('Obligatoire');
  });

  it('translates Zod 4 string formats', () => {
    expect(firstMessage(z.string().includes('ab'), 'zz')).toBe(
      'Invalid input: must include "ab"'
    );
    expect(firstMessage(z.string().regex(/^a$/), 'b')).toBe('Invalid format');
    expect(firstMessage(z.ipv4(), 'nope')).toBe('Invalid IPv4 address');
    expect(firstMessage(z.string().lowercase(), 'ABC')).toBe(
      'Must be lowercase'
    );
  });

  it('formats date bounds with the active locale', () => {
    const minimum = new Date(2024, 0, 2);
    expect(firstMessage(z.date().min(minimum), new Date(2024, 0, 1))).toBe(
      `Date must be greater than or equal to ${minimum.toLocaleString('en-US')}`
    );
  });

  describe('provider-scoped instances', () => {
    it('uses the most recently activated instance and falls back on deactivate', () => {
      const french = createI18nInstance({ name: 'frCA' });
      const spanish = createI18nInstance({ name: 'esUS' });
      try {
        activateI18nInstance(french);
        activateI18nInstance(spanish);
        expect(firstMessage(z.string(), undefined)).toBe('Requerido');

        deactivateI18nInstance(spanish);
        expect(firstMessage(z.string(), undefined)).toBe('Obligatoire');
      } finally {
        deactivateI18nInstance(french);
        deactivateI18nInstance(spanish);
      }
      expect(firstMessage(z.string(), undefined)).toBe('Required');
    });

    it('applies zod content-token overrides', () => {
      const instance = createI18nInstance({
        tokens: {
          zod: {
            errors: { invalid_type_received_undefined: 'Please fill in' },
          },
        },
      });
      try {
        activateI18nInstance(instance);
        expect(firstMessage(z.string(), undefined)).toBe('Please fill in');
      } finally {
        deactivateI18nInstance(instance);
      }
    });
  });
});
