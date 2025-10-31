import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

import type { PaymentFormData, PaymentMethod } from '../../types';

interface PaymentMethodSelectorProps {
  dynamicPaymentMethods: PaymentMethod[];
  paymentMethods: PaymentMethod[];
  isFormFilled: boolean;
  amount: number;
  fee: number;
  /** When true, show all available methods (manual recipient entry) */
  forceAllMethods?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  dynamicPaymentMethods,
  paymentMethods,
  isFormFilled,
  amount,
  fee,
  forceAllMethods,
}) => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();
  const [isOpen, setIsOpen] = useState(true);
  const list = forceAllMethods ? paymentMethods : dynamicPaymentMethods;

  return (
    <>
      <FormField
        control={form.control}
        name="method"
        render={({ field }) => (
          <FormItem className="eb-space-y-3">
            <FormLabel>
              {forceAllMethods
                ? t('fields.method.manualLabel', {
                    defaultValue: 'Payment method',
                  })
                : t('fields.method.label', {
                    defaultValue: 'How do you want to pay?',
                  })}
            </FormLabel>
            {!forceAllMethods && (
              <div className="eb-text-xs eb-text-muted-foreground">
                {t('helpers.method', {
                  defaultValue:
                    "Available methods depend on the recipient's bank.",
                })}
              </div>
            )}
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
                className="eb-flex eb-flex-row eb-flex-wrap eb-gap-3"
              >
                {!forceAllMethods && list.length === 0 && (
                  <div className="eb-py-2 eb-text-xs eb-text-muted-foreground">
                    No payment methods available for this recipient.
                  </div>
                )}
                {list.map((paymentMethod) => (
                  <div
                    key={paymentMethod.id}
                    className="eb-relative eb-min-w-[120px] eb-max-w-[160px] eb-flex-1"
                  >
                    <RadioGroupItem
                      value={paymentMethod.id}
                      id={paymentMethod.id.toLowerCase()}
                      className="eb-sr-only"
                    />
                    <Label
                      htmlFor={paymentMethod.id.toLowerCase()}
                      className={cn(
                        'eb-flex eb-min-h-[80px] eb-cursor-pointer eb-flex-col eb-items-center eb-justify-center eb-rounded-lg eb-border-2 eb-p-3 eb-transition-all eb-duration-200 eb-ease-in-out',
                        'eb-border-border eb-bg-card eb-text-card-foreground',
                        'hover:eb-border-primary hover:eb-shadow-md',
                        'focus-within:eb-ring-2 focus-within:eb-ring-ring focus-within:eb-ring-offset-2',
                        field.value === paymentMethod.id
                          ? 'eb-border-primary eb-bg-primary/5 eb-shadow-md'
                          : 'eb-border-border hover:eb-border-primary/50'
                      )}
                    >
                      <div className="eb-flex eb-flex-col eb-items-center eb-space-y-2 eb-text-center">
                        <div
                          className={cn(
                            'eb-flex eb-h-6 eb-w-6 eb-items-center eb-justify-center eb-rounded-full eb-text-xs eb-font-semibold',
                            field.value === paymentMethod.id
                              ? 'eb-bg-primary eb-text-primary-foreground'
                              : 'eb-bg-muted eb-text-muted-foreground'
                          )}
                        >
                          {paymentMethod.id.charAt(0)}
                        </div>
                        <div className="eb-space-y-1">
                          <div className="eb-text-xs eb-font-medium">
                            {t(`paymentMethods.${paymentMethod.id}`, {
                              defaultValue: paymentMethod.name,
                            })}
                          </div>
                          <div className="eb-text-xs eb-text-muted-foreground">
                            ${paymentMethod.fee.toFixed(2)} fee
                          </div>
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {isFormFilled && (
        <>
          <Separator className="eb-my-2" />
          <div className="eb-space-y-3">
            <Collapsible
              open={isOpen}
              onOpenChange={setIsOpen}
              className="eb-w-full eb-rounded-md eb-border eb-border-input eb-px-3 eb-py-2"
            >
              <div className="eb-flex eb-items-center eb-justify-between eb-space-x-4">
                <h4 className="eb-text-sm eb-font-medium">
                  {t('transferFee.label', {
                    amount: fee.toFixed(2),
                  })}
                </h4>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="eb-h-8 eb-w-8 eb-p-0"
                  >
                    {isOpen ? (
                      <ChevronUp className="eb-h-4 eb-w-4" />
                    ) : (
                      <ChevronDown className="eb-h-4 eb-w-4" />
                    )}
                    <span className="eb-sr-only">
                      {t('transferFee.toggle')}
                    </span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="eb-mt-2">
                <div className="eb-rounded-md eb-bg-muted eb-px-3 eb-py-2 eb-text-sm eb-text-muted-foreground">
                  {form.watch('method') &&
                    t(`feeDescriptions.${form.watch('method')}`, {
                      defaultValue:
                        paymentMethods.find(
                          (m) => m.id === form.watch('method')
                        )?.description || '',
                    })}
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="eb-text-sm eb-font-medium">
              {t('recipientGets', {
                amount: (amount - fee).toFixed(2),
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
};
