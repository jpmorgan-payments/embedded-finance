import React from 'react';
import { CreditCard } from 'lucide-react';
import { Controller } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { AccountDetailsSectionProps } from './RecipientForm.types';

export const AccountDetailsSection: React.FC<AccountDetailsSectionProps> = ({
  control,
  register,
  errors,
}) => {
  return (
    <div className="eb-space-y-4">
      <div className="eb-flex eb-items-center eb-gap-2">
        <CreditCard className="eb-h-4 eb-w-4" />
        <Label className="eb-text-base eb-font-medium">Account Details</Label>
      </div>

      <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2">
        {/* Account Type - moved before account number */}
        <div className="eb-space-y-2">
          <Label htmlFor="accountType">Account Type</Label>
          <Controller
            name="accountType"
            control={control}
            render={({ field }) => (
              <Select value={field.value || ''} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">Checking</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.accountType && (
            <p className="eb-text-sm eb-text-red-500">
              {errors.accountType.message}
            </p>
          )}
        </div>

        {/* Account Number - moved after account type */}
        <div className="eb-space-y-2">
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            {...register('accountNumber')}
            placeholder="Enter account number"
            maxLength={35}
            pattern="[0-9]*"
            onInput={(e) => {
              // Only allow numeric input
              const target = e.target as HTMLInputElement;
              target.value = target.value.replace(/[^0-9]/g, '');
            }}
          />
          {errors.accountNumber && (
            <p className="eb-text-sm eb-text-red-500">
              {errors.accountNumber.message}
            </p>
          )}
        </div>
      </div>

      {/* Country Code */}
      <div className="eb-space-y-2">
        <Label htmlFor="countryCode">Country</Label>
        <Controller
          name="countryCode"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="eb-w-full md:eb-w-48">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.countryCode && (
          <p className="eb-text-sm eb-text-red-500">
            {errors.countryCode.message}
          </p>
        )}
      </div>
    </div>
  );
};
