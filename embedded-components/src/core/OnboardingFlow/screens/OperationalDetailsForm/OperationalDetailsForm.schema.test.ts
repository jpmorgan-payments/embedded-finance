import { describe, expect, test } from 'vitest';

import type { QuestionResponse } from '@/api/generated/smbdo.schemas';

import { createDynamicZodSchema } from './OperationalDetailsForm.schema';

describe('createDynamicZodSchema', () => {
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
  });

  test('MONEY_INPUT_QUESTION_IDS allow up to two decimal places', () => {
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
    expect(schema.safeParse({ question_30005: ['50000.99'] }).success).toBe(
      true
    );
    const bad = schema.safeParse({ question_30005: ['50000.999'] });
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
