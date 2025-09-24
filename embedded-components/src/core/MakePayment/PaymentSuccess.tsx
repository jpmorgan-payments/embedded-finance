import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

interface PaymentSuccessProps {
  onMakeAnotherPayment: () => void;
}

export const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  onMakeAnotherPayment,
}) => {
  const { t } = useTranslation(['make-payment']);

  return (
    <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-space-y-4 eb-rounded-lg eb-bg-muted eb-p-6 eb-text-center">
      <h2 className="eb-text-xl eb-font-semibold">{t('success.title')}</h2>
      <p className="eb-text-muted-foreground">{t('success.message')}</p>
      <Button onClick={onMakeAnotherPayment}>
        {t('buttons.makeAnotherPayment')}
      </Button>
    </div>
  );
};
