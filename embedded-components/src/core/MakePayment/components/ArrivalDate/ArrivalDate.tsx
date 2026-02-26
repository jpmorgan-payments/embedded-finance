import React, { useMemo } from 'react';
import { useTranslationWithTokens } from '@/hooks';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ArrivalDate: React.FC = () => {
  const { t } = useTranslationWithTokens(['make-payment']);
  const today = useMemo(() => new Date(), []);

  return (
    <div className="eb-space-y-1">
      <Label className="eb-block">
        {t('sections.arrivalDate', {
          defaultValue: '5. When do you want the payment to arrive?',
        })}
      </Label>
      <div className="eb-mb-1 eb-text-xs eb-text-muted-foreground">
        {t('helpers.arrivalDate', {
          defaultValue:
            'Currently set to today. Delivery scheduling will be available soon.',
        })}
      </div>
      <div className="eb-flex eb-items-center eb-gap-2">
        <Input disabled value={today.toLocaleDateString()} />
      </div>
    </div>
  );
};
