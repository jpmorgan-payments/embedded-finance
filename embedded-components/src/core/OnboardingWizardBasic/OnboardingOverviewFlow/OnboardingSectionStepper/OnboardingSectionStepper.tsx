import { defineStepper } from '@stepperize/react';

// import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui';

import { GlobalStepper } from '../OnboardingGlobalStepper';
import { onboardingOverviewSections } from '../onboardingOverviewSections';
import { StepLayout } from '../StepLayout/StepLayout';

export const OnboardingSectionStepper = () => {
  // const { t } = useTranslation(['onboarding-overview', 'onboarding', 'common']);

  // TODO: Show message if clientData changes upon refetch? (edge case)

  const globalStepper = GlobalStepper.useStepper();

  const { steps } = globalStepper.getMetadata(
    'section-stepper'
  ) as (typeof onboardingOverviewSections)[number];

  const { useStepper, utils: stepperUtils } = defineStepper(...steps);
  const { current: currentStep, prev } = useStepper();

  const currentStepNumber = stepperUtils.getIndex(currentStep.id) + 1;

  //handle submit

  return (
    <StepLayout
      subTitle={
        <p className="eb-font-semibold">
          Step {currentStepNumber} of {steps.length}
        </p>
      }
      title={currentStep.title}
      description={currentStep.description}
    >
      <div className="eb-flex-auto eb-space-y-6">{currentStep.form}</div>

      <div className="eb-flex eb-justify-between eb-gap-4">
        {currentStepNumber === 1 ? (
          <Button
            variant="secondary"
            size="lg"
            className="eb-w-full eb-text-lg"
            onClick={() => globalStepper.goTo('overview')}
          >
            Back to overview
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="lg"
            className="eb-w-full eb-text-lg"
            onClick={() => prev()}
          >
            Back
          </Button>
        )}
        <Button
          form={currentStep.id}
          variant="default"
          size="lg"
          className="eb-w-full eb-text-lg"
        >
          Next
        </Button>
      </div>
    </StepLayout>
  );
};
