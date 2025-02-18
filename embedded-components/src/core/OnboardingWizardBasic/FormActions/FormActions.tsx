import { FC } from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useStepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui';

type FormActionsProps = {
  isLoading?: boolean;
  disabled?: boolean;
};

export const FormActions: FC<FormActionsProps> = ({
  isLoading = false,
  disabled = false,
}) => {
  const { prevStep, isDisabledStep, isLastStep, activeStep } = useStepper();
  const { t } = useTranslation('common');

  return (
    <div className="eb-flex eb-w-full eb-justify-end eb-gap-4">
      {activeStep !== 0 ? (
        <Button
          disabled={isDisabledStep || isLoading || disabled}
          variant="secondary"
          onClick={prevStep}
          type="button"
        >
          {t('previous')}
        </Button>
      ) : null}

      <Button type="submit" disabled={isLoading || disabled}>
        {isLoading ? <Loader2 className="eb-animate-spin" /> : null}
        {isLastStep ? t('submit') : t('next')}
      </Button>
    </div>
  );
};
