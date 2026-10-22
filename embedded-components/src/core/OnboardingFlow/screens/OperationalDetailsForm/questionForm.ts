import { useEffect } from 'react';
import type { FieldValues, UseFormReturn } from 'react-hook-form';

import type {
  ApiError,
  ClientQuestionResponse,
  QuestionResponse,
} from '@/api/generated/smbdo.schemas';
import type { ErrorType } from '@/api/use-axios-instance';
import { isQuestionVisible } from '@/core/OnboardingFlow/utils/questionTree';

/**
 * Shared form plumbing for screens that answer client questions via
 * `PATCH /clients` (`questionResponses`): the onboarding Operational details
 * form and the information-request questions screen.
 */

export type QuestionFormValues = Record<string, string[]>;

export const getQuestionFieldName = (questionId: string | undefined) =>
  `question_${questionId ?? 'undefined'}`;

/**
 * Extract question ID from API error message.
 * Matches patterns like "question with ID [30002]" or similar.
 */
export const extractQuestionIdFromMessage = (
  message: string
): string | null => {
  const match = message.match(/\[(\d+)\]/);
  return match ? match[1] : null;
};

/**
 * Format API error message to be more user-friendly.
 * Extracts the actionable part from verbose server messages.
 */
export const formatErrorMessage = (message: string): string => {
  // Extract the hint in brackets at the end of the message, e.g., "[Please use a 2-letter ISO country code.]"
  const closingBracketIndex = message.endsWith('.')
    ? message.length - 2
    : message.length - 1;
  if (message[closingBracketIndex] === ']') {
    const previousClosingBracketIndex = message.lastIndexOf(
      ']',
      closingBracketIndex - 1
    );
    const openingBracketIndex = message.indexOf(
      '[',
      previousClosingBracketIndex + 1
    );
    if (
      openingBracketIndex >= 0 &&
      openingBracketIndex < closingBracketIndex - 1
    ) {
      return message.slice(openingBracketIndex + 1, closingBracketIndex);
    }
  }

  // If no hint found, try to simplify the message
  if (message.includes('is not supported')) {
    return 'The value entered is not supported. Please select a valid option.';
  }

  return message;
};

/**
 * Default form values keyed by question field name, pre-filled from any saved
 * responses so returning users see their previous answers.
 */
export const buildQuestionDefaultValues = (
  questionIds: string[],
  existingResponses: ClientQuestionResponse[]
): QuestionFormValues =>
  questionIds.reduce<QuestionFormValues>((acc, id) => {
    const existingResponse = existingResponses.find(
      (response) => response.questionId === id
    );
    acc[getQuestionFieldName(id)] = existingResponse?.values ?? [];
    return acc;
  }, {});

/**
 * Convert submitted form values into `questionResponses`, keeping only
 * questions that are visible for the given answers (hidden conditional
 * sub-questions are never sent).
 */
export const buildVisibleQuestionResponses = (
  values: Record<string, unknown>,
  allQuestions: QuestionResponse[]
): ClientQuestionResponse[] => {
  const getResponseValues = (questionId: string) =>
    values[getQuestionFieldName(questionId)];

  return Object.entries(values)
    .filter(([key]) => {
      const questionId = key.replace('question_', '');
      const question = allQuestions.find((q) => q.id === questionId);
      return question
        ? isQuestionVisible(question, allQuestions, getResponseValues)
        : false;
    })
    .map(([key, value]) => ({
      questionId: key.replace('question_', ''),
      values: (Array.isArray(value) ? value : [value]) as string[],
    }));
};

/**
 * Map a `PATCH /clients` error to field-level messages for questions rendered
 * on the form. Errors that don't reference a rendered question are skipped
 * (they still surface through the generic server error alert).
 */
export const getQuestionServerErrors = (
  error: ErrorType<ApiError> | null | undefined,
  allQuestions: QuestionResponse[]
): Array<{ fieldName: string; message: string }> => {
  const context = error?.response?.data?.context;
  if (!context || !Array.isArray(context)) return [];

  return context.flatMap((item: { message?: string }) => {
    if (!item.message) return [];
    const questionId = extractQuestionIdFromMessage(item.message);
    if (!questionId || !allQuestions.some((q) => q.id === questionId)) {
      return [];
    }
    return [
      {
        fieldName: getQuestionFieldName(questionId),
        message: formatErrorMessage(item.message),
      },
    ];
  });
};

/**
 * Show a failed `PATCH /clients` as field-level errors on the matching
 * question inputs and focus the first one.
 */
export const useApplyQuestionServerErrors = <TValues extends FieldValues>({
  form,
  error,
  allQuestions,
}: {
  form: UseFormReturn<TValues>;
  error: ErrorType<ApiError> | null | undefined;
  allQuestions: QuestionResponse[];
}) => {
  useEffect(() => {
    const fieldErrors = getQuestionServerErrors(error, allQuestions);
    fieldErrors.forEach(({ fieldName, message }) => {
      form.setError(fieldName as never, { type: 'server', message });
    });

    const firstErrorField = fieldErrors[0]?.fieldName;
    if (!firstErrorField) return undefined;

    // Wait for the error messages to render before moving focus.
    const timeout = setTimeout(() => {
      form.setFocus(firstErrorField as never);
    }, 100);
    return () => clearTimeout(timeout);
  }, [error, allQuestions, form]);
};
