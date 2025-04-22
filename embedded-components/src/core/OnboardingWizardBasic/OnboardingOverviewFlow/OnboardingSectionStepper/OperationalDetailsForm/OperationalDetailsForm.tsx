import { Fragment, useMemo } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoListQuestions,
  useSmbdoUpdateClient,
} from '@/api/generated/smbdo';
import { QuestionResponse } from '@/api/generated/smbdo.schemas';
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
import { Button, Checkbox, Separator } from '@/components/ui';
import { FormLoadingState } from '@/core/OnboardingWizardBasic/FormLoadingState/FormLoadingState';
import { ServerErrorAlert } from '@/core/OnboardingWizardBasic/ServerErrorAlert/ServerErrorAlert';

import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { GlobalStepper } from '../../OnboardingGlobalStepper';
import { StepLayout } from '../../StepLayout/StepLayout';
import {
  createDynamicZodSchema,
  DATE_QUESTION_IDS,
  MONEY_INPUT_QUESTION_IDS,
} from './OperationalDetailsForm.schema';

export const OperationalDetailsForm = () => {
  const queryClient = useQueryClient();
  const { clientData } = useOnboardingOverviewContext();
  const globalStepper = GlobalStepper.useStepper();

  // Get outstanding question IDs and existing question responses
  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
  const existingQuestionResponses = clientData?.questionResponses ?? [];

  // Merge outstanding and existing question IDs
  const allQuestionIds = useMemo(() => {
    const existingIds = existingQuestionResponses.map(
      (response) => response.questionId ?? 'undefined'
    );
    return [...new Set([...outstandingQuestionIds, ...existingIds])];
  }, [outstandingQuestionIds, existingQuestionResponses]);

  // Fetch all questions
  const {
    data: questionsData,
    status: questionsFetchStatus,
    error: questionsFetchError,
  } = useSmbdoListQuestions({
    questionIds: allQuestionIds.join(','),
  });

  // Prepare default values for the form
  const defaultValues = useMemo(
    () =>
      allQuestionIds.reduce(
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
    [allQuestionIds, existingQuestionResponses]
  );

  const queryKey = getSmbdoGetClientQueryKey(clientData?.id ?? '');

  const {
    mutate: updateClient,
    error: updateClientError,
    status: updateClientStatus,
  } = useSmbdoUpdateClient({
    mutation: {
      onMutate: async (newData) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({
          queryKey,
        });

        // Snapshot the previous value
        const previousClientData = queryClient.getQueryData([
          'client',
          clientData?.id,
        ]);

        // Optimistically update to the new value
        queryClient.setQueryData(queryKey, (old: any) => ({
          ...old,
          outstanding: {
            ...old?.outstanding,
            questionIds:
              old?.outstanding?.questionIds?.filter(
                (id: string) =>
                  !(newData.data.questionResponses ?? []).some(
                    (response: any) => response.questionId === id
                  )
              ) ?? [],
          },
          questionResponses: [
            ...(old?.questionResponses ?? []),
            ...(newData.data.questionResponses ?? []),
          ],
        }));

        // Return a context object with the snapshotted value
        return { previousClientData };
      },
      onError: (err, newData, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        queryClient.setQueryData(queryKey, context?.previousClientData);
      },
      onSuccess: () => {
        globalStepper.setMetadata('overview', {
          ...globalStepper.getMetadata('overview'),
          justCompletedSection: 'operational',
        });
        globalStepper.goTo('overview');
      },
    },
  });

  const renderQuestionInput = (question: QuestionResponse) => {
    const fieldName = `question_${question.id ?? 'undefined'}`;
    const itemType = question?.responseSchema?.items?.type ?? 'string';
    const itemEnum = question?.responseSchema?.items?.enum;

    // Check if the question should use a datepicker
    if (question.id && DATE_QUESTION_IDS.includes(question.id)) {
      return (
        <FormField
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              <FormLabel asterisk>{question.description}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
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
              <FormLabel asterisk>{question.description}</FormLabel>
              <FormControl>
                <div className="eb-relative">
                  <span className="eb-absolute eb-left-3 eb-translate-y-2 eb-text-gray-500">
                    $
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={10000000000}
                    step={0.01}
                    placeholder="0.00"
                    className="eb-pl-7"
                    {...field}
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
                </div>
              </FormControl>
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
                <FormLabel asterisk>{question.description}</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange([value])}
                    defaultValue={field?.value?.[0]}
                    className="eb-flex eb-flex-col eb-space-y-1"
                  >
                    <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                      <FormControl>
                        <RadioGroupItem value="true" />
                      </FormControl>
                      <FormLabel className="eb-font-normal">Yes</FormLabel>
                    </FormItem>
                    <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                      <FormControl>
                        <RadioGroupItem value="false" />
                      </FormControl>
                      <FormLabel className="eb-font-normal">No</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );

      case 'string':
        if (itemEnum) {
          if (
            question?.responseSchema?.maxItems &&
            question?.responseSchema?.maxItems > 0
          ) {
            return (
              <FormField
                control={form.control}
                name={fieldName}
                render={() => (
                  <FormItem>
                    <FormLabel asterisk>{question.description}</FormLabel>
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
                  <FormLabel asterisk>{question.description}</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange([value])}
                    defaultValue={field?.value?.[0]}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an option" />
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
                <FormLabel asterisk>{question.description}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
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
                <FormLabel asterisk>{question.description}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
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
                <FormLabel asterisk>{question.description}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
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
    const visibleQuestions: QuestionResponse[] = questionsData?.questions ?? [];
    if (!visibleQuestions) return z.object({});
    return createDynamicZodSchema(visibleQuestions);
  }, [questionsData]);

  const form = useForm({
    resolver: zodResolver(dynamicSchema),
    defaultValues,
  });

  const isQuestionVisible = (question: QuestionResponse) => {
    if (!question.parentQuestionId) return true;

    const parentQuestion = questionsData?.questions?.find(
      (q) => q.id === question.parentQuestionId
    );
    if (!parentQuestion) return false;

    const parentResponse = form.watch(`question_${parentQuestion.id}`);

    if (!parentResponse) return false;

    const subQuestion = parentQuestion?.subQuestions?.find((sq) =>
      sq.questionIds?.includes(question.id ?? '')
    );

    if (typeof subQuestion?.anyValuesMatch === 'string') {
      return parentResponse.includes(subQuestion.anyValuesMatch);
    }

    if (Array.isArray(subQuestion?.anyValuesMatch)) {
      return parentResponse.some((value: any) => {
        return subQuestion.anyValuesMatch?.includes(value);
      });
    }

    return false;
  };

  const isQuestionParent = (question: QuestionResponse) => {
    return !question.parentQuestionId;
  };

  const onSubmit = (values: any) => {
    if (clientData?.id) {
      const questionResponses = Object.entries(values).map(([key, value]) => ({
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
    if (!questionsData) {
      return (
        <div className="eb-text-muted-foreground">
          There are no additional questions. You may proceed to the next step.
        </div>
      );
    }

    return questionsData?.questions
      ?.filter(isQuestionParent)
      .filter(isQuestionVisible)
      .map((question, index) => (
        <Fragment key={question.id}>
          {index !== 0 && <Separator />}
          <div className="eb-mb-6">{renderQuestionInput(question)}</div>
          {questionsData?.questions
            ?.filter((q) => q.parentQuestionId === question.id)
            .filter(isQuestionVisible)
            .map((subQuestion) => (
              <div key={subQuestion.id} className="eb-mb-6">
                {renderQuestionInput(subQuestion)}
              </div>
            ))}
        </Fragment>
      ));
  };

  const isFormDisabled =
    questionsFetchStatus === 'pending' || updateClientStatus === 'pending';

  if (questionsFetchStatus === 'pending') {
    return <FormLoadingState message="Loading questions..." />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="eb-space-y-6">
        <StepLayout
          title="Operational details"
          description="Please answer these additional questions to help us understand your business operations."
        >
          <div className="eb-mt-6 eb-flex-auto">
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
              Save and return to overview
            </Button>
          </div>
        </StepLayout>
      </form>
    </Form>
  );
};
