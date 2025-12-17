import React, { useState } from 'react';
import {
  ArrowRightLeftIcon,
  BanknoteIcon,
  ChevronDown,
  ChevronUp,
  ZapIcon,
} from 'lucide-react';
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
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';

import type { PaymentFormData, PaymentMethod } from '../../types';

interface PaymentMethodSelectorProps {
  paymentMethods: PaymentMethod[];
  isFormFilled: boolean;
  amount: number;
  fee: number;
  accountsStatus?: 'pending' | 'error' | 'success';
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  paymentMethods,
  isFormFilled,
  amount,
  fee,
  accountsStatus,
}) => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();
  const [isOpen, setIsOpen] = useState(true);

  // Get icon for payment method type (matching LinkedAccountWidget/BankAccountForm)
  const getPaymentIcon = (methodId: string) => {
    switch (methodId) {
      case 'ACH':
        return <BanknoteIcon className="eb-h-4 eb-w-4" />;
      case 'WIRE':
        return <ArrowRightLeftIcon className="eb-h-4 eb-w-4" />;
      case 'RTP':
        return <ZapIcon className="eb-h-4 eb-w-4" />;
      default:
        return null;
    }
  };

  // Get label for payment method (matching LinkedAccountWidget pattern)
  const getPaymentLabel = (methodId: string, methodName: string) => {
    // Try translation first, fallback to method name
    const translated = t(`paymentMethods.${methodId}`, {
      defaultValue: methodName,
    });
    // If translation returns the key, use method name
    return translated === `paymentMethods.${methodId}`
      ? methodName
      : translated;
  };

  return (
    <div className="eb-space-y-4">
      <h3 className="eb-text-sm eb-font-semibold">
        {t('fields.method.label', {
          defaultValue: 'How do you want to pay?',
        })}
      </h3>
      <FormField
        control={form.control}
        name="method"
        render={({ field }) => (
          <FormItem className="eb-space-y-3">
            <FormControl>
              {paymentMethods.length === 0 ? (
                <div className="eb-text-sm eb-text-destructive">
                  {accountsStatus === 'error'
                    ? t('errors.noPaymentMethodsAvailable', {
                        defaultValue:
                          'No payment methods available for this recipient.',
                      })
                    : t('errors.noPaymentMethods', {
                        defaultValue: 'No payment methods available.',
                      })}
                </div>
              ) : (
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                  className="eb-flex eb-flex-row eb-gap-2"
                >
                  {paymentMethods.map((paymentMethod) => (
                    <div key={paymentMethod.id} className="eb-flex-1">
                      <RadioGroupItem
                        value={paymentMethod.id}
                        id={paymentMethod.id.toLowerCase()}
                        className="eb-sr-only"
                      />
                      <Label
                        htmlFor={paymentMethod.id.toLowerCase()}
                        data-user-event="payment_method_selected"
                        data-method-id={paymentMethod.id}
                        className={cn(
                          'eb-flex eb-cursor-pointer eb-items-center eb-gap-2 eb-rounded-lg eb-border eb-p-3 eb-transition-all',
                          'eb-border-border eb-bg-card',
                          'hover:eb-border-primary/50 hover:eb-bg-accent/50',
                          'focus-within:eb-ring-2 focus-within:eb-ring-ring focus-within:eb-ring-offset-2',
                          field.value === paymentMethod.id
                            ? 'eb-border-2 eb-border-primary eb-bg-primary/5 eb-shadow-sm'
                            : ''
                        )}
                      >
                        <div className="eb-flex eb-items-center eb-gap-2 eb-text-primary">
                          {getPaymentIcon(paymentMethod.id)}
                        </div>
                        <div className="eb-flex eb-flex-1 eb-flex-col eb-gap-0.5">
                          <span className="eb-text-sm eb-font-medium">
                            {getPaymentLabel(
                              paymentMethod.id,
                              paymentMethod.name
                            )}
                          </span>
                          <span className="eb-text-xs eb-text-muted-foreground">
                            ${paymentMethod.fee.toFixed(2)} fee
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
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
    </div>
  );
};
