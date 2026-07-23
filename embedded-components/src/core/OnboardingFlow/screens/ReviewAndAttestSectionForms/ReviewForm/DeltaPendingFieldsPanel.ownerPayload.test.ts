import { describe, expect, it } from 'vitest';

import type { QuestionResponse } from '@/api/generated/smbdo.schemas';

import { buildDeltaPendingSubmitPayload } from './DeltaPendingFieldsPanel';

describe('buildDeltaPendingSubmitPayload — owner updates', () => {
  it('includes a beneficial owner tax id under a numeric owner id', () => {
    const ownerId = '2000000113';
    const values: Record<string, unknown> = {
      // controller pending birthDate
      birthDate: '1990-01-01',
      owners: {
        [ownerId]: {
          controllerIds: [{ idType: 'SSN', issuer: 'US', value: '123456782' }],
        },
      },
    };
    const dirtyFields: Record<string, unknown> = {
      birthDate: true,
      owners: {
        [ownerId]: {
          controllerIds: [{ value: true }],
        },
      },
    };

    const payload = buildDeltaPendingSubmitPayload(values, [], [], dirtyFields);

    // Controller birthDate PATCH.
    expect(payload.controllerPartyValues).toMatchObject({
      birthDate: '1990-01-01',
    });

    // Owner SSN PATCH must be present for the numeric-keyed owner.
    const ownerUpdate = payload.ownerUpdates.find((u) => u.partyId === ownerId);
    expect(ownerUpdate).toBeDefined();
    expect(ownerUpdate?.values.controllerIds).toEqual([
      { idType: 'SSN', issuer: 'US', value: '123456782' },
    ]);
  });
});

describe('buildDeltaPendingSubmitPayload — question responses', () => {
  // 30158 (boolean) reveals 30162 (text) when answered "true". 30162 is never
  // itself in outstanding.questionIds — it is a conditional child.
  const allQuestions = [
    {
      id: '30158',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: { type: 'boolean' },
      },
      subQuestions: [{ anyValuesMatch: 'true', questionIds: ['30162'] }],
    },
    {
      id: '30162',
      parentQuestionId: '30158',
      responseSchema: {
        type: 'array',
        minItems: 1,
        maxItems: 1,
        items: { type: 'string' },
      },
    },
  ] as unknown as QuestionResponse[];

  it('includes a discrete (radio/select) answer AND its revealed sub-question', () => {
    // A discrete answer is set via setValue({ shouldDirty: true }), so it must
    // appear in dirtyFields for the payload to include it. This regression
    // guards the bug where radios used setValue WITHOUT shouldDirty, silently
    // dropping the answer from the dirty-filtered save.
    const values: Record<string, unknown> = {
      question_30158: ['true'],
      question_30162: ['Cuba'],
    };
    const dirtyFields: Record<string, unknown> = {
      question_30158: [true],
      question_30162: [true],
    };

    const payload = buildDeltaPendingSubmitPayload(
      values,
      allQuestions,
      ['30158'],
      dirtyFields
    );

    expect(payload.questionResponses).toEqual(
      expect.arrayContaining([
        { questionId: '30158', values: ['true'] },
        { questionId: '30162', values: ['Cuba'] },
      ])
    );
  });

  it('drops a discrete answer that was never marked dirty', () => {
    // Without shouldDirty, the answer is in values but not dirtyFields — it must
    // NOT be saved (the exact bug this fix addresses, asserted as the negative).
    const values: Record<string, unknown> = {
      question_30158: ['false'],
    };
    const dirtyFields: Record<string, unknown> = {};

    const payload = buildDeltaPendingSubmitPayload(
      values,
      allQuestions,
      ['30158'],
      dirtyFields
    );

    expect(payload.questionResponses).toHaveLength(0);
  });
});
