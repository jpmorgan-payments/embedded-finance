import { type ElementType } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertTriangleIcon, PencilIcon, TriangleAlertIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PartyResponse } from '@/api/generated/smbdo.schemas';
import { AlertTitle } from '@/components/ui/alert';
import { Alert, Button, Card } from '@/components/ui';
import { partyFieldMap } from '@/core/OnboardingFlow/config/fieldMap';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useStableStepSchemas } from '@/core/OnboardingFlow/hooks/useStableStepSchemas';
import { StepConfig } from '@/core/OnboardingFlow/types/flow.types';
import { OnboardingFormValuesInitial } from '@/core/OnboardingFlow/types/form.types';
import { getOrganizationParty } from '@/core/OnboardingFlow/utils/dataUtils';
import { getStepperValidation } from '@/core/OnboardingFlow/utils/flowUtils';
import {
  convertPartyResponseToFormValues,
  useFormUtilsWithClientContext,
} from '@/core/OnboardingFlow/utils/formUtils';

type StepsReviewCardsProps = {
  steps: StepConfig[];
  partyData: PartyResponse | undefined;
  onEditClick: (stepId: string) => void;
  /**
   * - `'card'` (default) — each step is a bordered card.
   * - `'plain'` — borderless blocks separated by dividers, so the steps sit
   *   flush inside a parent container (e.g. a review section card).
   */
  variant?: 'card' | 'plain';
  /**
   * `'plain'` only: when true, the first step keeps its top divider + padding
   * because sibling content (e.g. the business-type block) renders above it.
   */
  hasPrecedingContent?: boolean;
};

export const StepsReviewCards: React.FC<StepsReviewCardsProps> = ({
  steps,
  partyData,
  onEditClick,
  variant = 'card',
  hasPrecedingContent = false,
}) => {
  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);

  const { clientData } = useOnboardingContext();
  const { currentScreenId, savedFormValues } = useFlowContext();

  // Stable, unfiltered step schemas so getStepperValidation runs pure safeParse.
  const stableStepSchemas = useStableStepSchemas();

  const orgParty = getOrganizationParty(clientData);
  const visibleSteps = steps.filter(
    (step) =>
      step.stepType !== 'check-answers' &&
      (step.isVisible?.({ orgParty }) ?? true)
  );

  const formValues = {
    ...convertPartyResponseToFormValues(partyData ?? {}),
    ...savedFormValues,
  };
  const { stepValidationMap } = getStepperValidation(
    steps,
    partyData,
    clientData,
    savedFormValues,
    currentScreenId,
    stableStepSchemas
  );

  const { modifySchema, getFieldRule } = useFormUtilsWithClientContext(
    clientData,
    currentScreenId
  );

  const StepWrapper: ElementType = variant === 'plain' ? 'div' : Card;

  return (
    <div
      className={variant === 'card' ? 'eb-space-y-4' : undefined}
      key={partyData?.id}
    >
      {visibleSteps.map((step) => {
        const { isValid, result } = stepValidationMap[step.id];

        let schemaKeys: string[] = [];
        if (step.stepType === 'form') {
          const modifiedSchema = modifySchema(
            typeof step.Component.schema === 'function'
              ? step.Component.schema()
              : step.Component.schema
          );
          schemaKeys = Object.keys(
            'shape' in modifiedSchema
              ? modifiedSchema.shape
              : 'innerType' in modifiedSchema
                ? modifiedSchema.innerType().shape
                : {}
          );
        }

        // Skip cards where every field is hidden in review
        const visibleKeys = schemaKeys.filter((key) => {
          const field = key as keyof OnboardingFormValuesInitial;
          const value = formValues?.[field];
          const fc = partyFieldMap?.[field] as {
            isHiddenInReviewFn?: (val: any, values: any) => boolean;
          } & Record<string, any>;
          return !fc?.isHiddenInReviewFn?.(value, formValues);
        });
        if (schemaKeys.length > 0 && visibleKeys.length === 0) {
          return null;
        }

        return (
          <StepWrapper
            key={step.id}
            className={cn(
              'eb-grid eb-gap-y-3',
              variant === 'plain'
                ? cn(
                    'eb-border-t eb-border-border eb-py-4 last:eb-pb-0',
                    !hasPrecedingContent && 'first:eb-border-t-0 first:eb-pt-0'
                  )
                : 'eb-rounded-lg eb-border eb-p-4'
            )}
          >
            <div className="eb-mb-1 eb-flex eb-items-start eb-justify-between">
              <h2 className="eb-text-xl eb-font-bold eb-tracking-tight">
                {t(step.titleKey as any)}
              </h2>
              {!isValid ? (
                <Button
                  variant="default"
                  type="button"
                  size="sm"
                  className="eb-bg-warning eb-text-sm hover:eb-bg-warning/90"
                  onClick={() => {
                    onEditClick(step.id);
                  }}
                >
                  <PencilIcon />
                  Add
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  type="button"
                  size="sm"
                  className="eb-h-8 eb-p-2 eb-text-sm"
                  onClick={() => {
                    onEditClick(step.id);
                  }}
                >
                  <PencilIcon />
                  Change
                </Button>
              )}
            </div>
            {!isValid && (
              <Alert variant="warning" className="eb-mb-4" noTitle>
                <AlertTriangleIcon className="eb-mt-0.5 eb-size-5" />
                <AlertTitle className="eb-text-base eb-font-semibold">
                  Provide missing details
                </AlertTitle>
              </Alert>
            )}

            {schemaKeys.map((key) => {
              const field = key as keyof OnboardingFormValuesInitial;

              const value = formValues?.[field];

              const fieldConfig = partyFieldMap?.[field] as {
                toStringFn?: (
                  val: any,
                  values: Partial<OnboardingFormValuesInitial>
                ) => string | string[] | undefined;
                generateLabelStringFn?: (val: any) => string | undefined;
                isHiddenInReviewFn?: (val: any, values: any) => boolean;
              } & {
                [key: string]: any;
              };

              const { fieldRule, ruleType } = getFieldRule(field);

              if (fieldConfig?.isHiddenInReviewFn?.(value, formValues)) {
                return null;
              }

              const labelString =
                fieldConfig?.generateLabelStringFn?.(value) ??
                (ruleType === 'single'
                  ? fieldRule?.contentTokenOverrides?.label
                  : undefined) ??
                t([
                  `onboarding-overview:fields.${field}.label.${fieldRule.contentTokenOverrideKey}`,
                  `onboarding-overview:fields.${field}.label.default`,
                  `onboarding-overview:fields.${field}.label`,
                  `onboarding:fields.${field}.label`,
                ] as unknown as TemplateStringsArray);

              const reviewLabelString =
                (ruleType === 'single'
                  ? fieldRule?.contentTokenOverrides?.fieldName
                  : undefined) ??
                t(
                  [
                    `onboarding-overview:fields.${field}.fieldName.${fieldRule.contentTokenOverrideKey}`,
                    `onboarding-overview:fields.${field}.fieldName.default`,
                    `onboarding-overview:fields.${field}.fieldName`,
                  ] as unknown as TemplateStringsArray,
                  {
                    defaultValue: labelString,
                  }
                );

              const valueString = fieldConfig?.toStringFn
                ? fieldConfig.toStringFn(value, formValues)
                : value === undefined
                  ? undefined
                  : String(value);

              return (
                <div className="eb-space-y-0.5" key={field}>
                  <p className="eb-text-label eb-font-label eb-text-label-foreground">
                    {reviewLabelString}
                  </p>
                  <div className="eb-flex eb-flex-col">
                    {result?.error?.issues
                      .map((issue) => issue.path?.[0])
                      ?.includes(field) ? (
                      <div className="eb-flex eb-items-center eb-gap-1 eb-text-warning">
                        <TriangleAlertIcon className="eb-size-4" />
                        <p className="eb-italic">This field is missing</p>
                      </div>
                    ) : Array.isArray(valueString) ? (
                      valueString.map((val, index) => (
                        <p className="eb-text-sm" key={index}>
                          {val}
                        </p>
                      ))
                    ) : valueString ? (
                      <p className="eb-text-sm">{valueString}</p>
                    ) : (
                      <span className="eb-text-sm eb-italic eb-text-muted-foreground">
                        {t('common:empty')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </StepWrapper>
        );
      })}
    </div>
  );
};
