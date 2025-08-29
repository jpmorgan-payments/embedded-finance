import { i18n } from '@/i18n/config';
import { z } from 'zod';

import { QuestionResponse } from '@/api/generated/smbdo.schemas';

// Define question IDs that should use a datepicker
export const DATE_QUESTION_IDS = ['30071', '30073']; // Add more IDs as needed
export const MONEY_INPUT_QUESTION_IDS = ['30005']; // Add more IDs as needed

export const createDynamicZodSchema = (questionsData: QuestionResponse[]) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  questionsData.forEach((question) => {
    const itemType = question?.responseSchema?.items?.type ?? 'string';
    const itemEnum = question?.responseSchema?.items?.enum;
    const itemPattern = question?.responseSchema?.items?.pattern;
    const isOptional = !!question.parentQuestionId;

    let valueSchema: z.ZodTypeAny;

    if (question.id && DATE_QUESTION_IDS.includes(question.id)) {
      valueSchema = z
        .string()
        .refine(
          (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
          i18n.t(
            'onboarding-old:fields.additionalQuestions.validation.dateFormat'
          )
        );
    } else if (itemType) {
      switch (itemType) {
        case 'boolean':
          valueSchema = z.enum(['true', 'false']);
          break;
        case 'string':
          if (itemEnum) {
            if (itemEnum.length > 0) {
              valueSchema = z.enum([itemEnum[0], ...itemEnum.slice(1)]);
            } else {
              valueSchema = z.string();
            }
          } else {
            valueSchema = z
              .string()
              .min(
                1,
                i18n.t(
                  'onboarding:fields.additionalQuestions.validation.required'
                )
              );
            if (itemPattern) {
              valueSchema = (valueSchema as z.ZodString).refine(
                (val) => new RegExp(itemPattern).test(val),
                i18n.t(
                  'onboarding:fields.additionalQuestions.validation.invalidFormat'
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
                'onboarding:fields.additionalQuestions.validation.required'
              )
            )
            .refine(
              (val) => /^\d+$/.test(val),
              i18n.t(
                'onboarding:fields.additionalQuestions.validation.numberFormat'
              )
            );
          break;
        default:
          valueSchema = z.string();
      }
    } else {
      console.log('Unknown question type', question);
      return;
    }

    // If the question allows multiple values, wrap it in an array
    if (question?.responseSchema?.type === 'array') {
      const childSchema = valueSchema;
      valueSchema = z.array(childSchema);

      if (!isOptional) {
        valueSchema = (valueSchema as z.ZodArray<z.ZodTypeAny>)
          .min(
            question?.responseSchema?.minItems ?? 1,
            i18n.t(
              'onboarding-old:fields.additionalQuestions.validation.required'
            )
          )
          .max(
            question?.responseSchema?.maxItems ?? 1,
            i18n.t(
              'onboarding:fields.additionalQuestions.validation.maxItems',
              { maxItems: question?.responseSchema?.maxItems }
            )
          )
          // Extract error from child schema
          .superRefine((values, context) => {
            values.forEach((value: any) => {
              const result = childSchema.safeParse(value);
              if (result.error) {
                context.addIssue(result.error.issues[0]);
              }
            });
            return true;
          });
      }
    }

    schemaFields[`question_${question.id}`] = valueSchema;
  });

  return z.object(schemaFields).superRefine((values, context) => {
    questionsData.forEach((question) => {
      if (question.parentQuestionId) {
        const parentQuestionValue =
          values?.[`question_${question.parentQuestionId}`];
        const parentQuestion = questionsData.find(
          (q) => q.id === question.parentQuestionId
        );
        if (parentQuestion?.subQuestions) {
          const subQuestion = parentQuestion.subQuestions.find((sq) =>
            sq.questionIds?.includes(question.id ?? '')
          );
          if (subQuestion) {
            if (
              (typeof subQuestion?.anyValuesMatch === 'string' &&
                parentQuestionValue.includes(subQuestion.anyValuesMatch)) ||
              (Array.isArray(subQuestion?.anyValuesMatch) &&
                parentQuestionValue.some((value: any) =>
                  subQuestion.anyValuesMatch?.includes(value)
                ))
            ) {
              if (question?.responseSchema?.type === 'array') {
                if (question?.responseSchema?.minItems) {
                  if (
                    !values?.[`question_${question.id}`] ||
                    values?.[`question_${question.id}`].length <
                      question?.responseSchema?.minItems
                  ) {
                    context.addIssue({
                      code: z.ZodIssueCode.custom,
                      message: i18n.t(
                        'onboarding:fields.additionalQuestions.validation.required'
                      ),
                      path: [`question_${question.id}`],
                    });
                  }
                }
                if (question?.responseSchema?.maxItems) {
                  if (
                    values?.[`question_${question.id}`].length >
                    question?.responseSchema?.maxItems
                  ) {
                    context.addIssue({
                      code: z.ZodIssueCode.custom,
                      message: i18n.t(
                        'onboarding:fields.additionalQuestions.validation.maxItems',
                        { maxItems: question?.responseSchema?.maxItems }
                      ),
                      path: [`question_${question.id}`],
                    });
                  }
                }
              } else if (!values?.[`question_${question.id}`]) {
                context.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: i18n.t(
                    'onboarding:fields.additionalQuestions.validation.required'
                  ),
                  path: [`question_${question.id}`],
                });
              }
            }
          }
        }
      }
    });
  });
};
