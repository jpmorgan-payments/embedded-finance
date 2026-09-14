import type { ReactNode } from 'react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import {
  useFormContext,
  useWatch,
  type Control,
  type FieldPathByValue,
  type FieldValues,
} from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { PhoneInput } from '@/components/ui/phone-input';

import { ProfileFieldRestore } from '../forms/ProfileFieldRestore';
import {
  ProfileSelectField,
  type ProfileSelectOption,
} from '../forms/ProfileSelectField';
import type { ProfileFieldRestoreAction } from '../forms/ProfileTextField';

export function ProfilePhoneFields<TFieldValues extends FieldValues>({
  control,
  phoneTypeName,
  countryCodeName,
  phoneNumberName,
  phoneTypeLabel,
  phoneTypePlaceholder,
  phoneTypeOptions,
  phoneNumberLabel,
  phoneNumberPlaceholder,
  phoneNumberDescription,
  optionalLabel,
  required = false,
  disabled = false,
  showPhoneType = true,
  defaultPhoneType,
  restoreActions,
}: {
  control: Control<TFieldValues>;
  phoneTypeName: FieldPathByValue<TFieldValues, string>;
  countryCodeName: FieldPathByValue<TFieldValues, string>;
  phoneNumberName: FieldPathByValue<TFieldValues, string>;
  phoneTypeLabel: ReactNode;
  phoneTypePlaceholder: string;
  phoneTypeOptions: ProfileSelectOption[];
  phoneNumberLabel: ReactNode;
  phoneNumberPlaceholder?: string;
  phoneNumberDescription?: ReactNode;
  optionalLabel?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  showPhoneType?: boolean;
  defaultPhoneType?: string;
  restoreActions?: {
    phoneType?: ProfileFieldRestoreAction;
    phoneNumber?: ProfileFieldRestoreAction;
  };
}) {
  const form = useFormContext<TFieldValues>();
  const phoneType = useWatch({ control, name: phoneTypeName }) ?? '';
  const countryCode = useWatch({ control, name: countryCodeName }) ?? '';
  const nationalNumber = useWatch({ control, name: phoneNumberName }) ?? '';
  const e164Value =
    countryCode && nationalNumber ? `${countryCode}${nationalNumber}` : '';

  return (
    <div
      className={
        showPhoneType
          ? 'eb-grid eb-gap-4 @sm:eb-grid-cols-[minmax(10rem,0.8fr)_minmax(0,1.6fr)]'
          : undefined
      }
    >
      {showPhoneType ? (
        <ProfileSelectField
          control={control}
          name={phoneTypeName}
          label={phoneTypeLabel}
          options={phoneTypeOptions}
          placeholder={phoneTypePlaceholder}
          optionalLabel={optionalLabel}
          required={required}
          disabled={disabled}
          restoreAction={restoreActions?.phoneType}
        />
      ) : null}
      <FormField
        control={control}
        name={phoneNumberName}
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {phoneNumberLabel}
              {!required && optionalLabel ? (
                <span className="eb-font-normal eb-text-muted-foreground">
                  {' '}
                  ({optionalLabel})
                </span>
              ) : null}
            </FormLabel>
            <FormControl>
              <PhoneInput
                ref={field.ref}
                name={field.name}
                value={e164Value}
                countries={['US', 'CA']}
                international={false}
                defaultCountry="US"
                placeholder={phoneNumberPlaceholder}
                disabled={disabled}
                data-dtrum-tracking={field.name}
                onBlur={field.onBlur}
                onChange={(value) => {
                  const phoneValue = String(value ?? '');
                  if (phoneValue && !phoneType && defaultPhoneType) {
                    form.setValue(phoneTypeName, defaultPhoneType as never, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  } else if (
                    !phoneValue &&
                    !showPhoneType &&
                    phoneType === defaultPhoneType
                  ) {
                    form.setValue(phoneTypeName, '' as never, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }
                  const parsedPhone = phoneValue
                    ? parsePhoneNumberFromString(phoneValue)
                    : undefined;
                  const nextCountryCode = parsedPhone?.countryCallingCode
                    ? `+${parsedPhone.countryCallingCode}`
                    : phoneValue.startsWith('+1')
                      ? '+1'
                      : '';
                  const nextNationalNumber =
                    parsedPhone?.nationalNumber ??
                    (nextCountryCode
                      ? phoneValue.slice(nextCountryCode.length)
                      : phoneValue
                    ).replace(/\D/g, '');
                  form.setValue(countryCodeName, nextCountryCode as never, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  field.onChange(nextNationalNumber);
                }}
              />
            </FormControl>
            {phoneNumberDescription ? (
              <FormDescription className="eb-text-xs">
                {phoneNumberDescription}
              </FormDescription>
            ) : null}
            {restoreActions?.phoneNumber ? (
              <ProfileFieldRestore action={restoreActions.phoneNumber} />
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
