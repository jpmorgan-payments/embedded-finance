import { QuestionResponse } from '@/api/generated/smbdo.schemas';

/**
 * Shared question-tree logic used by both the OperationalDetailsForm (edit)
 * and the ReviewForm (read-only) so their rendering stays identical.
 *
 * The two consumers differ only in where a parent's response comes from:
 *  - OperationalDetailsForm reads live form state (`form.watch`).
 *  - ReviewForm reads saved responses (`clientData.questionResponses`).
 *
 * That difference is abstracted behind the `getResponseValues` callback passed
 * to {@link isQuestionVisible}; everything else (parent resolution, visibility,
 * traversal) is identical.
 */

export const normalizeQuestionId = (id: unknown): string =>
  id == null ? '' : String(id);

export const normalizeComparableValue = (value: unknown): string =>
  String(value).trim().toLowerCase();

export const hasAnyValuesMatch = (
  parentResponse: unknown,
  anyValuesMatch: unknown
): boolean => {
  if (anyValuesMatch == null || parentResponse == null) return false;

  const parentValues = Array.isArray(parentResponse)
    ? parentResponse
    : [parentResponse];
  const matchValues = Array.isArray(anyValuesMatch)
    ? anyValuesMatch
    : [anyValuesMatch];

  const normalizedMatches = matchValues
    .filter((value) => value != null)
    .map((value) => normalizeComparableValue(value));

  if (normalizedMatches.length === 0) return false;

  return parentValues.some((value) => {
    if (value == null) return false;
    return normalizedMatches.includes(normalizeComparableValue(value));
  });
};

/**
 * Resolve the single effective parent for a question so it renders in exactly
 * one place (never under two parents, nor both top-level and as a child).
 *
 * An explicit `parentQuestionId` is authoritative: if it points to a loaded
 * question, that is the parent; if it points to a question we haven't loaded
 * (e.g. an already-answered ancestor), the question is treated as top-level
 * (undefined) rather than being re-homed under some unrelated question that
 * merely references it. This keeps genuinely top-level questions (such as
 * annual income) always visible.
 *
 * Only when there is no `parentQuestionId` do we fall back to a question that
 * references this one via `subQuestions`.
 */
export const getEffectiveParent = (
  question: QuestionResponse,
  allQuestions: QuestionResponse[]
): QuestionResponse | undefined => {
  if (question.parentQuestionId) {
    return allQuestions.find(
      (q) =>
        normalizeQuestionId(q.id) ===
        normalizeQuestionId(question.parentQuestionId)
    );
  }

  const questionId = normalizeQuestionId(question.id);
  return allQuestions.find((q) =>
    q.subQuestions?.some((sq) =>
      sq.questionIds?.some((id) => normalizeQuestionId(id) === questionId)
    )
  );
};

/**
 * A question is top-level when it has no effective parent.
 */
export const isTopLevelQuestion = (
  question: QuestionResponse,
  allQuestions: QuestionResponse[]
): boolean => !getEffectiveParent(question, allQuestions);

/**
 * Direct children of a parent: questions whose single effective parent is the
 * given parent id. Guarantees each question appears under exactly one parent.
 */
export const getChildQuestions = (
  parentId: string | undefined,
  allQuestions: QuestionResponse[]
): QuestionResponse[] => {
  if (!parentId) return [];
  const normalizedParentId = normalizeQuestionId(parentId);
  return allQuestions.filter((q) => {
    const effectiveParent = getEffectiveParent(q, allQuestions);
    return (
      !!effectiveParent &&
      normalizeQuestionId(effectiveParent.id) === normalizedParentId
    );
  });
};

/**
 * Whether a question should be visible. Visibility is recursive: a nested
 * question is visible only when its parent is visible and the parent's
 * response matches the sub-question's `anyValuesMatch`.
 *
 * `getResponseValues` abstracts the response source so the same logic works
 * for live form state and saved responses.
 */
export const isQuestionVisible = (
  question: QuestionResponse,
  allQuestions: QuestionResponse[],
  getResponseValues: (questionId: string) => unknown
): boolean => {
  const parentQuestion = getEffectiveParent(question, allQuestions);

  // Top-level questions are always visible.
  if (!parentQuestion) return true;

  // A nested question is only visible if its parent is visible too.
  if (!isQuestionVisible(parentQuestion, allQuestions, getResponseValues)) {
    return false;
  }

  const parentResponse = getResponseValues(
    normalizeQuestionId(parentQuestion.id)
  );

  if (!parentResponse) return false;

  const questionId = normalizeQuestionId(question.id);
  const subQuestion = parentQuestion.subQuestions?.find((sq) =>
    sq.questionIds?.some((id) => normalizeQuestionId(id) === questionId)
  );

  if (subQuestion?.anyValuesMatch != null) {
    return hasAnyValuesMatch(parentResponse, subQuestion.anyValuesMatch);
  }

  return false;
};
