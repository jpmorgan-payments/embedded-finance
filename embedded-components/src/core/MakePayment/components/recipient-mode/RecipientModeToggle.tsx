import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import type { PaymentFormData } from '../../types';

export const RecipientModeToggle: React.FC = () => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();
  const mode = form.watch('recipientMode') || 'existing';

  return (
    <div className="eb-flex eb-items-center eb-gap-2">
      <Button
        type="button"
        variant={mode === 'existing' ? 'default' : 'outline'}
        onClick={() => form.setValue('recipientMode', 'existing')}
        className="eb-text-xs"
      >
        {t('fields.recipientMode.existing', {
          defaultValue: 'Select existing',
        })}
      </Button>
      <Button
        type="button"
        variant={mode === 'manual' ? 'default' : 'outline'}
        onClick={() => form.setValue('recipientMode', 'manual')}
        className="eb-text-xs"
      >
        {t('fields.recipientMode.manual', { defaultValue: 'Enter details' })}
      </Button>
    </div>
  );
};
