import React, { useEffect, useState } from 'react';
import { Hash } from 'lucide-react';
import { Controller, useFormContext } from 'react-hook-form';
import type { UseFormSetValue, UseFormWatch } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import type { FormData } from './RecipientForm.schema';

export interface RoutingNumbersSectionProps {
  control: any;
  errors: any;
  selectedPaymentMethods: string[];
  setValue: UseFormSetValue<FormData>;
  watch: UseFormWatch<FormData>;
}

export const RoutingNumbersSection: React.FC<RoutingNumbersSectionProps> = ({
  control,
  errors,
  selectedPaymentMethods,
  setValue,
  watch,
}) => {
  const [useSameRouting, setUseSameRouting] = useState(false);

  // Watch all routing numbers
  const routingNumbers = watch ? watch('routingNumbers') || {} : {};

  // --- Autofill/Autocomplete Validation Fix ---
  // Get trigger from form context safely
  const formContext = useFormContext?.();
  const trigger = formContext?.trigger;
  useEffect(() => {
    if (
      trigger &&
      selectedPaymentMethods &&
      selectedPaymentMethods.length > 0
    ) {
      // Trigger validation for all routing numbers on mount and when they change
      selectedPaymentMethods.forEach((method) => {
        trigger(`routingNumbers.${method}`);
      });
    }
  }, [JSON.stringify(routingNumbers), selectedPaymentMethods]);

  // When useSameRouting is enabled, sync all routing numbers to the first value
  useEffect(() => {
    if (
      useSameRouting &&
      selectedPaymentMethods &&
      selectedPaymentMethods.length > 0
    ) {
      const firstMethod = selectedPaymentMethods[0];
      const value = routingNumbers[firstMethod] || '';
      const newRoutingNumbers: Record<string, string> = {};
      selectedPaymentMethods.forEach((method) => {
        newRoutingNumbers[method] = value;
      });
      setValue && setValue('routingNumbers' as any, newRoutingNumbers);
    }
  }, [useSameRouting, selectedPaymentMethods]);

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

  if (!selectedPaymentMethods || selectedPaymentMethods.length === 0) {
    return null;
  }

  return (
    <div className="eb-space-y-4">
      <div className="eb-flex eb-items-center eb-gap-2">
        <Hash className="eb-h-4 eb-w-4" />
        <Label className="eb-text-base eb-font-medium">Routing Numbers</Label>
      </div>

      {/* Use same routing number for all methods */}
      <div className="eb-flex eb-items-center eb-gap-2">
        <input
          type="checkbox"
          id="use-same-routing"
          checked={useSameRouting}
          onChange={(e) => setUseSameRouting(e.target.checked)}
        />
        <Label htmlFor="use-same-routing" className="eb-text-sm">
          Use same routing number for all payment methods
        </Label>
      </div>

      <div className="eb-rounded-lg eb-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="eb-w-1/2">Payment Method</TableHead>
              <TableHead>Routing Number</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedPaymentMethods.map((method, idx) => (
              <TableRow key={method}>
                <TableCell className="eb-font-medium">
                  {getPaymentMethodDisplayName(method)}
                </TableCell>
                <TableCell>
                  <Controller
                    name={`routingNumbers.${method}`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <>
                        <Input
                          {...field}
                          placeholder="Enter routing number"
                          className={
                            errors.routingNumbers?.[method]
                              ? 'eb-w-full eb-border-red-500 focus-visible:eb-ring-red-500'
                              : 'eb-w-full'
                          }
                          maxLength={11}
                          pattern="[0-9]*"
                          onInput={(e) => {
                            // Only allow numeric input
                            const target = e.target as HTMLInputElement;
                            target.value = target.value.replace(/[^0-9]/g, '');
                            field.onChange(target.value);
                            if (useSameRouting) {
                              // Update all routing numbers to this value
                              const newRoutingNumbers: Record<string, string> =
                                {};
                              selectedPaymentMethods.forEach((m) => {
                                newRoutingNumbers[m] = target.value;
                              });
                              setValue &&
                                setValue(
                                  'routingNumbers' as any,
                                  newRoutingNumbers
                                );
                            }
                          }}
                          disabled={useSameRouting && idx !== 0}
                        />
                        {/* Inline error for this routing number */}
                        {errors.routingNumbers?.[method]?.message && (
                          <p className="eb-mt-1 eb-text-xs eb-text-red-500">
                            {errors.routingNumbers[method].message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Remove global routingNumbers error, now handled inline */}

      <p className="eb-text-xs eb-text-gray-500">
        Routing numbers must be 8-11 digits and are specific to each payment
        method.
      </p>
    </div>
  );
};
