import { FC } from 'react';
import { AlertTriangleIcon, PencilIcon, TriangleAlertIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { AlertTitle } from '@/components/ui/alert';
import { Alert, Button, Card } from '@/components/ui';

import { partyFieldMap } from '../../../utils/fieldMap';
import {
  convertClientResponseToFormValues,
  useFormUtilsWithClientContext,
} from '../../../utils/formUtils';
import { OnboardingFormValuesSubmit } from '../../../utils/types';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { StepType } from '../../types';

type CheckAnswersScreenProps = {
  handleGoTo: (step: StepType) => void;
  steps: StepType[];
  partyId: string | undefined;
};
export const CheckAnswersScreen: FC<CheckAnswersScreenProps> = ({
  handleGoTo,
  steps,
  partyId,
}) => {
  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);
  const { clientData } = useOnboardingOverviewContext();

  const { modifySchema } = useFormUtilsWithClientContext(clientData);

  return (
    <div className="eb-mt-6 eb-space-y-6">
      {steps.map((step) => {
        if (step.type === 'form') {
          const values = clientData
            ? convertClientResponseToFormValues(clientData, partyId)
            : {};
          const modifiedSchema = modifySchema(
            step.FormComponent.schema,
            step.FormComponent.refineSchemaFn
          );
          const parseResult = modifiedSchema.safeParse(values);
          const hasErrors = !parseResult.success;
          const issues = parseResult.error?.issues.map(
            (issue) => issue.path?.[0]
          );

          return (
            <Card className="eb-grid eb-gap-y-3 eb-rounded-lg eb-border eb-p-4">
              <div className="eb-flex eb-items-start eb-justify-between">
                <h2 className="eb-text-xl eb-font-bold eb-tracking-tight">
                  {step.title}
                </h2>
                {hasErrors ? (
                  <Button
                    variant="default"
                    type="button"
                    size="sm"
                    className="eb-bg-[#C75300] eb-text-sm hover:eb-bg-[#C75300]/90"
                    onClick={() => {
                      handleGoTo(step);
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
                      handleGoTo(step);
                    }}
                  >
                    <PencilIcon />
                    Change
                  </Button>
                )}
              </div>
              {hasErrors && (
                <Alert variant="warning" className="eb-mb-4 eb-pb-3">
                  <AlertTriangleIcon className="eb-mt-0.5 eb-size-5" />
                  <AlertTitle className="eb-text-base eb-font-semibold">
                    Provide missing details
                  </AlertTitle>
                </Alert>
              )}
              {Object.keys(step.FormComponent.schema.shape).map((field) => {
                const fieldConfig = partyFieldMap?.[
                  field as keyof OnboardingFormValuesSubmit
                ] as {
                  toStringFn?: (val: any) => string | string[] | undefined;
                  generateLabelStringFn?: (val: any) => string | undefined;
                  isHiddenInReview?: (val: any) => boolean;
                } & {
                  [key: string]: any;
                };
                const value =
                  values?.[field as keyof OnboardingFormValuesSubmit];

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
                      ? fieldConfig.toStringFn(value)
                      : String(value)
                    : undefined;

                return (
                  <div className="eb-space-y-0.5" key={field}>
                    <p className="eb-text-sm eb-font-medium">{labelString}</p>
                    <div className="eb-flex eb-flex-col">
                      {issues?.includes(field) ? (
                        <div className="eb-flex eb-items-center eb-gap-1 eb-text-[#C75300]">
                          <TriangleAlertIcon className="eb-size-4" />
                          <p className="eb-italic">This field is missing</p>
                        </div>
                      ) : Array.isArray(valueString) ? (
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
