import { AlertTriangleIcon, PencilIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { PartyResponse } from '@/api/generated/smbdo.schemas';
import { AlertTitle } from '@/components/ui/alert';
import { Alert, Button, Card } from '@/components/ui';
import { partyFieldMap } from '@/core/OnboardingWizardBasic/utils/fieldMap';
import { convertPartyResponseToFormValues } from '@/core/OnboardingWizardBasic/utils/formUtils';
import { OnboardingFormValuesInitial } from '@/core/OnboardingWizardBasic/utils/types';

import { StepConfig } from '../../flow.types';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { getStepperValidation } from '../../utils/flowUtils';

type StepperReviewCardsProps = {
  steps: StepConfig[];
  partyData: PartyResponse | undefined;
  onEditClick: (stepId: string) => void;
};

export const StepperReviewCards: React.FC<StepperReviewCardsProps> = ({
  steps,
  partyData,
  onEditClick,
}) => {
  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  const { clientData } = useOnboardingOverviewContext();
  const formValues = convertPartyResponseToFormValues(partyData ?? {});
  const { stepValidationMap } = getStepperValidation(
    steps,
    partyData,
    clientData
  );

  return (
    <div className="eb-space-y-4" key={partyData?.id}>
      {steps
        .filter((step) => step.stepType !== 'check-answers')
        .map((step) => {
          const { isValid, result } = stepValidationMap[step.id];

          return (
            <Card className="eb-grid eb-gap-y-3 eb-rounded-lg eb-border eb-p-4">
              <div className="eb-mb-1 eb-flex eb-items-start eb-justify-between">
                <h2 className="eb-text-xl eb-font-bold eb-tracking-tight">
                  {step.title}
                </h2>
                {!isValid ? (
                  <Button
                    variant="default"
                    type="button"
                    size="sm"
                    className="eb-bg-[#C75300] eb-text-sm hover:eb-bg-[#C75300]/90"
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
                <Alert variant="warning" className="eb-mb-4 eb-pb-3">
                  <AlertTriangleIcon className="eb-mt-0.5 eb-size-5" />
                  <AlertTitle className="eb-text-base eb-font-semibold">
                    Provide missing details
                  </AlertTitle>
                </Alert>
              )}

              {step.stepType === 'form' &&
                Object.keys(step.Component.schema.shape).map((field) => {
                  const fieldConfig = partyFieldMap?.[
                    field as keyof OnboardingFormValuesInitial
                  ] as {
                    toStringFn?: (
                      val: any,
                      values: Partial<OnboardingFormValuesInitial>
                    ) => string | string[] | undefined;
                    generateLabelStringFn?: (val: any) => string | undefined;
                    isHiddenInReview?: (val: any) => boolean;
                  } & {
                    [key: string]: any;
                  };
                  const value =
                    formValues?.[field as keyof OnboardingFormValuesInitial];

                  if (fieldConfig?.isHiddenInReview?.(value)) {
                    return null;
                  }
                  const labelString =
                    fieldConfig?.generateLabelStringFn?.(value) ??
                    t([
                      `onboarding-overview:fields.${field}.reviewLabel`,
                      `onboarding-overview:fields.${field}.label`,
                      `onboarding:fields.${field}.label`,
                    ] as unknown as TemplateStringsArray);

                  const valueString =
                    value !== undefined
                      ? fieldConfig?.toStringFn
                        ? fieldConfig.toStringFn(value, formValues)
                        : String(value)
                      : undefined;

                  return (
                    <div className="eb-space-y-0.5" key={field}>
                      <p className="eb-text-label eb-font-label eb-text-label-foreground">
                        {labelString}
                      </p>
                      <div className="eb-flex eb-flex-col">
                        {result?.error?.issues
                          .map((issue) => issue.path?.[0])
                          ?.includes(field) ? (
                          <div className="eb-flex eb-items-center eb-gap-1 eb-text-[#C75300]">
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
                          <span className="eb-italic eb-text-muted-foreground">
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
