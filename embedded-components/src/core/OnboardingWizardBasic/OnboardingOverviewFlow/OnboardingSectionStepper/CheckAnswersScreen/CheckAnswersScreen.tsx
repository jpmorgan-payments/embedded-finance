import { FC } from 'react';
import { useTranslation } from 'react-i18next';

import { partyFieldMap } from '../../../utils/fieldMap';
import { convertClientResponseToFormValues } from '../../../utils/formUtils';
import { OnboardingFormValuesSubmit } from '../../../utils/types';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { StepType } from '../../onboardingOverviewSections';

type CheckAnswersScreenProps = {
  steps: StepType[];
};
export const CheckAnswersScreen: FC<CheckAnswersScreenProps> = ({ steps }) => {
  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);
  const { clientData } = useOnboardingOverviewContext();

  return (
    <div className="eb-space-y-6">
      {steps.map((step) => {
        if (step.type === 'form') {
          const stepPartyData = clientData?.parties?.find(
            (party) =>
              party?.partyType === step.formConfig.party.partyType &&
              step.formConfig.party.roles?.every((role) =>
                party?.roles?.includes(role)
              ) &&
              party.active
          );
          const values = clientData
            ? convertClientResponseToFormValues(clientData, stepPartyData?.id)
            : {};
          return (
            <div className="eb-space-y-3 eb-rounded-lg eb-border eb-p-4">
              <h2 className="eb-text-xl eb-font-bold eb-tracking-tight">
                {step.title}
              </h2>
              {Object.keys(step.formConfig.FormComponent.schema.shape).map(
                (field) => {
                  const value =
                    values?.[field as keyof OnboardingFormValuesSubmit];
                  return (
                    <div className="eb-space-y-0.5">
                      <p className="eb-text-sm eb-font-medium">
                        {t([
                          `onboarding-overview:fields.${field}.label`,
                          `onboarding:fields.${field}.label`,
                        ] as unknown as TemplateStringsArray)}
                      </p>
                      <p>
                        {value ? (
                          (partyFieldMap?.[
                            field as keyof OnboardingFormValuesSubmit
                          ]?.toStringFn?.(value) ?? String(value))
                        ) : (
                          <span className="eb-italic eb-text-muted-foreground">
                            {t('common:empty')}
                          </span>
                        )}
                      </p>
                    </div>
                  );
                }
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};
