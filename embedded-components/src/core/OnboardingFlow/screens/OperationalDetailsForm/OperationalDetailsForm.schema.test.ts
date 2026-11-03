import {
  activateI18nInstance,
  deactivateI18nInstance,
} from '@/i18n/activeI18n';
import { createI18nInstance } from '@/i18n/config';
import { describe, expect, test } from 'vitest';

import type { QuestionResponse } from '@/api/generated/smbdo.schemas';

import { createDynamicZodSchema } from './OperationalDetailsForm.schema';

describe('createDynamicZodSchema', () => {
  test('free-text responses honor minLength and maxLength', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30999',
        responseSchema: {
          type: 'array',
          minItems: 1,
          maxItems: 1,
          items: { type: 'string', minLength: 3, maxLength: 10 },
        },
      },
    ];
    const schema = createDynamicZodSchema(questions);
    expect(schema.safeParse({ question_30999: ['Retail'] }).success).toBe(true);
    expect(schema.safeParse({ question_30999: ['ab'] }).success).toBe(false);
    expect(schema.safeParse({ question_30999: ['a'.repeat(11)] }).success).toBe(
      false
    );
  });

  test('DATE_QUESTION_IDS enforce ISO yyyy-mm-dd', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30071',
        responseSchema: {
          type: 'array',
          minItems: 1,
          maxItems: 1,
          items: { type: 'string' },
        },
      },
    ];
    const schema = createDynamicZodSchema(questions);
    expect(schema.safeParse({ question_30071: ['2024-06-01'] }).success).toBe(
      true
    );
    const bad = schema.safeParse({ question_30071: ['06/01/2024'] });
    expect(bad.success).toBe(false);
    // z.iso.date() also rejects impossible calendar dates
    expect(schema.safeParse({ question_30071: ['2024-02-30'] }).success).toBe(
      false
    );
    // Format message only for format errors; type errors keep "Required"-style
    // messages, as with the pre-upgrade regex refine.
    expect(
      schema.safeParse({ question_30071: [undefined] }).error?.issues[0]
        ?.message
    ).toBe('Required');
  });

  test('messages follow the active provider locale at validation time', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30071',
        responseSchema: {
          type: 'array',
          minItems: 1,
          maxItems: 1,
          items: { type: 'string' },
        },
      },
    ];
    // Schema is built before the locale changes, as with a memoized schema.
    const schema = createDynamicZodSchema(questions);
    const firstMessage = () =>
      schema.safeParse({ question_30071: ['bad'] }).error?.issues[0]?.message;

    expect(firstMessage()).toBe('Invalid date format');
    const french = createI18nInstance({ name: 'frCA' });
    activateI18nInstance(french);
    try {
      expect(firstMessage()).toBe('Format de date invalide');
    } finally {
      deactivateI18nInstance(french);
    }
  });

  test('MONEY_INPUT_QUESTION_IDS require whole numbers (no decimals)', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30005',
        responseSchema: {
          type: 'array',
          minItems: 1,
          maxItems: 1,
          items: { type: 'string' },
        },
      },
    ];
    const schema = createDynamicZodSchema(questions);
    expect(schema.safeParse({ question_30005: ['50000'] }).success).toBe(true);
    const bad = schema.safeParse({ question_30005: ['50000.99'] });
    expect(bad.success).toBe(false);
  });

  test('boolean responses reject values outside true/false strings', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30997',
        responseSchema: {
          type: 'array',
          minItems: 1,
          maxItems: 1,
          items: { type: 'boolean' },
        },
      },
    ];
    const schema = createDynamicZodSchema(questions);
    expect(schema.safeParse({ question_30997: ['true'] }).success).toBe(true);
    const bad = schema.safeParse({ question_30997: ['maybe'] });
    expect(bad.success).toBe(false);
  });

  test('enum string responses reject unknown option', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30996',
        responseSchema: {
          type: 'array',
          minItems: 1,
          maxItems: 1,
          items: {
            type: 'string',
            enum: ['ALPHA', 'BETA'],
          },
        },
      },
    ];
    const schema = createDynamicZodSchema(questions);
    expect(schema.safeParse({ question_30996: ['ALPHA'] }).success).toBe(true);
    const bad = schema.safeParse({ question_30996: ['GAMMA'] });
    expect(bad.success).toBe(false);
  });

  test('integer responses reject non-digit strings', () => {
    const questions: QuestionResponse[] = [
      {
        id: '30995',
        responseSchema: {
          type: 'array',
          minItems: 1,
          maxItems: 1,
          items: { type: 'integer' },
        },
      },
    ];
    const schema = createDynamicZodSchema(questions);
    expect(schema.safeParse({ question_30995: ['42'] }).success).toBe(true);
    const bad = schema.safeParse({ question_30995: ['4x'] });
    expect(bad.success).toBe(false);
  });
});
