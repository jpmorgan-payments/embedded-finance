import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslationWithTokens } from '@/i18n';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftIcon, InfoIcon, Loader2Icon } from 'lucide-react';
import { useForm, useFormState } from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import {
  getSmbdoGetClientQueryKey,
  useSmbdoUpdateClientLegacy,
} from '@/api/generated/smbdo';
import { QuestionResponse } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Checkbox, Separator } from '@/components/ui';
import { FormLoadingState, StepLayout } from '@/core/OnboardingFlow/components';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useFlowUnsavedChangesSync } from '@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync';

import {
  createDynamicZodSchema,
  DATE_QUESTION_IDS,
  MONEY_INPUT_QUESTION_IDS,
} from './OperationalDetailsForm.schema';
import { useQuestionTree } from './useQuestionTree';

/**
 * Extract question ID from API error message.
 * Matches patterns like "question with ID [30002]" or similar.
 */
const extractQuestionIdFromMessage = (message: string): string | null => {
  const match = message.match(/\[(\d+)\]/);
  return match ? match[1] : null;
};

/**
 * Format API error message to be more user-friendly.
 * Extracts the actionable part from verbose server messages.
 */
const formatErrorMessage = (message: string): string => {
  // Extract the hint in brackets at the end of the message, e.g., "[Please use a 2-letter ISO country code.]"
  const hintMatch = message.match(/\[([^\]]+)\]\.?$/);
  if (hintMatch) {
    return hintMatch[1];
  }

  // If no hint found, try to simplify the message
  if (message.includes('is not supported')) {
    return 'The value entered is not supported. Please select a valid option.';
  }

  return message;
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

const uniqueQuestionsById = (
  questions: QuestionResponse[]
): QuestionResponse[] => {
  const seen = new Set<string>();
  return questions.filter((question) => {
    const id = normalizeQuestionId(question.id);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

export const OperationalDetailsForm = () => {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const queryClient = useQueryClient();
  const { clientData } = useOnboardingContext();

  const { originScreenId, goTo, updateSessionData, setIsFormSubmitting } =
    useFlowContext();

  const reviewMode = originScreenId === 'review-attest-section';

  // Get outstanding question IDs and existing question responses
  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
  const existingQuestionResponses = clientData?.questionResponses ?? [];

  // Fetch the full question tree (handles arbitrary nesting depth)
  const {
    allQuestions,
    allFormQuestionIds,
    isLoading: isQuestionsLoading,
    error: questionsFetchError,
  } = useQuestionTree({ outstandingQuestionIds, existingQuestionResponses });

  // Build default form values from existing responses
  const defaultValues = useMemo(
    () =>
      allFormQuestionIds.reduce(
        (acc, id) => {
          const existingResponse = existingQuestionResponses?.find(
            (response) => response.questionId === id
          );
          acc[`question_${id}`] = existingResponse
            ? existingResponse.values
            : [];
          return acc;
        },
        {} as Record<string, any>
      ),
    [allFormQuestionIds, existingQuestionResponses]
  );

  const queryKey = getSmbdoGetClientQueryKey(clientData?.id ?? '');

  const [hasNewQuestions, setHasNewQuestions] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const {
    mutate: updateClient,
    error: updateClientError,
    status: updateClientStatus,
  } = useSmbdoUpdateClientLegacy({
    mutation: {
      onError: () => {
        // Mutation error occurred
      },
      onSuccess: (response) => {
        queryClient.setQueryData(queryKey, response);
        setIsFormSubmitting(false);

        // Check if the response has new outstanding questions.
        // If so, stay on the page so the user can answer them.
        const newOutstandingQuestionIds =
          response?.outstanding?.questionIds ?? [];
        if (newOutstandingQuestionIds.length > 0) {
          setHasNewQuestions(true);
          // Scroll alert into view after render
          setTimeout(() => {
            alertRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }, 100);
          return;
        }

        if (reviewMode) {
          goTo('review-attest-section', {
            reviewScreenOpenedSectionId: 'additional-questions-section',
          });
        } else {
          goTo('review-attest-section');
          updateSessionData({
            mockedVerifyingSectionId: 'additional-questions-section',
          });
        }
      },
    },
  });

  const renderQuestionInput = (question: QuestionResponse) => {
    const fieldName = `question_${question.id ?? 'undefined'}`;
    const itemType = question?.responseSchema?.items?.type ?? 'string';
    const itemEnum = question?.responseSchema?.items?.enum;

    const questionLabel = (
      <div className="">
        {question.description?.split('\n')?.map((line, index) => (
          <div key={`${question.id}-label-${index}`}>
            <FormLabel
              asterisk={index === 0}
              className={cn({
                'eb-ml-4': index > 0,
              })}
            >
              {line}
            </FormLabel>
          </div>
        ))}
      </div>
    );

    // Check if the question should use a datepicker
    if (question.id && DATE_QUESTION_IDS.includes(question.id)) {
      return (
        <FormField
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              {questionLabel}
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  value={field.value?.[0] ?? ''}
                  onChange={(e) => field.onChange([e.target.value])}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    if (question.id && MONEY_INPUT_QUESTION_IDS.includes(question.id)) {
      return (
        <FormField
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              {questionLabel}
              <div className="eb-relative">
                <span className="eb-absolute eb-left-3 eb-translate-y-2 eb-text-gray-500">
                  $
                </span>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    max={10000000000}
                    step={0.01}
                    placeholder="0.00"
                    className="eb-pl-7"
                    value={field.value?.[0] ?? ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value >= 0 && value <= 10000000000) {
                        field.onChange([e.target.value]);
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value < 0) field.onChange(['0']);
                      if (value > 10000000000) field.onChange(['10000000000']);
                    }}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    switch (itemType) {
      case 'boolean':
        return (
          <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem className="eb-space-y-3">
                {questionLabel}
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange([value])}
                    value={field?.value?.[0] ?? ''}
                    className="eb-flex eb-flex-col eb-space-y-1"
                  >
                    <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                      <FormControl>
                        <RadioGroupItem value="true" />
                      </FormControl>
                      <FormLabel className="eb-font-normal">
                        {t('common:yes', 'Yes')}
                      </FormLabel>
                    </FormItem>
                    <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                      <FormControl>
                        <RadioGroupItem value="false" />
                      </FormControl>
                      <FormLabel className="eb-font-normal">
                        {t('common:no', 'No')}
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'string':
        if (itemEnum && itemEnum.length > 0) {
          if (
            question?.responseSchema?.maxItems &&
            question?.responseSchema?.maxItems > 1
          ) {
            return (
              <FormField
                control={form.control}
                name={fieldName}
                render={() => (
                  <FormItem>
                    {questionLabel}
                    {itemEnum.map((option: string) => (
                      <FormField
                        key={option}
                        control={form.control}
                        name={fieldName}
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={option}
                              className="eb-flex eb-flex-row eb-items-start eb-space-x-3 eb-space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(option)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, option])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value: string) => value !== option
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="eb-font-normal">
                                {option}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
            );
          }
          return (
            <FormField
              control={form.control}
              name={fieldName}
              render={({ field }) => (
                <FormItem>
                  {questionLabel}
                  <Select
                    onValueChange={(value) => field.onChange([value])}
                    value={field?.value?.[0] ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={tString(
                            'screens.operationalDetails.selectPlaceholder',
                            'Select an option'
                          )}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {itemEnum.map((option: string) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        }
        return (
          <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                {questionLabel}
                <FormControl>
                  <Input
                    {...field}
                    value={field.value?.[0] ?? ''}
                    onChange={(e) => field.onChange([e.target.value])}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'integer':
        return (
          <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                {questionLabel}
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={field.value?.[0] ?? ''}
                    onChange={(e) => field.onChange([e.target.value])}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      default:
        return (
          <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                {questionLabel}
                <FormControl>
                  <Input
                    {...field}
                    value={field.value?.[0] ?? ''}
                    onChange={(e) => field.onChange([e.target.value])}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };

  const dynamicSchema = useMemo(() => {
    if (!allQuestions.length) return z.object({});
    return createDynamicZodSchema(allQuestions);
  }, [allQuestions]);

  const form = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues,
    mode: 'onBlur',
  });

  const { isDirty } = useFormState({ control: form.control });
  useFlowUnsavedChangesSync(isDirty);

  /**
   * Parse API error context and set field-level errors on the form.
   * Extracts question IDs from error messages and maps them to form fields.
   * Returns the first field name with an error for focusing.
   */
  const setFieldErrorsFromApiError = useCallback(
    (error: typeof updateClientError): string | null => {
      if (!error) return null;

      const context = error.response?.data?.context;
      if (!context || !Array.isArray(context)) return null;

      let firstErrorField: string | null = null;

      context.forEach(
        (item: { code?: string; field?: string; message?: string }) => {
          if (!item.message) return;

          const questionId = extractQuestionIdFromMessage(item.message);
          if (!questionId) return;

          // Verify this question exists in our form
          const questionExists = allQuestions.some((q) => q.id === questionId);
          if (!questionExists) return;

          const fieldName = `question_${questionId}`;
          const userFriendlyMessage = formatErrorMessage(item.message);

          form.setError(fieldName, {
            type: 'server',
            message: userFriendlyMessage,
          });

          // Track the first error field for focusing
          if (!firstErrorField) {
            firstErrorField = fieldName;
          }
        }
      );

      return firstErrorField;
    },
    [form, allQuestions]
  );

  // Handle API errors by setting field-level errors and focusing the first invalid field
  useEffect(() => {
    if (updateClientError && updateClientStatus === 'error') {
      const firstErrorField = setFieldErrorsFromApiError(updateClientError);

      // Focus the first field with an error after a short delay to ensure DOM is updated
      if (firstErrorField) {
        setTimeout(() => {
          form.setFocus(firstErrorField);
        }, 100);
      }
    }
  }, [updateClientError, updateClientStatus, setFieldErrorsFromApiError, form]);

  const isQuestionVisible = (question: QuestionResponse): boolean => {
    const questionId = normalizeQuestionId(question.id);
    const parentQuestion = question.parentQuestionId
      ? allQuestions.find(
          (q) =>
            normalizeQuestionId(q.id) ===
            normalizeQuestionId(question.parentQuestionId)
        )
      : allQuestions.find((q) =>
          q.subQuestions?.some((sq) =>
            sq.questionIds?.some((id) => normalizeQuestionId(id) === questionId)
          )
        );

    // If no parent found, show the question
    if (!parentQuestion) return true;

    // For nested questions, the parent must also be visible
    if (!isQuestionVisible(parentQuestion)) return false;

    const parentResponse = form.watch(
      `question_${normalizeQuestionId(parentQuestion.id)}`
    );

    if (!parentResponse) return false;

    const subQuestion = parentQuestion?.subQuestions?.find((sq) =>
      sq.questionIds?.some((id) => normalizeQuestionId(id) === questionId)
    );

    if (subQuestion?.anyValuesMatch != null) {
      return hasAnyValuesMatch(parentResponse, subQuestion.anyValuesMatch);
    }

    return false;
  };

  const isQuestionParent = (question: QuestionResponse) => {
    if (!question.parentQuestionId) {
      const questionId = normalizeQuestionId(question.id);
      const isReferencedAsChild = allQuestions.some((q) =>
        q.subQuestions?.some((sq) =>
          sq.questionIds?.some((id) => normalizeQuestionId(id) === questionId)
        )
      );
      return !isReferencedAsChild;
    }
    // Treat as top-level if parent isn't in our question list
    const parentExists = allQuestions.some(
      (q) =>
        normalizeQuestionId(q.id) ===
        normalizeQuestionId(question.parentQuestionId)
    );
    return !parentExists;
  };

  const onSubmit = (values: any) => {
    if (clientData?.id) {
      const questionResponses = Object.entries(values)
        .filter(([key]) => {
          const questionId = key.replace('question_', '');
          const question = allQuestions.find((q) => q.id === questionId);
          // Only include visible questions in the submission
          return question ? isQuestionVisible(question) : false;
        })
        .map(([key, value]) => ({
          key,
          questionId: key.replace('question_', ''),
          values: Array.isArray(value) ? value : [value],
        }));

      const requestBody = {
        questionResponses,
      };

      updateClient({
        id: clientData.id,
        data: requestBody,
      });
    }
  };

  const renderQuestions = () => {
    if (!allQuestions.length) {
      return (
        <div className="eb-text-muted-foreground">
          {t(
            'screens.operationalDetails.noQuestions',
            'There are no additional questions. You may proceed to the next step.'
          )}
        </div>
      );
    }

    const renderSubQuestions = (
      parentId: string | undefined
    ): React.ReactNode => {
      if (!parentId) return null;
      const normalizedParentId = normalizeQuestionId(parentId);
      const parentQuestion = allQuestions.find(
        (q) => normalizeQuestionId(q.id) === normalizedParentId
      );

      const childQuestionsByParentId = allQuestions.filter(
        (q) => normalizeQuestionId(q.parentQuestionId) === normalizedParentId
      );

      const childQuestionsBySubQuestionIds =
        parentQuestion?.subQuestions
          ?.flatMap((sq) => sq.questionIds ?? [])
          .map((childId) =>
            allQuestions.find(
              (q) => normalizeQuestionId(q.id) === normalizeQuestionId(childId)
            )
          )
          .filter((q): q is QuestionResponse => !!q) ?? [];

      const childQuestions = uniqueQuestionsById([
        ...childQuestionsByParentId,
        ...childQuestionsBySubQuestionIds,
      ]);

      return childQuestions.filter(isQuestionVisible).map((subQuestion) => (
        <Fragment
          key={
            subQuestion.id ??
            `subquestion-${parentId}-${subQuestion.parentQuestionId}`
          }
        >
          <div className="eb-mb-6">{renderQuestionInput(subQuestion)}</div>
          {renderSubQuestions(subQuestion.id)}
        </Fragment>
      ));
    };

    return allQuestions
      .filter(isQuestionParent)
      .filter(isQuestionVisible)
      .map((question, index) => (
        <Fragment key={question.id ?? `question-${index}`}>
          {index !== 0 && <Separator />}
          <div className="eb-mb-6">{renderQuestionInput(question)}</div>
          {renderSubQuestions(question.id)}
        </Fragment>
      ));
  };

  useEffect(() => {
    setIsFormSubmitting(updateClientStatus === 'pending');
  }, [updateClientStatus]);

  const isFormDisabled = isQuestionsLoading || updateClientStatus === 'pending';

  if (isQuestionsLoading) {
    return (
      <FormLoadingState
        message={tString(
          'screens.operationalDetails.loadingQuestions',
          'Loading questions...'
        )}
      />
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="eb-space-y-6">
        <StepLayout
          title={tString(
            'screens.operationalDetails.title',
            'Operational details'
          )}
          subTitle={
            <Button
              type="button"
              variant="link"
              onClick={() => goTo('overview')}
              className="eb-h-auto eb-gap-1 eb-p-0 eb-text-sm"
            >
              <ArrowLeftIcon className="eb-size-3.5" />
              {t('common:overview', 'Overview')}
            </Button>
          }
          description={tString(
            'screens.operationalDetails.description',
            'Please answer these additional questions to help us understand your business operations.'
          )}
          alert={
            hasNewQuestions ? (
              <Alert ref={alertRef} variant="informative" noTitle>
                <InfoIcon className="eb-h-4 eb-w-4" />
                <AlertDescription>
                  {t(
                    'screens.operationalDetails.newQuestionsGenerated',
                    'Based on your responses, a few additional questions are needed. Please complete them to continue.'
                  )}
                </AlertDescription>
              </Alert>
            ) : undefined
          }
        >
          <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
            {renderQuestions()}

            <ServerErrorAlert
              error={questionsFetchError || updateClientError}
            />
            <Button
              type="submit"
              size="lg"
              className="eb-w-full eb-text-lg"
              disabled={isFormDisabled}
            >
              {updateClientStatus === 'pending' && (
                <Loader2Icon className="eb-animate-spin" />
              )}
              {reviewMode
                ? t(
                    'screens.operationalDetails.saveAndReturn',
                    'Save and return to review'
                  )
                : t(
                    'screens.operationalDetails.saveAndContinue',
                    'Save and continue to review'
                  )}
            </Button>
          </div>
        </StepLayout>
      </form>
    </Form>
  );
};
