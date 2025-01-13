import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { InfoPopover } from '@/components/ux/InfoPopover';

import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { useFilterFunctionsByClientContext } from '../utils/formUtils';
import { FieldRule, OnboardingWizardFormValues } from '../utils/types';

type FieldType =
  | 'text'
  | 'email'
  | 'select'
  | 'radio-group'
  | 'checkbox'
  | 'array'
  | 'combobox';

interface BaseProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  type: FieldType;
  label?: string;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  visibility?: 'visible' | 'hidden' | 'disabled' | 'readonly';
  inputProps?: React.ComponentProps<typeof Input>;
}

interface SelectOrRadioGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseProps<TFieldValues, TName> {
  type: 'select' | 'radio-group' | 'combobox';
  options: Array<{ label: string; value: string }>;
}

interface OtherFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseProps<TFieldValues, TName> {
  type: Exclude<FieldType, 'select' | 'radio-group' | 'combobox'>;
  options?: never;
}

type OnboardingFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> =
  | SelectOrRadioGroupProps<TFieldValues, TName>
  | OtherFieldProps<TFieldValues, TName>;

export const OnboardingFormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  type = 'text',
  label,
  placeholder,
  description,
  tooltip,
  required,
  visibility,
  options,
  inputProps,
  ...props
}: OnboardingFormFieldProps<TFieldValues, TName>) => {
  const { clientId } = useOnboardingContext();
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');
  const { getFieldRule } = useFilterFunctionsByClientContext(clientData);

  const { t } = useTranslation('onboarding');

  const fieldRule: FieldRule =
    name === 'product'
      ? { visibility: 'visible', required: true }
      : getFieldRule(name.split('.')[0] as keyof OnboardingWizardFormValues);

  const fieldVisibility = visibility ?? fieldRule.visibility;

  if (fieldVisibility === 'hidden') {
    return null;
  }

  // Split the name into a name and index for the translation function
  const nameParts = name.split('.');
  const tName = nameParts
    .filter((part) => Number.isNaN(Number(part)))
    .join('.');
  const lastIndex = nameParts
    .reverse()
    .find((part) => !Number.isNaN(Number(part)));

  const fieldPlaceholder =
    placeholder ??
    t([`fields.${tName}.placeholder`, ''] as unknown as TemplateStringsArray, {
      index: lastIndex,
    });

  return (
    <FormField
      control={control}
      name={name}
      disabled={fieldVisibility === 'disabled'}
      render={({ field }) => (
        <FormItem>
          <div className="eb-flex eb-items-center eb-space-x-2">
            <FormLabel asterisk={required ?? fieldRule.required}>
              {label ??
                t(
                  [
                    `fields.${tName}.label`,
                    '',
                  ] as unknown as TemplateStringsArray,
                  { index: lastIndex }
                )}
            </FormLabel>
            <InfoPopover>
              <div className="eb-text-sm">
                {tooltip ??
                  t(
                    [
                      `fields.${tName}.tooltip`,
                      '',
                    ] as unknown as TemplateStringsArray,
                    { index: lastIndex }
                  )}
              </div>
            </InfoPopover>
          </div>

          {fieldVisibility === 'readonly' ? (
            <p className="eb-font-bold">
              {(options
                ? options.find(({ value }) => value === field.value)?.label
                : field.value) ?? 'N/A'}
            </p>
          ) : (
            (() => {
              switch (type) {
                case 'combobox': {
                  const [open, setOpen] = useState(false);
                  return (
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="eb-w-full eb-justify-between eb-font-normal"
                          >
                            {field.value
                              ? options?.find(
                                  (option) => option.value === field.value
                                )?.label
                              : fieldPlaceholder}
                            <ChevronsUpDown className="eb-ml-2 eb-h-4 eb-w-4 eb-shrink-0 eb-opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="eb-w-[--radix-popover-trigger-width] eb-p-0">
                        <Command>
                          <CommandInput placeholder={fieldPlaceholder} />
                          <CommandList>
                            <CommandEmpty>No option found.</CommandEmpty>
                            <CommandGroup>
                              {options?.map((option) => (
                                <CommandItem
                                  key={option.value}
                                  value={option.value}
                                  onSelect={(currentValue) => {
                                    field.onChange(
                                      currentValue === field.value
                                        ? ''
                                        : currentValue
                                    );
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'eb-mr-2 eb-h-4 eb-w-4',
                                      field.value === option.value
                                        ? 'eb-opacity-100'
                                        : 'eb-opacity-0'
                                    )}
                                  />
                                  {option.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  );
                }
                case 'select':
                  return (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger ref={field.ref}>
                          <SelectValue placeholder={fieldPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  );
                case 'email':
                  return (
                    <FormControl>
                      <Input
                        {...field}
                        {...inputProps}
                        type="email"
                        value={field.value}
                        placeholder={fieldPlaceholder}
                      />
                    </FormControl>
                  );
                case 'radio-group':
                  return (
                    <FormControl>
                      <div className="eb-flex eb-flex-col eb-space-y-2">
                        {options?.map((option) => (
                          <label
                            key={option.value}
                            className="eb-flex eb-items-center eb-space-x-2"
                          >
                            <input
                              type="radio"
                              {...field}
                              value={option.value}
                              checked={field.value === option.value}
                              className="eb-h-4 eb-w-4"
                            />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                  );
                case 'checkbox':
                  return (
                    <FormControl>
                      <div className="eb-flex eb-items-center eb-space-x-2">
                        <input
                          type="checkbox"
                          {...field}
                          checked={field.value}
                          className="eb-h-4 eb-w-4"
                        />
                        <span>{fieldPlaceholder}</span>
                      </div>
                    </FormControl>
                  );
                case 'text':
                  return (
                    <FormControl>
                      <Input
                        {...field}
                        {...inputProps}
                        type="text"
                        value={field.value}
                        placeholder={fieldPlaceholder}
                      />
                    </FormControl>
                  );
                default:
                  return (
                    <FormControl>
                      <Input
                        {...field}
                        {...inputProps}
                        type="text"
                        value={field.value}
                        placeholder={fieldPlaceholder}
                      />
                    </FormControl>
                  );
              }
            })()
          )}
          <FormDescription className="eb-text-xs eb-text-gray-500">
            {description ??
              t(
                [
                  `fields.${tName}.description`,
                  '',
                ] as unknown as TemplateStringsArray,
                { index: lastIndex }
              )}
          </FormDescription>

          <FormMessage />
        </FormItem>
      )}
      {...props}
    />
  );
};
