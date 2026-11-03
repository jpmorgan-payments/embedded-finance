import type { QuestionResponse } from '@/api/generated/smbdo.schemas';

import { getEffectiveParent } from './questionTree';

/** `KYC` questions are part of onboarding; `RFI` questions answer a request for information. */
export type QuestionCategory = 'KYC' | 'RFI';

// Set by useQuestionTree from the GET /questions `category` filter; the response itself doesn't carry it.
const readOwnCategory = (
  question: QuestionResponse
): QuestionCategory | undefined => {
  const value = (question as { category?: unknown }).category;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'KYC' || normalized === 'RFI') return normalized;
  // RFI questions are re-categorized ARCHIVED, even while their request is still open.
  return normalized === 'ARCHIVED' ? 'RFI' : undefined;
};

/**
 * A question's own category, or its nearest loaded ancestor's, so follow-ups
 * stay with the question that opened them. Undefined when none is known.
 */
export const getQuestionCategory = (
  question: QuestionResponse,
  allQuestions: QuestionResponse[]
): QuestionCategory | undefined => {
  const visitedIds = new Set<string | undefined>();
  let current: QuestionResponse | undefined = question;
  while (current && !visitedIds.has(current.id)) {
    const category = readOwnCategory(current);
    if (category) return category;
    visitedIds.add(current.id);
    current = getEffectiveParent(current, allQuestions);
  }
  return undefined;
};
