import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { QuestionResponse } from '@/api/generated/smbdo.schemas';

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

export const createDynamicZodSchema = (questionsData: QuestionResponse[]) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  questionsData.forEach((question) => {
    const itemType = question?.responseSchema?.items?.type ?? 'string';
    const itemEnum = question?.responseSchema?.items?.enum;
    const itemPattern = question?.responseSchema?.items?.pattern;
    const questionId = normalizeQuestionId(question.id);
    const hasParentReference = isReferencedInSubQuestions(
      questionId,
      questionsData
    );
    const isOptional = !!question.parentQuestionId || hasParentReference;

    let valueSchema: z.ZodTypeAny;

    if (question.id && DATE_QUESTION_IDS.includes(question.id)) {
      valueSchema = z
        .string()
        .refine(
          (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
          i18n.t(
            'onboarding-overview:additionalQuestions.validation.dateFormat'
          )
        );
    } else if (question.id && MONEY_INPUT_QUESTION_IDS.includes(question.id)) {
      // Money/currency inputs should allow decimals
      valueSchema = z
        .string()
        .min(
          1,
          i18n.t('onboarding-overview:additionalQuestions.validation.required')
        )
        .refine(
          (val) => /^\d+(\.\d{1,2})?$/.test(val),
          i18n.t(
            'onboarding-overview:additionalQuestions.validation.numberFormat'
          )
        );
    } else if (itemType) {
      switch (itemType) {
        case 'boolean':
          valueSchema = z.enum(['true', 'false'], {
            message: i18n.t('validation:common.invalidOption'),
          });
          break;
        case 'string':
          if (itemEnum) {
            if (itemEnum.length > 0) {
              valueSchema = z.enum([itemEnum[0], ...itemEnum.slice(1)], {
                message: i18n.t('validation:common.invalidOption'),
              });
            } else {
              valueSchema = z
                .string()
                .min(
                  1,
                  i18n.t(
                    'onboarding-overview:additionalQuestions.validation.required'
                  )
                );
            }
          } else {
            valueSchema = z
              .string()
              .min(
                1,
                i18n.t(
                  'onboarding-overview:additionalQuestions.validation.required'
                )
              );
            if (itemPattern) {
              valueSchema = (valueSchema as z.ZodString).refine(
                (val) => new RegExp(itemPattern).test(val),
                i18n.t(
                  'onboarding-overview:additionalQuestions.validation.invalidFormat'
                )
              );
            }
          }
          break;
        case 'integer':
          valueSchema = z
            .string()
            .min(
              1,
              i18n.t(
                'onboarding-overview:additionalQuestions.validation.required'
              )
            )
            .refine(
              (val) => /^\d+$/.test(val),
              i18n.t(
                'onboarding-overview:additionalQuestions.validation.numberFormat'
              )
            );
          break;
        default:
          valueSchema = z
            .string()
            .min(
              1,
              i18n.t(
                'onboarding-overview:additionalQuestions.validation.required'
              )
            );
      }
    } else {
      // Unknown question type
      return;
    }

    // If the question allows multiple values, wrap it in an array
    if (question?.responseSchema?.type === 'array') {
      const childSchema = valueSchema;
      const requiredMsg = i18n.t(
        'onboarding-overview:additionalQuestions.validation.required'
      );
      valueSchema = z.array(childSchema, {
        required_error: requiredMsg,
        invalid_type_error: requiredMsg,
      });

      if (!isOptional) {
        valueSchema = (valueSchema as z.ZodArray<z.ZodTypeAny>)
          .min(
            question?.responseSchema?.minItems ?? 1,
            i18n.t(
              'onboarding-overview:additionalQuestions.validation.required'
            )
          )
          .max(
            question?.responseSchema?.maxItems ?? 1,
            i18n.t(
              'onboarding-overview:additionalQuestions.validation.maxItems',
              { maxItems: question?.responseSchema?.maxItems }
            )
          );
      }

      // Surface child-element validation errors at the field level
      // so FormMessage can display them (zod nests them at path [0] otherwise).
      valueSchema = (valueSchema as z.ZodArray<z.ZodTypeAny>).superRefine(
        (values, context) => {
          values.forEach((value: any) => {
            const result = childSchema.safeParse(value);
            if (result.error) {
              context.addIssue(result.error.issues[0]);
            }
          });
        }
      );
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
      const questionId = normalizeQuestionId(question.id);

      // Only apply conditional validation to questions that are children
      // (have a parent reference or are referenced in subQuestions).
      // Top-level questions are already validated by their field-level schema.
      const hasParent = !!question.parentQuestionId;
      const isChild =
        hasParent || isReferencedInSubQuestions(questionId, questionsData);

      if (!isChild) return;

      // Check if this child question should be validated (is visible based on parent conditionals)
      if (isParentVisible(question, questionsData, values)) {
        const fieldValue = values?.[`question_${questionId}`];
        if (question?.responseSchema?.type === 'array') {
          const minItems = question?.responseSchema?.minItems ?? 1;
          if (
            !fieldValue ||
            !Array.isArray(fieldValue) ||
            fieldValue.length < minItems
          ) {
            context.addIssue({
              code: z.ZodIssueCode.custom,
              message: i18n.t(
                'onboarding-overview:additionalQuestions.validation.required'
              ),
              path: [`question_${questionId}`],
            });
          } else if (question?.responseSchema?.maxItems) {
            if (fieldValue.length > question.responseSchema.maxItems) {
              context.addIssue({
                code: z.ZodIssueCode.custom,
                message: i18n.t(
                  'onboarding-overview:additionalQuestions.validation.maxItems',
                  {
                    maxItems: question?.responseSchema?.maxItems,
                  }
                ),
                path: [`question_${questionId}`],
              });
            }
          }
        } else if (
          !fieldValue ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        ) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: i18n.t(
              'onboarding-overview:additionalQuestions.validation.required'
            ),
            path: [`question_${questionId}`],
          });
        }
      }
    });
  });
};
