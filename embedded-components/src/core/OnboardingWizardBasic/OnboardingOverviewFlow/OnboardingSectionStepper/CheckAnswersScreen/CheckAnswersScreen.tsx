import { FC } from 'react';
import { PencilIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, Card } from '@/components/ui';

import { partyFieldMap } from '../../../utils/fieldMap';
import { convertClientResponseToFormValues } from '../../../utils/formUtils';
import { OnboardingFormValuesSubmit } from '../../../utils/types';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { StepType } from '../../types';

type CheckAnswersScreenProps = {
  stepId: string;
  partyId: string | undefined;
  steps: StepType[];
  goToStep: (id: StepType) => void;
  setMetadata: (id: string, metadata: any) => void;
};
export const CheckAnswersScreen: FC<CheckAnswersScreenProps> = ({
  stepId,
  steps,
  goToStep,
  setMetadata,
  partyId,
}) => {
  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);
  const { clientData } = useOnboardingOverviewContext();

  return (
    <div className="eb-space-y-6">
      {steps.map((step) => {
        if (step.type === 'form') {
          const values = clientData
            ? convertClientResponseToFormValues(clientData, partyId)
            : {};
          return (
            <Card className="eb-space-y-3 eb-rounded-lg eb-border eb-p-4">
              <div className="eb-flex eb-items-start eb-justify-between">
                <h2 className="eb-text-xl eb-font-bold eb-tracking-tight">
                  {step.title}
                </h2>
                <Button
                  variant="ghost"
                  type="button"
                  size="sm"
                  className="eb-h-8 eb-p-2 eb-text-sm"
                  onClick={() => {
                    goToStep(step);
                    setMetadata(step.id, {
                      editModeOriginStepId: stepId,
                    });
                  }}
                >
                  <PencilIcon />
                  Change
                </Button>
              </div>
              {Object.keys(step.FormComponent.schema.shape).map((field) => {
                const value =
                  values?.[field as keyof OnboardingFormValuesSubmit];
                const toStringFn = partyFieldMap?.[
                  field as keyof OnboardingFormValuesSubmit
                ]?.toStringFn as (val: any) => string | string[] | undefined;
                const generateLabelStringFn = partyFieldMap?.[
                  field as keyof OnboardingFormValuesSubmit
                ]?.generateLabelStringFn as (val: any) => string | undefined;

                const labelString =
                  generateLabelStringFn?.(value) ??
                  t([
                    `onboarding-overview:fields.${field}.reviewLabel`,
                    `onboarding-overview:fields.${field}.label`,
                    `onboarding:fields.${field}.label`,
                  ] as unknown as TemplateStringsArray);

                const valueString =
                  value !== undefined
                    ? toStringFn
                      ? toStringFn(value)
                      : String(value)
                    : undefined;

                return (
                  <div className="eb-space-y-0.5" key={field}>
                    <p className="eb-text-sm eb-font-medium">{labelString}</p>
                    <div className="eb-flex eb-flex-col">
                      {Array.isArray(valueString) ? (
                        valueString.map((val, index) => (
                          <p key={index}>{val}</p>
                        ))
                      ) : valueString ? (
                        <p>{valueString}</p>
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
        }
        return null;
      })}
    </div>
  );
};
