import { FC } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { Loader2 } from 'lucide-react';

import { useStepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui';

import {
  EditMode,
  useOnboardingContext,
} from '../OnboardingContextProvider/OnboardingContextProvider';

type FormActionsProps = {
  isLoading?: boolean;
  disabled?: boolean;
};

export const FormActions: FC<FormActionsProps> = ({
  isLoading = false,
  disabled = false,
}) => {
  const { prevStep, isDisabledStep, isLastStep, activeStep } = useStepper();
  const { editMode, steps, setCurrentStepIndex } = useOnboardingContext();
  const { t } = useTranslation('common');

  const cancelToReview = () => {
    setCurrentStepIndex(steps.length - 1);
  };

  return (
    <div className="eb-flex eb-w-full eb-justify-end eb-gap-4 eb-pb-1">
      {activeStep !== 0 && editMode === EditMode.Stepper ? (
        <Button
          disabled={isDisabledStep || isLoading || disabled}
          variant="secondary"
          onClick={prevStep}
          type="button"
          data-dtrum-tracking={t('previous')}
        >
          {t('previous')}
        </Button>
      ) : null}

      {activeStep !== 0 && editMode === EditMode.Review ? (
        <Button
          disabled={isDisabledStep || isLoading || disabled}
          variant="secondary"
          onClick={cancelToReview}
          type="button"
          data-dtrum-tracking={t('previous')}
        >
          {t('cancel')}
        </Button>
      ) : null}

      <Button
        type="submit"
        disabled={isLoading || disabled}
        data-dtrum-tracking={isLastStep ? t('submit') : t('next')}
      >
        {isLoading ? <Loader2 className="eb-animate-spin" /> : null}
        {editMode === EditMode.Stepper ? t('next') : null}
        {editMode === EditMode.Review || isLastStep ? t('submit') : null}
      </Button>
    </div>
  );
};
