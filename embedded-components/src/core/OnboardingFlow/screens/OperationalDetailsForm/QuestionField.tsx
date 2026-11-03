import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  CheckIcon,
  ChevronsUpDownIcon,
  DollarSignIcon,
  XIcon,
} from 'lucide-react';
import {
  useFormContext,
  useWatch,
  type ControllerRenderProps,
} from 'react-hook-form';

import { cn } from '@/lib/utils';
import { QuestionResponse } from '@/api/generated/smbdo.schemas';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button, Checkbox, Separator } from '@/components/ui';
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

/** Beyond this many options (the API sends 237 countries), a question gets a searchable list. */
export const SEARCHABLE_OPTIONS_THRESHOLD = 10;

// Fuzzy matching turns "Cana" into a dozen countries; match the typed text, best at the start.
const filterOptions = (value: string, search: string) => {
  const option = value.toLowerCase();
  const query = search.trim().toLowerCase();
  if (option.startsWith(query)) return 1;
  return option.includes(query) ? 0.5 : 0;
};

// A choice has no blur of its own, so mark it touched as it's made: it then
// validates, and counts as answered, the way a typed answer does on blur.
const choose = (field: ControllerRenderProps, values: string[]) => {
  field.onChange(values);
  field.onBlur();
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
              onValueChange={(value) => choose(field, [value])}
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
                            ? choose(field, [...currentValues, option])
                            : choose(
                                field,
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
            onValueChange={(value) => choose(field, [value])}
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

const SearchableOptionsQuestionField = ({
  question,
  options,
  maxItems,
}: QuestionFieldProps & { options: string[]; maxItems: number }) => {
  const { control } = useFormContext();
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const [open, setOpen] = useState(false);
  const isMultiple = maxItems > 1;

  return (
    <FormField
      control={control}
      name={getQuestionFieldName(question.id)}
      render={({ field }) => {
        const selected: string[] = Array.isArray(field.value)
          ? field.value.filter(Boolean)
          : [];
        const isAtLimit = isMultiple && selected.length >= maxItems;
        const select = (option: string) => {
          if (!isMultiple) {
            choose(field, [option]);
            setOpen(false);
            return;
          }
          choose(
            field,
            selected.includes(option)
              ? selected.filter((value) => value !== option)
              : [...selected, option]
          );
        };
        const placeholder = tString(
          isMultiple
            ? 'screens.operationalDetails.selectMultiplePlaceholder'
            : 'screens.operationalDetails.selectPlaceholder'
        );

        return (
          <FormItem>
            <QuestionLabel question={question} />
            <Popover
              open={open}
              onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                if (!nextOpen) field.onBlur();
              }}
            >
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="input"
                    size="input"
                    role="combobox"
                    aria-expanded={open}
                    className="eb-w-full eb-justify-between eb-font-normal"
                  >
                    <span
                      className={cn(
                        'eb-truncate',
                        selected.length === 0 && 'eb-text-muted-foreground'
                      )}
                    >
                      {selected.length === 0
                        ? placeholder
                        : isMultiple
                          ? t('screens.operationalDetails.selectedCount', {
                              count: selected.length,
                            })
                          : selected[0]}
                    </span>
                    <ChevronsUpDownIcon className="eb-ml-2 eb-size-4 eb-shrink-0 eb-opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="eb-w-[--radix-popover-trigger-width] eb-p-0"
              >
                <Command filter={filterOptions}>
                  <CommandInput
                    placeholder={tString(
                      'screens.operationalDetails.searchOptions'
                    )}
                  />
                  <CommandList>
                    <CommandEmpty>{t('common:noOptionFound')}</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => {
                        const isSelected = selected.includes(option);
                        return (
                          <CommandItem
                            key={option}
                            value={option}
                            disabled={isAtLimit && !isSelected}
                            onSelect={() => select(option)}
                            className="eb-cursor-pointer"
                          >
                            <CheckIcon
                              aria-hidden="true"
                              className={cn(
                                'eb-mr-2 eb-size-4 eb-shrink-0',
                                isSelected ? 'eb-opacity-100' : 'eb-opacity-0'
                              )}
                            />
                            {option}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {isMultiple && selected.length > 0 ? (
              <ul
                data-selected-options=""
                className="eb-flex eb-flex-wrap eb-gap-1.5"
              >
                {selected.map((option) => (
                  <li key={option}>
                    <Badge
                      variant="outline"
                      className="eb-gap-1 eb-py-0.5 eb-pl-2.5 eb-pr-1 eb-text-sm eb-font-normal"
                    >
                      {option}
                      <button
                        type="button"
                        aria-label={tString(
                          'screens.operationalDetails.removeOption',
                          { option }
                        )}
                        className="eb-rounded-full eb-p-0.5 eb-text-muted-foreground hover:eb-bg-muted hover:eb-text-foreground focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring"
                        onClick={() =>
                          choose(
                            field,
                            selected.filter((value) => value !== option)
                          )
                        }
                      >
                        <XIcon aria-hidden="true" className="eb-size-3.5" />
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
            {isAtLimit && maxItems < options.length ? (
              <p className="eb-text-xs eb-text-muted-foreground">
                {t('screens.operationalDetails.maxSelected', {
                  count: maxItems,
                })}
              </p>
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
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
        const maxItems = question?.responseSchema?.maxItems ?? 1;
        if (itemEnum.length > SEARCHABLE_OPTIONS_THRESHOLD) {
          return (
            <SearchableOptionsQuestionField
              question={question}
              options={itemEnum}
              maxItems={maxItems}
            />
          );
        }
        return maxItems > 1 ? (
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
  /** Narrows the top-level questions shown; each keeps its visible sub-questions. */
  filterTopLevel?: (question: QuestionResponse) => boolean;
};

/**
 * Renders a question tree: top-level questions separated by dividers, each
 * followed by its visible conditional sub-questions (driven by live answers).
 */
export const QuestionList = ({
  questions,
  multilineText,
  filterTopLevel = () => true,
}: QuestionListProps) => {
  const { control } = useFormContext();
  const fieldNames = useMemo(
    () => questions.map((question) => getQuestionFieldName(question.id)),
    [questions]
  );
  // Only the answers re-render the list, not typing elsewhere in a shared form.
  const answers: unknown[] = useWatch({ control, name: fieldNames });

  const getResponseValues = (questionId: string) =>
    answers[fieldNames.indexOf(getQuestionFieldName(questionId))];

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
        .filter(filterTopLevel)
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
