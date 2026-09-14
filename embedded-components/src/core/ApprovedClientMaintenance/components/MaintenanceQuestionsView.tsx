import { useEffect, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { Loader2Icon } from 'lucide-react';

import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import {
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

import type {
  MaintenanceQuestion,
  MaintenanceQuestionResponse,
} from '../models/maintenanceApi.types';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceSection } from './MaintenanceSection';

type MaintenanceQuestionsViewProps = {
  questions: MaintenanceQuestion[];
  breadcrumbs: MaintenanceBreadcrumbItem[];
  isLoading: boolean;
  isSubmitting: boolean;
  error?: unknown;
  onBack: () => void;
  onSubmit: (responses: MaintenanceQuestionResponse[]) => Promise<void>;
};

export function MaintenanceQuestionsView({
  questions,
  breadcrumbs,
  isLoading,
  isSubmitting,
  error,
  onBack,
  onSubmit,
}: MaintenanceQuestionsViewProps) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const responses = questions.flatMap((question) => {
    const value = question.id ? values[question.id]?.trim() : undefined;
    return question.id && value
      ? [{ questionId: question.id, values: [value] }]
      : [];
  });
  const isComplete =
    questions.length > 0 && responses.length === questions.length;
  const progress =
    questions.length > 0 ? (responses.length / questions.length) * 100 : 0;

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="eb-text-lg eb-font-semibold focus:eb-outline-none"
        >
          {t('questions.title')}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {t('questions.description')}
        </p>
      </header>
      <MaintenanceSection
        id="maintenance-questions-heading"
        title={t('questions.sectionTitle')}
        caption={t('sectionCaption.requirements')}
        tone="warning"
        footer={
          <div className="eb-flex eb-flex-wrap eb-justify-between eb-gap-2">
            <Button variant="outlineSurface" size="sm" onClick={onBack}>
              {t('questions.cancel')}
            </Button>
            <Button
              size="sm"
              disabled={!isComplete || isSubmitting}
              onClick={() => onSubmit(responses)}
            >
              {isSubmitting ? (
                <Loader2Icon className="eb-animate-spin" />
              ) : null}
              {t('questions.save')}
            </Button>
          </div>
        }
      >
        {error ? (
          <div className="eb-p-4">
            <ServerErrorAlert error={error as never} />
          </div>
        ) : isLoading ? (
          <p className="eb-p-4 eb-text-sm eb-text-muted-foreground">
            {t('questions.loading')}
          </p>
        ) : questions.length === 0 ? (
          <div className="eb-p-4">
            <p className="eb-text-sm eb-font-medium">
              {t('questions.emptyTitle')}
            </p>
            <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
              {t('questions.emptyDescription')}
            </p>
          </div>
        ) : (
          <div>
            <div className="eb-border-b eb-bg-muted/20 eb-px-4 eb-py-3">
              <div className="eb-flex eb-items-center eb-justify-between eb-gap-3 eb-text-xs">
                <span className="eb-font-medium">
                  {t('questions.progress', {
                    answered: responses.length,
                    total: questions.length,
                  })}
                </span>
                <span className="eb-text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={questions.length}
                aria-valuenow={responses.length}
                className="eb-mt-2 eb-h-1.5 eb-overflow-hidden eb-rounded-full eb-bg-muted"
              >
                <div
                  className="eb-h-full eb-rounded-full eb-bg-primary eb-transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="eb-space-y-4 eb-p-4">
              {questions.map((question) => {
                if (!question.id) return null;
                const labelId = `question-${question.id}-label`;
                return (
                  <div
                    key={question.id}
                    className="eb-space-y-3 eb-rounded-md eb-border eb-p-4"
                  >
                    <Label
                      id={labelId}
                      htmlFor={`question-${question.id}`}
                      className="eb-text-sm eb-font-semibold eb-leading-5"
                    >
                      {question.label}
                    </Label>
                    {question.description ? (
                      <p className="eb-text-xs eb-text-muted-foreground">
                        {question.description}
                      </p>
                    ) : null}
                    {question.options?.length ? (
                      <Select
                        value={values[question.id] ?? ''}
                        onValueChange={(value) =>
                          setValues((current) => ({
                            ...current,
                            [question.id!]: value,
                          }))
                        }
                      >
                        <SelectTrigger
                          id={`question-${question.id}`}
                          aria-labelledby={labelId}
                        >
                          <SelectValue
                            placeholder={tString('questions.select')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {question.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : question.responseType === 'boolean' ? (
                      <RadioGroup
                        aria-labelledby={labelId}
                        value={values[question.id] ?? ''}
                        onValueChange={(value) =>
                          setValues((current) => ({
                            ...current,
                            [question.id!]: value,
                          }))
                        }
                        className="eb-grid eb-gap-2 @[40rem]:eb-grid-cols-2"
                      >
                        {[
                          ['true', t('questions.yes')],
                          ['false', t('questions.no')],
                        ].map(([value, label]) => (
                          <label
                            key={value as string}
                            className="eb-flex eb-cursor-pointer eb-items-center eb-gap-2 eb-rounded-md eb-border eb-p-3 has-[[data-state=checked]]:eb-border-primary has-[[data-state=checked]]:eb-bg-accent/40"
                          >
                            <RadioGroupItem value={value as string} />
                            {label}
                          </label>
                        ))}
                      </RadioGroup>
                    ) : (
                      <Input
                        id={`question-${question.id}`}
                        type={
                          question.responseType === 'number' ||
                          question.responseType === 'integer'
                            ? 'number'
                            : 'text'
                        }
                        value={values[question.id] ?? ''}
                        onChange={(event) =>
                          setValues((current) => ({
                            ...current,
                            [question.id!]: event.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </MaintenanceSection>
    </div>
  );
}
