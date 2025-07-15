import React from 'react';
import { Hash } from 'lucide-react';
import { Controller } from 'react-hook-form';

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

import type { RoutingNumbersSectionProps } from './RecipientForm.types';

export const RoutingNumbersSection: React.FC<RoutingNumbersSectionProps> = ({
  control,
  errors,
  selectedPaymentMethods,
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

  if (!selectedPaymentMethods || selectedPaymentMethods.length === 0) {
    return null;
  }

  return (
    <div className="eb-space-y-4">
      <div className="eb-flex eb-items-center eb-gap-2">
        <Hash className="eb-h-4 eb-w-4" />
        <Label className="eb-text-base eb-font-medium">Routing Numbers</Label>
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
            {selectedPaymentMethods.map((method) => (
              <TableRow key={method}>
                <TableCell className="eb-font-medium">
                  {getPaymentMethodDisplayName(method)}
                </TableCell>
                <TableCell>
                  <Controller
                    name={`routingNumbers.${method}`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter routing number"
                        className="eb-w-full"
                        maxLength={11}
                        pattern="[0-9]*"
                        onInput={(e) => {
                          // Only allow numeric input
                          const target = e.target as HTMLInputElement;
                          target.value = target.value.replace(/[^0-9]/g, '');
                          field.onChange(target.value);
                        }}
                      />
                    )}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {errors.routingNumbers && (
        <p className="eb-text-sm eb-text-red-500">
          {errors.routingNumbers.message}
        </p>
      )}

      <p className="eb-text-xs eb-text-gray-500">
        Routing numbers must be 8-11 digits and are specific to each payment
        method.
      </p>
    </div>
  );
};
