import React from 'react';
import { User } from 'lucide-react';
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

import type { PersonalDetailsSectionProps } from './RecipientForm.types';

export const PersonalDetailsSection: React.FC<PersonalDetailsSectionProps> = ({
  control,
  register,
  errors,
  setValue,
  partyType,
}) => {
  return (
    <div className="eb-space-y-4">
      <div className="eb-flex eb-items-center eb-gap-2">
        <User className="eb-h-4 eb-w-4" />
        <Label className="eb-text-base eb-font-medium">
          {partyType === 'INDIVIDUAL'
            ? 'Personal Details'
            : 'Organization Details'}
        </Label>
      </div>

      {/* Party Type Selector */}
      <div className="eb-space-y-2">
        <Label htmlFor="type">Type</Label>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                // Clear relevant fields when switching type
                if (value === 'INDIVIDUAL') {
                  setValue('businessName', '');
                } else {
                  setValue('firstName', '');
                  setValue('lastName', '');
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                <SelectItem value="ORGANIZATION">Organization</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.type && (
          <p className="eb-text-sm eb-text-red-500">{errors.type.message}</p>
        )}
      </div>

      {/* Recipient Type */}
      <div className="eb-space-y-2">
        <Label htmlFor="recipientType">Recipient Type</Label>
        <Controller
          name="recipientType"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipient type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECIPIENT">Recipient</SelectItem>
                <SelectItem value="LINKED_ACCOUNT">Linked Account</SelectItem>
                <SelectItem value="SETTLEMENT_ACCOUNT">
                  Settlement Account
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.recipientType && (
          <p className="eb-text-sm eb-text-red-500">
            {errors.recipientType.message}
          </p>
        )}
      </div>

      {/* Conditional Fields based on Party Type */}
      {partyType === 'INDIVIDUAL' && (
        <div className="eb-grid eb-grid-cols-2 eb-gap-4">
          <div className="eb-space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              {...register('firstName')}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="eb-text-sm eb-text-red-500">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div className="eb-space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              {...register('lastName')}
              placeholder="Enter last name"
            />
            {errors.lastName && (
              <p className="eb-text-sm eb-text-red-500">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>
      )}

      {partyType === 'ORGANIZATION' && (
        <div className="eb-space-y-2">
          <Label htmlFor="businessName">Business Name *</Label>
          <Input
            id="businessName"
            {...register('businessName')}
            placeholder="Enter business name"
          />
          {errors.businessName && (
            <p className="eb-text-sm eb-text-red-500">
              {errors.businessName.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
