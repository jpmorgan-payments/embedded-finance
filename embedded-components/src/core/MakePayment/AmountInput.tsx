import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { PaymentFormData } from './types';

interface AmountInputProps {
  isAmountValid: boolean;
  totalAmount: number;
  availableBalance: number;
}

// Currency options with flags
const CURRENCY_OPTIONS = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
];

export const AmountInput: React.FC<AmountInputProps> = ({
  isAmountValid,
  totalAmount,
  availableBalance,
}) => {
  const { t } = useTranslation(['make-payment']);
  const form = useFormContext<PaymentFormData>();

  const amount = Number.parseFloat(form.watch('amount') || '0');
  const currency = form.watch('currency') || 'USD';

  return (
    <div className="eb-space-y-4">
      <div className="eb-text-sm eb-font-medium eb-text-foreground">
        {t('sections.amount.label', {
          defaultValue: '3. How much are you paying?',
        })}
      </div>

      {/* Currency and Amount on same line */}
      <div className="eb-flex eb-gap-2">
        {/* Currency Selection - Thin selector */}
        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem className="eb-flex-shrink-0">
              <Select
                onValueChange={field.onChange}
                defaultValue="USD"
                value={field.value || 'USD'}
              >
                <FormControl>
                  <SelectTrigger className="eb-h-10 eb-w-24">
                    <SelectValue placeholder="USD" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((currencyOption) => (
                    <SelectItem
                      key={currencyOption.code}
                      value={currencyOption.code}
                    >
                      <div className="eb-flex eb-items-center eb-gap-2">
                        <span>{currencyOption.flag}</span>
                        <span>{currencyOption.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Amount Input */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="eb-flex-1">
              <FormControl>
                <div className="eb-relative">
                  <span className="eb-absolute eb-left-3 eb-top-2.5 eb-text-muted-foreground">
                    {currency === 'USD'
                      ? '$'
                      : currency === 'EUR'
                        ? '€'
                        : currency === 'GBP'
                          ? '£'
                          : currency === 'CAD'
                            ? 'C$'
                            : currency}
                  </span>
                  <Input {...field} className="eb-pl-7" placeholder="0.00" />
                </div>
              </FormControl>
              <FormMessage />
              {!isAmountValid && amount > 0 && (
                <div className="eb-text-sm eb-text-destructive">
                  {totalAmount > availableBalance
                    ? `Insufficient funds. Available balance: ${currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency === 'CAD' ? 'C$' : currency}${availableBalance.toFixed(2)}`
                    : t('fields.amount.validation.greaterThanFee')}
                </div>
              )}
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
