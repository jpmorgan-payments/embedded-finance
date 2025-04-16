import { ChevronRightIcon, InfoIcon, PencilIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui';

import { useOnboardingOverviewContext } from '../OnboardingContext/OnboardingContext';
import { GlobalStepper } from '../OnboardingGlobalStepper';
import { overviewSections } from '../overviewSectionsConfig';
import { StepLayout } from '../StepLayout/StepLayout';

export const OnboardingOverviewScreen = () => {
  const { organizationType } = useOnboardingOverviewContext();

  // TODO: Show message if clientData changes upon refetch? (edge case)

  const globalStepper = GlobalStepper.useStepper();

  const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  return (
    <StepLayout
      subTitle={
        <div className="eb-flex eb-items-end eb-space-x-2">
          <p>{t(`onboarding:organizationTypes.${organizationType!}`)}</p>
          <Button
            variant="ghost"
            className="eb-h-6 eb-w-6 eb-px-3"
            onClick={() => globalStepper.goTo('gateway')}
          >
            <PencilIcon className="eb-stroke-primary" />
          </Button>
        </div>
      }
      title={t('steps.overview.title')}
      description={t('steps.overview.description')}
    >
      <div className="eb-mt-2 eb-flex-auto eb-space-y-6">
        <Alert variant="informative">
          <InfoIcon className="eb-h-4 eb-w-4" />
          <AlertDescription>{t('steps.overview.infoAlert')}</AlertDescription>
        </Alert>

        <div className="eb-flex eb-flex-col eb-space-y-2">
          <p className="eb-text-sm eb-font-semibold">
            Please complete the following to verify your company
          </p>
          {overviewSections.map((section) => (
            <div
              key={section.id}
              className="eb-flex eb-justify-between eb-rounded-md eb-border eb-px-4 eb-py-2 eb-text-sm"
            >
              <div className="eb-flex eb-items-center eb-gap-2">
                <section.icon className="eb-h-4 eb-w-4" />
                <span>{section.title}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="eb-text-primary"
                onClick={() => {
                  if (section.type === 'stepper') {
                    globalStepper.setMetadata('section-stepper', {
                      ...section,
                    });
                    globalStepper.goTo('section-stepper');
                  }
                }}
              >
                {t('common:start')}
                <ChevronRightIcon className="eb-h-4 eb-w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="eb-flex eb-justify-between eb-gap-4">
        <Button
          variant="secondary"
          size="lg"
          className="eb-w-full eb-text-lg"
          onClick={() => globalStepper.prev()}
        >
          {t('steps.overview.prevButton')}
        </Button>
      </div>
    </StepLayout>
  );
};
