import { UserIcon } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import type { QuestionResponse } from '@/api/generated/smbdo.schemas';

import {
  buildDeltaSectionSummaries,
  countDeltaQuestionProgress,
} from './DeltaPendingFieldsPanel';

const tString = (_key: string, fallback?: string) => fallback ?? _key;

const sections = [
  {
    id: 'personal-section',
    isSection: true,
    sectionConfig: { icon: UserIcon, labelKey: 'Personal details' },
  },
  {
    id: 'business-section',
    isSection: true,
    sectionConfig: { icon: UserIcon, labelKey: 'Business details' },
  },
] as any;

const clientData = {
  parties: [
    {
      id: 'owner1',
      partyType: 'INDIVIDUAL',
      active: true,
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: { firstName: 'Jane', lastName: 'Doe' },
    },
    {
      id: 'owner2',
      partyType: 'INDIVIDUAL',
      active: true,
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: { firstName: 'John', lastName: 'Smith' },
    },
  ],
} as any;

const group = (key: string, stepLabel: string) => ({
  key,
  label: '',
  stepLabel,
  fields: [],
});

describe('buildDeltaSectionSummaries', () => {
  it('groups pending fields by section and per owner with correct counts', () => {
    const summaries = buildDeltaSectionSummaries({
      baselinePendingGroups: [
        group('personal-section:id', 'ID details'),
        group('business-section:ein', 'EIN'),
        group('owners-section:owner1:id', 'ID details'),
        group('owners-section:owner2:id', 'ID details'),
      ],
      completedGroupKeys: new Set(['personal-section:id']),
      sections,
      questionProgress: { total: 2, completed: 0 },
      clientData,
      tString,
    });

    expect(summaries.map((s) => s.key)).toEqual([
      'personal-section',
      'business-section',
      'owners-section:owner1',
      'owners-section:owner2',
      'additional-questions-section',
    ]);

    const personal = summaries.find((s) => s.key === 'personal-section')!;
    expect(personal.title).toBe('Personal details');
    expect(personal.total).toBe(1);
    expect(personal.completed).toBe(1);

    expect(
      summaries.find((s) => s.key === 'owners-section:owner1')!.title
    ).toBe('Jane Doe');
    expect(
      summaries.find((s) => s.key === 'owners-section:owner2')!.title
    ).toBe('John Smith');

    const questions = summaries.find((s) => s.isQuestionsSection)!;
    expect(questions.total).toBe(2);
    expect(questions.completed).toBe(0);
  });

  it('marks the questions summary complete when all are answered', () => {
    const summaries = buildDeltaSectionSummaries({
      baselinePendingGroups: [],
      completedGroupKeys: new Set(),
      sections,
      questionProgress: { total: 2, completed: 2 },
      clientData,
      tString,
    });
    expect(summaries).toHaveLength(1);
    expect(summaries[0].isQuestionsSection).toBe(true);
    expect(summaries[0].total).toBe(2);
    expect(summaries[0].completed).toBe(2);
  });

  it('omits the questions summary when there are no outstanding questions', () => {
    const summaries = buildDeltaSectionSummaries({
      baselinePendingGroups: [group('business-section:ein', 'EIN')],
      completedGroupKeys: new Set(),
      sections,
      questionProgress: { total: 0, completed: 0 },
      clientData,
      tString,
    });
    expect(summaries.map((s) => s.key)).toEqual(['business-section']);
    expect(summaries[0].completed).toBe(0);
    expect(summaries[0].total).toBe(1);
  });
});

describe('countDeltaQuestionProgress', () => {
  // 30158 (boolean) reveals 30162 (text) when answered "true".
  const allQuestions = [
    {
      id: '30005',
      responseSchema: { items: { type: 'integer' } },
      subQuestions: [],
    },
    {
      id: '30158',
      responseSchema: { items: { type: 'boolean' } },
      subQuestions: [{ anyValuesMatch: 'true', questionIds: ['30162'] }],
    },
    { id: '30162', parentQuestionId: '30158' },
  ] as unknown as QuestionResponse[];

  it('counts each outstanding question as its own item', () => {
    const answers: Record<string, string[]> = {};
    const progress = countDeltaQuestionProgress({
      rootQuestionIds: ['30005', '30158'],
      allQuestions,
      getAnswerValues: (id) => answers[id],
      isAnswered: (id) => (answers[id]?.length ?? 0) > 0,
    });
    // Two roots, none revealed (30158 unanswered), none answered.
    expect(progress).toEqual({ total: 2, completed: 0 });
  });

  it('adds a revealed child to the count when the parent answer reveals it', () => {
    const answers: Record<string, string[]> = {
      question_30005: ['5000'],
      question_30158: ['true'],
    };
    const progress = countDeltaQuestionProgress({
      rootQuestionIds: ['30005', '30158'],
      allQuestions,
      getAnswerValues: (id) => answers[`question_${id}`],
      isAnswered: (id) => (answers[`question_${id}`]?.length ?? 0) > 0,
    });
    // 30005 + 30158 answered, 30162 revealed but still blank → 3 total, 2 done.
    expect(progress).toEqual({ total: 3, completed: 2 });
  });

  it('does not count the hidden child when the parent answer hides it', () => {
    const answers: Record<string, string[]> = {
      question_30158: ['false'],
    };
    const progress = countDeltaQuestionProgress({
      rootQuestionIds: ['30158'],
      allQuestions,
      getAnswerValues: (id) => answers[`question_${id}`],
      isAnswered: (id) => (answers[`question_${id}`]?.length ?? 0) > 0,
    });
    // 30158 = "false" hides 30162 → only 1 item, and it's answered.
    expect(progress).toEqual({ total: 1, completed: 1 });
  });
});
