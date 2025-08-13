import { AlertTriangleIcon, PencilIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PartyResponse } from '@/api/generated/smbdo.schemas';
import { AlertTitle } from '@/components/ui/alert';
import { Alert, Button, Card } from '@/components/ui';
import { partyFieldMap } from '@/core/OnboardingFlow/config/fieldMap';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { StepConfig } from '@/core/OnboardingFlow/types/flow.types';
import { OnboardingFormValuesInitial } from '@/core/OnboardingFlow/types/form.types';
import { getStepperValidation } from '@/core/OnboardingFlow/utils/flowUtils';
import {
  convertPartyResponseToFormValues,
  useFormUtilsWithClientContext,
} from '@/core/OnboardingFlow/utils/formUtils';

type StepsReviewCardsProps = {
  steps: StepConfig[];
  partyData: PartyResponse | undefined;
  onEditClick: (stepId: string) => void;
};

export const StepsReviewCards: React.FC<StepsReviewCardsProps> = ({
  steps,
  partyData,
  onEditClick,
}) => {
  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  const { clientData } = useOnboardingContext();
  const { currentScreenId, savedFormValues } = useFlowContext();
  const formValues = {
    ...convertPartyResponseToFormValues(partyData ?? {}),
    ...savedFormValues,
  };
  const { stepValidationMap } = getStepperValidation(
    steps,
    partyData,
    clientData,
    savedFormValues,
    currentScreenId
  );

  const { modifySchema, getFieldRule } = useFormUtilsWithClientContext(
    clientData,
    currentScreenId
  );

  return (
    <div className="eb-space-y-4" key={partyData?.id}>
      {steps
        .filter((step) => step.stepType !== 'check-answers')
        .map((step) => {
          const { isValid, result } = stepValidationMap[step.id];

          let schemaKeys: string[] = [];
          if (step.stepType === 'form') {
            const modifiedSchema = modifySchema(
              step.Component.schema,
              step.Component.refineSchemaFn
            );
            schemaKeys = Object.keys(
              'shape' in modifiedSchema
                ? modifiedSchema.shape
                : 'innerType' in modifiedSchema
                  ? modifiedSchema.innerType().shape
                  : {}
            );
          }

          return (
            <Card
              key={step.id}
              className="eb-grid eb-gap-y-3 eb-rounded-lg eb-border eb-p-4"
            >
              <div className="eb-mb-1 eb-flex eb-items-start eb-justify-between">
                <h2 className="eb-text-xl eb-font-bold eb-tracking-tight">
                  {step.title}
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
                  isHiddenInReviewFn?: (val: any) => boolean;
                } & {
                  [key: string]: any;
                };

                const { fieldRule, ruleType } = getFieldRule(field);

                if (fieldConfig?.isHiddenInReviewFn?.(value)) {
                  return null;
                }

                const labelString =
                  fieldConfig?.generateLabelStringFn?.(value) ??
                  (ruleType === 'single'
                    ? fieldRule?.contentTokenOverrides?.label
                    : undefined) ??
                  t([
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
            </Card>
          );
        })}
    </div>
  );
};
