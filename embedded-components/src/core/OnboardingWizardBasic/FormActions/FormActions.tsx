import { useTranslation } from 'react-i18next';

import { useStepper } from '@/components/ui/stepper';
import { Button } from '@/components/ui';

export const FormActions = () => {
  const { prevStep, isDisabledStep, isLastStep } = useStepper();
  const { t } = useTranslation('common');

  return (
    <div className="eb-flex eb-w-full eb-justify-end eb-gap-4">
      <Button disabled={isDisabledStep} variant="secondary" onClick={prevStep}>
        {t('previous')}
      </Button>
      <Button>{isLastStep ? t('submit') : t('next')}</Button>
    </div>
  );
};
