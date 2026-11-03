import { describe, expect, it } from 'vitest';

import type { QuestionResponse } from '@/api/generated/smbdo.schemas';

import { getQuestionCategory } from './questionCategory';

const question = (
  id: string,
  extra: Partial<QuestionResponse> & { category?: string } = {}
) => ({ id, ...extra }) as QuestionResponse;

describe('getQuestionCategory', () => {
  it('reads the category regardless of case', () => {
    const rfi = question('1', { category: 'rfi' });
    expect(getQuestionCategory(rfi, [rfi])).toBe('RFI');
  });

  it('ignores values it does not know', () => {
    const other = question('1', { category: 'OTHER' });
    expect(getQuestionCategory(other, [other])).toBeUndefined();
  });

  it('treats an archived question as part of a request for information', () => {
    const archived = question('1', { category: 'ARCHIVED' });
    expect(getQuestionCategory(archived, [archived])).toBe('RFI');
  });

  it('inherits from the nearest categorized ancestor', () => {
    const parent = question('1', {
      category: 'RFI',
      subQuestions: [{ anyValuesMatch: 'true', questionIds: ['2'] }],
    });
    const child = question('2');
    const grandchild = question('3', { parentQuestionId: '2' });
    const all = [parent, child, grandchild];
    expect(getQuestionCategory(child, all)).toBe('RFI');
    expect(getQuestionCategory(grandchild, all)).toBe('RFI');
  });

  it('prefers the question’s own category over its parent’s', () => {
    const parent = question('1', { category: 'RFI' });
    const child = question('2', { parentQuestionId: '1', category: 'KYC' });
    expect(getQuestionCategory(child, [parent, child])).toBe('KYC');
  });
});
