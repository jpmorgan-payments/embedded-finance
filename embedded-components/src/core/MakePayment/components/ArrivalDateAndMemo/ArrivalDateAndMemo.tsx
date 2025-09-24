import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { PaymentFormData } from '../../types';

export const ArrivalDateAndMemo: React.FC = () => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();
  const today = useMemo(() => new Date(), []);

  return (
    <>
      <div className="eb-space-y-1">
        <Label className="eb-block">
          {t('sections.arrivalDate', {
            defaultValue: 'When do you want the payment to arrive?',
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

      {/* Memo field */}
      <FormField
        control={form.control}
        name="memo"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Memo</FormLabel>
            <div className="eb-mb-1 eb-text-xs eb-text-muted-foreground">
              {t('helpers.memo', {
                defaultValue: 'Internal note for your records (optional)',
              })}
            </div>
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
    </>
  );
};
