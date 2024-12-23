import { useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  useSmbdoGetClient,
  useSmbdoListQuestions,
  useSmbdoUpdateClient,
} from '@/api/generated/smbdo';
import {
  QuestionResponse,
  UpdateClientRequestSmbdo,
} from '@/api/generated/smbdo.schemas';
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
import { useStepper } from '@/components/ui/stepper';
import { Checkbox, Separator } from '@/components/ui';

import { FormActions } from '../FormActions/FormActions';
import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';

// Define question IDs that should use a datepicker
const DATE_QUESTION_IDS = ['30071', '30073']; // Add more IDs as needed

const createDynamicZodSchema = (questionsData: QuestionResponse[]) => {
  const schemaFields: Record<string, z.ZodTypeAny> = {};

  questionsData.forEach((question) => {
    const itemType = question?.responseSchema?.items?.type ?? 'string';
    // @ts-expect-error
    const itemEnum = question?.responseSchema?.items?.enum;
    const itemPattern = question?.responseSchema?.items?.pattern;
    const isOptional = !!question.parentQuestionId;

    let valueSchema: z.ZodTypeAny;

    if (question.id && DATE_QUESTION_IDS.includes(question.id)) {
      valueSchema = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format');
    } else if (itemType) {
      switch (itemType) {
        case 'boolean':
          valueSchema = z.enum(['true', 'false']);
          break;
        case 'string':
          if (itemEnum) {
            valueSchema = z.enum(itemEnum);
          } else {
            valueSchema = z.string().min(1, 'Required');
            if (itemPattern) {
              valueSchema = (valueSchema as z.ZodString).regex(
                new RegExp(itemPattern),
                'Invalid format'
              );
            }
          }
          break;
        case 'integer':
          valueSchema = z
            .string()
            .min(1, 'Required')
            .regex(/^\d+$/, 'Must be a number');
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
          .min(question?.responseSchema?.minItems ?? 1, 'Required')
          .max(
            question?.responseSchema?.maxItems ?? 1,
            `Cannot exceed ${question?.responseSchema?.maxItems} items`
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
                      message: 'Required',
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
                      message: `Cannot exceed ${question?.responseSchema?.maxItems} items`,
                      path: [`question_${question.id}`],
                    });
                  }
                }
              } else if (!values?.[`question_${question.id}`]) {
                context.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: 'Required',
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

export const AdditionalQuestionsStepForm = () => {
  const { nextStep } = useStepper();
  const { clientId } = useOnboardingContext();

  // Fetch client data to get outstanding question IDs
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');

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
  const { data: questionsData } = useSmbdoListQuestions({
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

  const {
    mutate: updateClient,
    error: updateClientError,
    status: updateClientStatus,
  } = useSmbdoUpdateClient({
    mutation: {
      onSuccess: () => {
        toast.success('Additional questions submitted successfully');
        nextStep();
      },
      onError: () => {
        toast.error('Failed to submit additional questions');
      },
    },
  });

  const renderQuestionInput = (question: QuestionResponse) => {
    const fieldName = `question_${question.id ?? 'undefined'}`;
    const itemType = question?.responseSchema?.items?.type ?? 'string';
    // @ts-expect-error
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const dynamicSchema = useMemo(() => {
    const visibleQuestions: QuestionResponse[] = questionsData?.questions ?? [];
    if (!visibleQuestions) return z.object({});
    return createDynamicZodSchema(visibleQuestions);
  }, [questionsData]);

  const form = useForm({
    mode: 'onBlur',
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
    if (clientId) {
      const questionResponses = Object.entries(values).map(([key, value]) => ({
        questionId: key.replace('question_', ''),
        values: Array.isArray(value) ? value : [value],
      }));

      const requestBody = {
        questionResponses,
      } as UpdateClientRequestSmbdo;

      updateClient({
        id: clientId,
        data: requestBody,
      });
    }
  };

  const renderQuestions = () => {
    if (!questionsData) return null;

    return questionsData?.questions?.map((question, index) => {
      if (!isQuestionVisible(question)) {
        return null;
      }

      return (
        <>
          {isQuestionParent(question) && index !== 0 && <Separator />}
          <div key={question.id} className="eb-mb-6">
            {renderQuestionInput(question)}
          </div>
        </>
      );
    });
  };

  if (updateClientStatus === 'pending') {
    return <FormLoadingState message="Submitting additional questions..." />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="eb-space-y-6">
        <h2 className="eb-text-2xl eb-font-bold">Additional Questions</h2>

        {renderQuestions()}

        <ServerErrorAlert error={updateClientError} />
        <FormActions />
      </form>
    </Form>
  );
};

export default AdditionalQuestionsStepForm;
