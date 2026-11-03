import { useEffect, useMemo, useRef } from 'react';

import { useSmbdoListQuestions } from '@/api/generated/smbdo';
import type {
  ClientResponse,
  SmbdoListQuestionsParams,
} from '@/api/generated/smbdo.schemas';

/**
 * The client's outstanding and answered questions that the API files as RFI
 * (or ARCHIVED) rather than KYC. GET /questions filters by `category` without
 * returning it, so this asks which of the IDs are KYC and takes the rest.
 * Undefined while first loading, on error, or when the answer doesn't fit one page.
 */
export const useRfiQuestionIds = (
  clientData: ClientResponse | undefined
): string[] | undefined => {
  const questionIds = useMemo(
    () =>
      [
        ...new Set([
          ...(clientData?.outstanding?.questionIds ?? []),
          ...(clientData?.questionResponses ?? []).flatMap((response) =>
            response.questionId ? [response.questionId] : []
          ),
        ]),
      ].sort((a, b) => a.localeCompare(b)),
    [clientData?.outstanding?.questionIds, clientData?.questionResponses]
  );

  const params: SmbdoListQuestionsParams & { category: 'KYC' } = {
    questionIds: questionIds.join(','),
    category: 'KYC',
  };
  const { data, status } = useSmbdoListQuestions(params, {
    query: { enabled: questionIds.length > 0 },
  });

  const result = useMemo(() => {
    if (questionIds.length === 0) return [];
    if (status !== 'success') return undefined;
    const kycQuestions = data?.questions ?? [];
    // The API returns at most 25 questions; a partial page would misfile the rest as RFI.
    if ((data?.metadata?.total ?? kycQuestions.length) > kycQuestions.length) {
      return undefined;
    }
    const kycIds = new Set(kycQuestions.map((question) => String(question.id)));
    return questionIds.filter((id) => !kycIds.has(id));
  }, [data, status, questionIds]);

  // A new question ID changes the lookup; until it answers, unknown would file every question as KYC.
  const lastResultRef = useRef<string[]>();
  useEffect(() => {
    if (result !== undefined) lastResultRef.current = result;
  }, [result]);

  return result === undefined && status === 'pending'
    ? lastResultRef.current
    : result;
};
