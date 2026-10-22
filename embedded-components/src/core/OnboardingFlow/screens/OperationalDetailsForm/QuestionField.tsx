import { Fragment, type ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { DollarSignIcon } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { QuestionResponse } from '@/api/generated/smbdo.schemas';
import {
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox, Separator } from '@/components/ui';
import {
  isQuestionVisible as computeQuestionVisibility,
  getChildQuestions,
  isTopLevelQuestion,
} from '@/core/OnboardingFlow/utils/questionTree';

import {
  DATE_QUESTION_IDS,
  MONEY_INPUT_QUESTION_IDS,
} from './OperationalDetailsForm.schema';
import { getQuestionFieldName } from './questionForm';

type QuestionFieldProps = {
  question: QuestionResponse;
  /** Render free-text string questions as a multi-line textarea. */
  multilineText?: boolean;
};

const QuestionLabel = ({ question }: { question: QuestionResponse }) => (
  <div className="">
    {question.description?.split('\n')?.map((line, index) => (
      <div key={`${question.id}-label-${index}`}>
        <FormLabel
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

const DateQuestionField = ({ question }: QuestionFieldProps) => {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={getQuestionFieldName(question.id)}
      render={({ field }) => (
        <FormItem>
          <QuestionLabel question={question} />
          <FormControl>
            <Input
              {...field}
              type="date"
              className="eb-w-fit"
              value={field.value?.[0] ?? ''}
              onChange={(e) => field.onChange([e.target.value])}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const MoneyQuestionField = ({ question }: QuestionFieldProps) => {
  const { control } = useFormContext();
  return (
    <FormField
      control={control}
      name={getQuestionFieldName(question.id)}
      render={({ field }) => (
        <FormItem>
          <QuestionLabel question={question} />
          <div className="eb-relative">
            <DollarSignIcon
              aria-hidden="true"
              className="eb-pointer-events-none eb-absolute eb-inset-y-0 eb-left-3 eb-my-auto eb-size-4 eb-text-gray-500"
            />
            <FormControl>
              <Input
                {...field}
                type="number"
                min={0}
                max={10000000000}
                step={1}
                inputMode="decimal"
                placeholder="0"
                className="eb-pl-9"
                value={field.value?.[0] ?? ''}
                onChange={(e) => {
                  // Let the user type freely — including a decimal — so the
                  // whole-number validation can explain why cents aren't
                  // accepted, rather than silently swallowing keystrokes.
                  // Only guard the overall range here.
                  const raw = e.target.value;
                  const numeric = parseFloat(raw);
                  if (raw === '' || (numeric >= 0 && numeric <= 10000000000)) {
                    field.onChange([raw]);
                  }
                }}
                onBlur={field.onBlur}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

const BooleanQuestionField = ({ question }: QuestionFieldProps) => {
  const { control } = useFormContext();
  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);
  return (
    <FormField
      control={control}
      name={getQuestionFieldName(question.id)}
      render={({ field }) => (
        <FormItem className="eb-space-y-3">
          <QuestionLabel question={question} />
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
};

const MultiSelectQuestionField = ({
  question,
  options,
}: QuestionFieldProps & { options: string[] }) => {
  const { control } = useFormContext();
  const fieldName = getQuestionFieldName(question.id);
  return (
    <FormField
      control={control}
      name={fieldName}
      render={() => (
        <FormItem>
          <QuestionLabel question={question} />
          {options.map((option) => (
            <FormField
              key={option}
              control={control}
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
                          const currentValues = Array.isArray(field.value)
                            ? field.value
                            : [];
                          return checked
                            ? field.onChange([...currentValues, option])
                            : field.onChange(
                                currentValues.filter(
                                  (value: string) => value !== option
                                )
                              );
                        }}
                      />
                    </FormControl>
                    <FormLabel className="eb-font-normal">{option}</FormLabel>
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
};

const SingleSelectQuestionField = ({
  question,
  options,
}: QuestionFieldProps & { options: string[] }) => {
  const { control } = useFormContext();
  const { tString } = useTranslationWithTokens(['onboarding-overview']);
  return (
    <FormField
      control={control}
      name={getQuestionFieldName(question.id)}
      render={({ field }) => (
        <FormItem>
          <QuestionLabel question={question} />
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
              {options.map((option) => (
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
};

const TextQuestionField = ({
  question,
  multilineText,
  inputType,
}: QuestionFieldProps & { inputType?: 'number' }) => {
  const { control } = useFormContext();
  const maxLength = question.responseSchema?.items?.maxLength;
  return (
    <FormField
      control={control}
      name={getQuestionFieldName(question.id)}
      render={({ field }) => (
        <FormItem>
          <QuestionLabel question={question} />
          <FormControl>
            {multilineText ? (
              <Textarea
                {...field}
                maxLength={maxLength}
                value={field.value?.[0] ?? ''}
                onChange={(e) => field.onChange([e.target.value])}
              />
            ) : (
              <Input
                type={inputType}
                {...field}
                value={field.value?.[0] ?? ''}
                onChange={(e) => field.onChange([e.target.value])}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

/**
 * Renders the input for a single client question based on its
 * `responseSchema` (date, money, yes/no, single/multi select, number or text).
 * Must be rendered inside a react-hook-form `<Form>` provider.
 */
export const QuestionField = ({
  question,
  multilineText,
}: QuestionFieldProps) => {
  const itemType = question?.responseSchema?.items?.type ?? 'string';
  const itemEnum = question?.responseSchema?.items?.enum;

  if (question.id && DATE_QUESTION_IDS.includes(question.id)) {
    return <DateQuestionField question={question} />;
  }

  if (question.id && MONEY_INPUT_QUESTION_IDS.includes(question.id)) {
    return <MoneyQuestionField question={question} />;
  }

  switch (itemType) {
    case 'boolean':
      return <BooleanQuestionField question={question} />;
    case 'string':
      if (itemEnum && itemEnum.length > 0) {
        const maxItems = question?.responseSchema?.maxItems;
        return maxItems && maxItems > 1 ? (
          <MultiSelectQuestionField question={question} options={itemEnum} />
        ) : (
          <SingleSelectQuestionField question={question} options={itemEnum} />
        );
      }
      return (
        <TextQuestionField question={question} multilineText={multilineText} />
      );
    case 'integer':
      return <TextQuestionField question={question} inputType="number" />;
    default:
      return <TextQuestionField question={question} />;
  }
};

type QuestionListProps = {
  /** Every loaded question (all nesting levels). */
  questions: QuestionResponse[];
  multilineText?: boolean;
};

/**
 * Renders a question tree: top-level questions separated by dividers, each
 * followed by its visible conditional sub-questions (driven by live answers).
 */
export const QuestionList = ({
  questions,
  multilineText,
}: QuestionListProps) => {
  const { watch } = useFormContext();

  const getResponseValues = (questionId: string) =>
    watch(getQuestionFieldName(questionId));

  const isVisible = (question: QuestionResponse): boolean =>
    computeQuestionVisibility(question, questions, getResponseValues);

  const renderSubQuestions = (parentId: string | undefined): ReactNode => {
    if (!parentId) return null;

    // Only render questions whose single effective parent is this parent, so
    // each question appears exactly once regardless of whether the
    // relationship is expressed via parentQuestionId or subQuestions.
    return getChildQuestions(parentId, questions)
      .filter(isVisible)
      .map((subQuestion) => (
        <Fragment
          key={
            subQuestion.id ??
            `subquestion-${parentId}-${subQuestion.parentQuestionId}`
          }
        >
          <div className="eb-mb-6">
            <QuestionField
              question={subQuestion}
              multilineText={multilineText}
            />
          </div>
          {renderSubQuestions(subQuestion.id)}
        </Fragment>
      ));
  };

  return (
    <>
      {questions
        .filter((question) => isTopLevelQuestion(question, questions))
        .filter(isVisible)
        .map((question, index) => (
          <Fragment key={question.id ?? `question-${index}`}>
            {index !== 0 && <Separator />}
            <div className="eb-mb-6">
              <QuestionField
                question={question}
                multilineText={multilineText}
              />
            </div>
            {renderSubQuestions(question.id)}
          </Fragment>
        ))}
    </>
  );
};
