import React from 'react';
import { Phone, Plus, Trash2 } from 'lucide-react';
import { Controller, useFieldArray } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { ContactsSectionProps } from './RecipientForm.types';

export const ContactsSection: React.FC<ContactsSectionProps> = ({
  control,
  register,
  errors,
  watch,
}) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'contacts',
  });

  const addContact = () => {
    append({ contactType: 'EMAIL', value: '', countryCode: '' });
  };

  return (
    <div className="eb-space-y-4">
      <div className="eb-flex eb-items-center eb-justify-between">
        <div className="eb-flex eb-items-center eb-gap-2">
          <Phone className="eb-h-4 eb-w-4" />
          <Label className="eb-text-base eb-font-medium">
            Contact Information
          </Label>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addContact}
          className="eb-flex eb-items-center eb-gap-2"
        >
          <Plus className="eb-h-3 eb-w-3" />
          Add Contact
        </Button>
      </div>

      <div className="eb-space-y-3">
        {fields.map((field, index) => {
          const contactType = watch(`contacts.${index}.contactType`);
          const isPhoneContact = contactType === 'PHONE';

          return (
            <div key={field.id} className="eb-space-y-2">
              {/* Contact Fields Row */}
              <div className="eb-flex eb-items-end eb-gap-3 eb-rounded-md eb-border eb-p-3">
                {/* Contact Type */}
                <div className="eb-w-32 eb-space-y-1">
                  <Label className="eb-text-sm">Type</Label>
                  <Controller
                    name={`contacts.${index}.contactType`}
                    control={control}
                    render={({ field: contactTypeField }) => (
                      <Select
                        value={contactTypeField.value}
                        onValueChange={contactTypeField.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="PHONE">Phone</SelectItem>
                          <SelectItem value="WEBSITE">Website</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Country Code - only for phone contacts */}
                {isPhoneContact && (
                  <div className="eb-w-20 eb-space-y-1">
                    <Label className="eb-text-sm">Country</Label>
                    <Input
                      {...register(`contacts.${index}.countryCode`)}
                      placeholder="+1"
                      className="eb-text-center"
                    />
                  </div>
                )}

                {/* Contact Value */}
                <div className="eb-flex-1 eb-space-y-1">
                  <Label className="eb-text-sm">
                    {contactType === 'EMAIL'
                      ? 'Email Address'
                      : contactType === 'PHONE'
                        ? 'Phone Number'
                        : 'Website URL'}
                  </Label>
                  <Input
                    {...register(`contacts.${index}.value`)}
                    placeholder={
                      contactType === 'EMAIL'
                        ? 'user@example.com'
                        : contactType === 'PHONE'
                          ? '6316215110'
                          : 'https://example.com'
                    }
                  />
                </div>

                {/* Remove Contact Button */}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                    className="eb-text-red-500 hover:eb-text-red-700"
                  >
                    <Trash2 className="eb-h-3 eb-w-3" />
                  </Button>
                )}
              </div>

              {/* Error Messages Row */}
              <div className="eb-ml-3 eb-space-y-1">
                {errors.contacts?.[index]?.value && (
                  <p className="eb-text-xs eb-text-red-500">
                    {contactType === 'EMAIL'
                      ? 'Email: '
                      : contactType === 'PHONE'
                        ? 'Phone: '
                        : 'Website: '}
                    {errors.contacts[index].value.message}
                  </p>
                )}
                {errors.contacts?.[index]?.countryCode && (
                  <p className="eb-text-xs eb-text-red-500">
                    Country Code: {errors.contacts[index].countryCode.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {errors.contacts && (
        <p className="eb-text-sm eb-text-red-500">{errors.contacts.message}</p>
      )}
    </div>
  );
};
