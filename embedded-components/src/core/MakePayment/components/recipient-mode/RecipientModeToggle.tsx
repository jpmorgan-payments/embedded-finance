import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FormControl, FormField, FormItem } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import type { PaymentFormData } from '../../types';

interface RecipientModeToggleProps {
  onModeChange?: (mode: 'existing' | 'manual') => void;
}

export const RecipientModeToggle: React.FC<RecipientModeToggleProps> = ({
  onModeChange,
}) => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();

  const handleModeChange = (newMode: 'existing' | 'manual') => {
    form.setValue('recipientMode', newMode);
    // Clear recipient selection when switching modes
    if (newMode === 'manual') {
      form.setValue('to', '');
    } else {
      form.setValue('saveRecipient', false);
    }
    onModeChange?.(newMode);
  };

  return (
    <FormField
      control={form.control}
      name="recipientMode"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup
              value={field.value || 'existing'}
              onValueChange={(value) => {
                const newMode = value as 'existing' | 'manual';
                field.onChange(newMode);
                handleModeChange(newMode);
              }}
              className="eb-flex eb-gap-0 eb-rounded-lg eb-border eb-p-1"
            >
              <div className="eb-flex-1">
                <RadioGroupItem
                  value="existing"
                  id="recipient-mode-existing"
                  className="eb-sr-only"
                />
                <Label
                  htmlFor="recipient-mode-existing"
                  className={`eb-flex eb-cursor-pointer eb-items-center eb-justify-center eb-rounded-md eb-px-3 eb-py-2 eb-text-sm eb-font-medium eb-transition-all ${
                    field.value === 'existing'
                      ? 'eb-bg-primary eb-text-primary-foreground eb-shadow-sm'
                      : 'eb-text-muted-foreground hover:eb-bg-muted'
                  }`}
                >
                  {t('fields.recipientMode.existing', {
                    defaultValue: 'Select existing',
                  })}
                </Label>
              </div>
              <div className="eb-flex-1">
                <RadioGroupItem
                  value="manual"
                  id="recipient-mode-manual"
                  className="eb-sr-only"
                />
                <Label
                  htmlFor="recipient-mode-manual"
                  className={`eb-flex eb-cursor-pointer eb-items-center eb-justify-center eb-rounded-md eb-px-3 eb-py-2 eb-text-sm eb-font-medium eb-transition-all ${
                    field.value === 'manual'
                      ? 'eb-bg-primary eb-text-primary-foreground eb-shadow-sm'
                      : 'eb-text-muted-foreground hover:eb-bg-muted'
                  }`}
                >
                  {t('fields.recipientMode.manual', {
                    defaultValue: 'Enter details',
                  })}
                </Label>
              </div>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
};
