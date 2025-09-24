import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import type { PaymentFormData } from './types';

export const AdditionalInformation: React.FC = () => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();

  return (
    <div className="eb-space-y-1">
      <FormLabel className="eb-block">
        {t('sections.additionalInfo', {
          defaultValue: '6. Additional Information (optional)',
        })}
      </FormLabel>
      <div className="eb-mb-1 eb-text-xs eb-text-muted-foreground">
        {t('helpers.memo', {
          defaultValue: 'Internal note for your records (optional)',
        })}
      </div>

      <FormField
        control={form.control}
        name="memo"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <textarea
                {...field}
                className="eb-min-h-[64px] eb-w-full eb-resize-y eb-rounded-md eb-border eb-bg-background eb-p-2 eb-text-sm"
                placeholder="Add a note or memo (optional)"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
