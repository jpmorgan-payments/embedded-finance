import { useMemo } from 'react';

import { useSmbdoListQuestions } from '@/api/generated/smbdo';
import {
  ApiError,
  ClientQuestionResponse,
  QuestionResponse,
} from '@/api/generated/smbdo.schemas';
import type { ErrorType } from '@/api/use-axios-instance';

const normalizeQuestionId = (id: unknown): string =>
  id == null ? '' : String(id);

/**
 * Extract all sub-question IDs referenced by a set of questions.
 */
const extractReferencedIds = (questions: QuestionResponse[]): Set<string> => {
  const ids = new Set<string>();
  questions.forEach((q) => {
    q.subQuestions?.forEach((sq) => {
      sq.questionIds?.forEach((id) => {
        const normalizedId = normalizeQuestionId(id);
        if (normalizedId) ids.add(normalizedId);
      });
    });
  });
  return ids;
};

/**
 * Merge multiple question arrays and de-duplicate by normalized ID.
 */
const mergeQuestions = (
  ...questionSets: QuestionResponse[][]
): QuestionResponse[] => {
  const seen = new Set<string>();
  const merged: QuestionResponse[] = [];
  for (const questions of questionSets) {
    for (const q of questions) {
      const id = normalizeQuestionId(q.id);
      if (id && !seen.has(id)) {
        seen.add(id);
        merged.push(q);
      }
    }
  }
  return merged;
};

/**
 * Find IDs that haven't been fetched yet.
 */
const findMissingIds = (
  referencedIds: Set<string>,
  fetchedIds: Set<string>
): string[] => {
  const missing: string[] = [];
  referencedIds.forEach((id) => {
    if (!fetchedIds.has(id)) missing.push(id);
  });
  return missing.sort((a, b) => a.localeCompare(b));
};

// Maximum depth of sub-question fetches to prevent runaway chains.
// Each level is a separate API call that waits for the previous.
const MAX_FETCH_DEPTH = 5;

interface UseQuestionTreeOptions {
  outstandingQuestionIds: string[];
  existingQuestionResponses: ClientQuestionResponse[];
}

interface UseQuestionTreeResult {
  /** All questions across all nesting levels, de-duplicated. */
  allQuestions: QuestionResponse[];
  /** All question IDs that should have form fields (root + all discovered). */
  allFormQuestionIds: string[];
  /** True while any fetch in the chain is still loading. */
  isLoading: boolean;
  /** First fetch error, if any. */
  error: ErrorType<ApiError> | null;
}

/**
 * Progressively fetches a question tree to arbitrary depth.
 *
 * React hooks must be called unconditionally, so we declare a fixed number
 * of `useSmbdoListQuestions` calls (MAX_FETCH_DEPTH) and enable/disable
 * them based on whether the previous level discovered new IDs.
 *
 * Each level:
 *  1. Takes the questions returned by the previous level
 *  2. Extracts sub-question IDs that haven't been fetched yet
 *  3. Fetches those IDs (disabled if empty)
 *
 * After all levels resolve, questions from every level are merged and
 * de-duplicated.
 */
export const useQuestionTree = ({
  outstandingQuestionIds,
  existingQuestionResponses,
}: UseQuestionTreeOptions): UseQuestionTreeResult => {
  // Merge outstanding and existing question IDs
  const rootQuestionIds = useMemo(() => {
    const existingIds = existingQuestionResponses.map(
      (r) => r.questionId ?? 'undefined'
    );
    return [...new Set([...outstandingQuestionIds, ...existingIds])].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [outstandingQuestionIds, existingQuestionResponses]);

  // --- Level 0: primary fetch ---
  const {
    data: l0Data,
    status: l0Status,
    error: l0Error,
  } = useSmbdoListQuestions({
    questionIds: rootQuestionIds.join(','),
  });

  const l0Questions = l0Data?.questions ?? [];
  const l0FetchedIds = useMemo(
    () =>
      new Set([
        ...rootQuestionIds,
        ...l0Questions.map((q) => normalizeQuestionId(q.id)),
      ]),
    [rootQuestionIds, l0Questions]
  );

  // --- Level 1 ---
  const l1Ids = useMemo(
    () => findMissingIds(extractReferencedIds(l0Questions), l0FetchedIds),
    [l0Questions, l0FetchedIds]
  );
  const { data: l1Data, status: l1Status } = useSmbdoListQuestions(
    { questionIds: l1Ids.join(',') },
    { query: { enabled: l1Ids.length > 0 } }
  );
  const l1Questions = l1Data?.questions ?? [];
  const l1FetchedIds = useMemo(
    () =>
      new Set([
        ...l0FetchedIds,
        ...l1Ids,
        ...l1Questions.map((q) => normalizeQuestionId(q.id)),
      ]),
    [l0FetchedIds, l1Ids, l1Questions]
  );

  // --- Level 2 ---
  const l2Ids = useMemo(
    () =>
      MAX_FETCH_DEPTH >= 2
        ? findMissingIds(extractReferencedIds(l1Questions), l1FetchedIds)
        : [],
    [l1Questions, l1FetchedIds]
  );
  const { data: l2Data, status: l2Status } = useSmbdoListQuestions(
    { questionIds: l2Ids.join(',') },
    { query: { enabled: l2Ids.length > 0 } }
  );
  const l2Questions = l2Data?.questions ?? [];
  const l2FetchedIds = useMemo(
    () =>
      new Set([
        ...l1FetchedIds,
        ...l2Ids,
        ...l2Questions.map((q) => normalizeQuestionId(q.id)),
      ]),
    [l1FetchedIds, l2Ids, l2Questions]
  );

  // --- Level 3 ---
  const l3Ids = useMemo(
    () =>
      MAX_FETCH_DEPTH >= 3
        ? findMissingIds(extractReferencedIds(l2Questions), l2FetchedIds)
        : [],
    [l2Questions, l2FetchedIds]
  );
  const { data: l3Data, status: l3Status } = useSmbdoListQuestions(
    { questionIds: l3Ids.join(',') },
    { query: { enabled: l3Ids.length > 0 } }
  );
  const l3Questions = l3Data?.questions ?? [];
  const l3FetchedIds = useMemo(
    () =>
      new Set([
        ...l2FetchedIds,
        ...l3Ids,
        ...l3Questions.map((q) => normalizeQuestionId(q.id)),
      ]),
    [l2FetchedIds, l3Ids, l3Questions]
  );

  // --- Level 4 ---
  const l4Ids = useMemo(
    () =>
      MAX_FETCH_DEPTH >= 4
        ? findMissingIds(extractReferencedIds(l3Questions), l3FetchedIds)
        : [],
    [l3Questions, l3FetchedIds]
  );
  const { data: l4Data, status: l4Status } = useSmbdoListQuestions(
    { questionIds: l4Ids.join(',') },
    { query: { enabled: l4Ids.length > 0 } }
  );
  const l4Questions = l4Data?.questions ?? [];

  // --- Merge all levels ---
  const allQuestions = useMemo(
    () =>
      mergeQuestions(
        l0Questions,
        l1Questions,
        l2Questions,
        l3Questions,
        l4Questions
      ),
    [l0Questions, l1Questions, l2Questions, l3Questions, l4Questions]
  );

  const allFormQuestionIds = useMemo(() => {
    const ids = new Set([
      ...rootQuestionIds,
      ...l1Ids,
      ...l2Ids,
      ...l3Ids,
      ...l4Ids,
    ]);
    return [...ids].sort((a, b) => a.localeCompare(b));
  }, [rootQuestionIds, l1Ids, l2Ids, l3Ids, l4Ids]);

  const isLoading =
    l0Status === 'pending' ||
    (l1Ids.length > 0 && l1Status === 'pending') ||
    (l2Ids.length > 0 && l2Status === 'pending') ||
    (l3Ids.length > 0 && l3Status === 'pending') ||
    (l4Ids.length > 0 && l4Status === 'pending');

  return {
    allQuestions,
    allFormQuestionIds,
    isLoading,
    error: l0Error ?? null,
  };
};
