import { tActive } from '@/i18n/activeI18n';
import { z } from 'zod';

import { QuestionResponse } from '@/api/generated/smbdo.schemas';

// Lazy errors resolve at validation time so memoized schemas follow the active
// provider's locale and content tokens.
const requiredError = {
  error: () =>
    tActive('onboarding-overview:additionalQuestions.validation.required'),
};
const invalidOptionError = {
  error: () => tActive('validation:common.invalidOption'),
};

const normalizeComparableValue = (value: unknown): string =>
  String(value).trim().toLowerCase();

const hasAnyValuesMatch = (
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

const normalizeQuestionId = (id: unknown): string =>
  id == null ? '' : String(id);

// Helper to check if a question's parent is visible (recursive for nested hierarchies)
const isParentVisible = (
  question: QuestionResponse,
  questionsData: QuestionResponse[],
  values: Record<string, unknown>
): boolean => {
  const questionId = normalizeQuestionId(question.id);
  const parentQuestion = question.parentQuestionId
    ? questionsData.find(
        (q) =>
          normalizeQuestionId(q.id) ===
          normalizeQuestionId(question.parentQuestionId)
      )
    : questionsData.find((q) =>
        q.subQuestions?.some((sq) =>
          sq.questionIds?.some((id) => normalizeQuestionId(id) === questionId)
        )
      );

  if (!parentQuestion) return true;

  // Parent must be visible too (recursive for deeply nested questions)
  if (!isParentVisible(parentQuestion, questionsData, values)) return false;

  const parentQuestionId = normalizeQuestionId(parentQuestion.id);
  const parentValue = values?.[`question_${parentQuestionId}`];

  if (!parentValue) return false;

  const subQuestion = parentQuestion.subQuestions?.find((sq) =>
    sq.questionIds?.some((id) => normalizeQuestionId(id) === questionId)
  );

  if (subQuestion?.anyValuesMatch == null) return false;

  return hasAnyValuesMatch(parentValue, subQuestion.anyValuesMatch);
};

// Check if a question ID is referenced anywhere in the subquestion tree (recursive)
const isReferencedInSubQuestions = (
  questionId: string,
  questionsData: QuestionResponse[]
): boolean => {
  const questionsMap = new Map(
    questionsData.map((q) => [normalizeQuestionId(q.id), q])
  );

  const checkReferenced = (
    q: QuestionResponse,
    visited: Set<string>
  ): boolean => {
    const qId = normalizeQuestionId(q.id);
    if (visited.has(qId)) return false;
    visited.add(qId);

    // Check if this question references our target ID
    const directMatch = q.subQuestions?.some((sq) =>
      sq.questionIds?.some((id) => normalizeQuestionId(id) === questionId)
    );

    if (directMatch) return true;

    // Recursively check nested subquestions
    let nestedMatch = false;
    q.subQuestions?.forEach((sq) => {
      sq.questionIds?.forEach((id) => {
        const referencedQuestion = questionsMap.get(normalizeQuestionId(id));
        if (
          referencedQuestion &&
          checkReferenced(referencedQuestion, visited)
        ) {
          nestedMatch = true;
        }
      });
    });

    return nestedMatch;
  };

  return questionsData.some((q) => checkReferenced(q, new Set<string>()));
};

// Define question IDs that should use a datepicker
export const DATE_QUESTION_IDS = ['30071', '30073']; // Add more IDs as needed
export const MONEY_INPUT_QUESTION_IDS = ['30005']; // Add more IDs as needed

// Build the schema for a string-typed question (enum options or pattern-validated text)
const buildStringValueSchema = (
  itemEnum: string[] | undefined,
  itemPattern: string | undefined,
  lengthLimits: { minLength?: number; maxLength?: number } = {}
): z.ZodType => {
  if (itemEnum) {
    if (itemEnum.length > 0) {
      return z.enum([itemEnum[0], ...itemEnum.slice(1)], invalidOptionError);
    }
    return z.string().min(1, requiredError);
  }

  const { minLength, maxLength } = lengthLimits;
  let stringSchema = z.string().min(1, requiredError);
  if (minLength && minLength > 1) {
    stringSchema = stringSchema.min(minLength, {
      error: () =>
        tActive(
          'onboarding-overview:additionalQuestions.validation.minLength',
          {
            minLength,
          }
        ),
    });
  }
  if (maxLength) {
    stringSchema = stringSchema.max(maxLength, {
      error: () =>
        tActive(
          'onboarding-overview:additionalQuestions.validation.maxLength',
          {
            maxLength,
          }
        ),
    });
  }
  if (itemPattern) {
    const pattern = new RegExp(itemPattern);
    return stringSchema.refine((val) => pattern.test(val), {
      error: () =>
        tActive(
          'onboarding-overview:additionalQuestions.validation.invalidFormat'
        ),
    });
  }
  return stringSchema;
};

// Build the scalar (non-array) value schema for a question; returns null for unknown types
const buildScalarValueSchema = (
  question: QuestionResponse
): z.ZodType | null => {
  const itemType = question?.responseSchema?.items?.type ?? 'string';
  const itemEnum = question?.responseSchema?.items?.enum;
  const itemPattern = question?.responseSchema?.items?.pattern;

  if (question.id && DATE_QUESTION_IDS.includes(question.id)) {
    // ISO calendar date (YYYY-MM-DD); also rejects impossible dates like Feb 30.
    // Only format errors get the date message; a missing or wrongly typed value
    // keeps the default "Required"-style message, as before.
    return z.iso.date({
      error: (issue) =>
        issue.code === 'invalid_format'
          ? tActive(
              'onboarding-overview:additionalQuestions.validation.dateFormat'
            )
          : undefined,
    });
  }

  if (question.id && MONEY_INPUT_QUESTION_IDS.includes(question.id)) {
    // Money/currency inputs must be whole numbers — the server only accepts
    // integers, so reject any decimal input.
    return z
      .string()
      .min(1, requiredError)
      .regex(/^\d+$/, {
        error: () =>
          tActive(
            'onboarding-overview:additionalQuestions.validation.wholeNumber'
          ),
      });
  }

  if (!itemType) return null;

  switch (itemType) {
    case 'boolean':
      return z.enum(['true', 'false'], invalidOptionError);
    case 'string':
      return buildStringValueSchema(itemEnum, itemPattern, {
        minLength: question?.responseSchema?.items?.minLength,
        maxLength: question?.responseSchema?.items?.maxLength,
      });
    case 'integer':
      return z
        .string()
        .min(1, requiredError)
        .regex(/^\d+$/, {
          error: () =>
            tActive(
              'onboarding-overview:additionalQuestions.validation.numberFormat'
            ),
        });
    default:
      return z.string().min(1, requiredError);
  }
};

// Wrap a scalar schema in an array, applying min/max and surfacing child errors
const wrapArrayValueSchema = (
  childSchema: z.ZodType,
  question: QuestionResponse,
  isOptional: boolean
): z.ZodType => {
  let arraySchema = z.array(childSchema, requiredError);

  if (!isOptional) {
    const maxItems = question?.responseSchema?.maxItems;
    arraySchema = arraySchema
      .min(question?.responseSchema?.minItems ?? 1, requiredError)
      .max(maxItems ?? 1, {
        error: () =>
          tActive(
            'onboarding-overview:additionalQuestions.validation.maxItems',
            {
              maxItems,
            }
          ),
      });
  }

  // Surface child-element validation errors at the field level
  // so FormMessage can display them (zod nests them at path [0] otherwise).
  return arraySchema.superRefine((values, context) => {
    values.forEach((value: unknown) => {
      const result = childSchema.safeParse(value);
      if (result.error) {
        context.addIssue(result.error.issues[0] as z.core.$ZodRawIssue);
      }
    });
  });
};

// Validate an array-typed child question's value (min/max item counts)
const validateArrayChildValue = (
  question: QuestionResponse,
  questionId: string,
  fieldValue: unknown,
  context: z.RefinementCtx
): void => {
  const minItems = question?.responseSchema?.minItems ?? 1;
  if (
    !fieldValue ||
    !Array.isArray(fieldValue) ||
    fieldValue.length < minItems
  ) {
    context.addIssue({
      code: 'custom',
      message: tActive(
        'onboarding-overview:additionalQuestions.validation.required'
      ),
      path: [`question_${questionId}`],
    });
    return;
  }

  const maxItems = question?.responseSchema?.maxItems;
  if (maxItems && fieldValue.length > maxItems) {
    context.addIssue({
      code: 'custom',
      message: tActive(
        'onboarding-overview:additionalQuestions.validation.maxItems',
        { maxItems }
      ),
      path: [`question_${questionId}`],
    });
  }
};

// Conditionally validate a child question that is visible based on its parent's answer
const validateChildQuestion = (
  question: QuestionResponse,
  questionsData: QuestionResponse[],
  values: Record<string, unknown>,
  context: z.RefinementCtx
): void => {
  const questionId = normalizeQuestionId(question.id);

  // Only apply conditional validation to questions that are children
  // (have a parent reference or are referenced in subQuestions).
  // Top-level questions are already validated by their field-level schema.
  const isChild =
    !!question.parentQuestionId ||
    isReferencedInSubQuestions(questionId, questionsData);

  if (!isChild) return;

  // Check if this child question should be validated (is visible based on parent conditionals)
  if (!isParentVisible(question, questionsData, values)) return;

  const fieldValue = values?.[`question_${questionId}`];
  if (question?.responseSchema?.type === 'array') {
    validateArrayChildValue(question, questionId, fieldValue, context);
    return;
  }

  if (!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)) {
    context.addIssue({
      code: 'custom',
      message: tActive(
        'onboarding-overview:additionalQuestions.validation.required'
      ),
      path: [`question_${questionId}`],
    });
  }
};

export const createDynamicZodSchema = (questionsData: QuestionResponse[]) => {
  const schemaFields: Record<string, z.ZodType> = {};

  questionsData.forEach((question) => {
    const questionId = normalizeQuestionId(question.id);
    const hasParentReference = isReferencedInSubQuestions(
      questionId,
      questionsData
    );
    const isOptional = !!question.parentQuestionId || hasParentReference;

    let valueSchema = buildScalarValueSchema(question);
    if (valueSchema === null) {
      // Unknown question type
      return;
    }

    // If the question allows multiple values, wrap it in an array
    if (question?.responseSchema?.type === 'array') {
      valueSchema = wrapArrayValueSchema(valueSchema, question, isOptional);
    }

    // Sub-questions are validated conditionally in the superRefine below,
    // so mark them as optional at the field level to avoid blocking
    // validation when the sub-question is hidden.
    schemaFields[`question_${question.id}`] = isOptional
      ? valueSchema.optional()
      : valueSchema;
  });

  return z.object(schemaFields).superRefine((values, context) => {
    questionsData.forEach((question) => {
      validateChildQuestion(question, questionsData, values, context);
    });
  });
};
