import React from 'react';
import { CreditCard } from 'lucide-react';
import { Controller } from 'react-hook-form';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { PaymentMethodsSectionProps } from './RecipientForm.types';

export const PaymentMethodsSection: React.FC<PaymentMethodsSectionProps> = ({
  control,
  errors,
  availablePaymentMethods,
  multipleMethodsAllowed,
}) => {
  const getPaymentMethodDisplayName = (method: string) => {
    switch (method) {
      case 'ACH':
        return 'ACH Transfer';
      case 'WIRE':
        return 'Wire Transfer';
      case 'RTP':
        return 'Real-Time Payments';
      default:
        return method;
    }
  };

  return (
    <div className="eb-space-y-4">
      <div className="eb-flex eb-items-center eb-gap-2">
        <CreditCard className="eb-h-4 eb-w-4" />
        <Label className="eb-text-base eb-font-medium">
          How do you want to pay this recipient?
        </Label>
      </div>

      {multipleMethodsAllowed ? (
        // Multiple payment methods - checkboxes
        <div className="eb-space-y-3">
          <Controller
            name="paymentMethods"
            control={control}
            render={({ field }) => (
              <div className="eb-space-y-2">
                {availablePaymentMethods.map((method) => (
                  <div
                    key={method}
                    className="eb-flex eb-items-center eb-space-x-2"
                  >
                    <Checkbox
                      id={`payment-method-${method}`}
                      checked={field.value?.includes(method) || false}
                      onCheckedChange={(checked) => {
                        const currentMethods = field.value || [];
                        if (checked) {
                          field.onChange([...currentMethods, method]);
                        } else {
                          field.onChange(
                            currentMethods.filter((m: string) => m !== method)
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`payment-method-${method}`}
                      className="eb-text-sm eb-font-normal"
                    >
                      {getPaymentMethodDisplayName(method)}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          />
          {errors.paymentMethods && (
            <p className="eb-text-sm eb-text-red-500">
              {errors.paymentMethods.message}
            </p>
          )}
        </div>
      ) : (
        // Single payment method - dropdown (but auto-selected if only one option)
        <div className="eb-space-y-2">
          <Controller
            name="paymentMethods"
            control={control}
            render={({ field }) => (
              <>
                {availablePaymentMethods.length === 1 ? (
                  <div className="eb-rounded-md eb-border eb-bg-gray-50 eb-p-3">
                    <p className="eb-text-sm eb-text-gray-700">
                      Payment Method:{' '}
                      {getPaymentMethodDisplayName(availablePaymentMethods[0])}
                    </p>
                  </div>
                ) : (
                  <Select
                    value={field.value?.[0] || ''}
                    onValueChange={(value) => field.onChange([value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {availablePaymentMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {getPaymentMethodDisplayName(method)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}
          />
          {errors.paymentMethods && (
            <p className="eb-text-sm eb-text-red-500">
              {errors.paymentMethods.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
