import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Control,
  ControllerProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { IndustryTypeSelect } from '@/components/IndustryTypeSelect/IndustryTypeSelect';
import {
  Button,
  Checkbox,
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
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui';
import { InfoPopover } from '@/components/ux/InfoPopover';
import { PatternInput } from '@/components/ux/PatternInput';

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
  | 'date'
  | 'textarea'
  | 'combobox'
  | 'industrySelect'
  | 'text-with-mask';

interface BaseProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<ControllerProps<TFieldValues, TName>, 'render'> {
  control: Control<TFieldValues>;
  type?: FieldType;
  label?: string;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  visibility?: 'visible' | 'hidden' | 'disabled' | 'readonly';
  inputProps?: React.ComponentProps<typeof Input>;
  disableMapping?: boolean;
  form?: UseFormReturn<TFieldValues>;
  maskFormat?: string;
  maskChar?: string;
}

interface SelectOrRadioGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseProps<TFieldValues, TName> {
  type: 'select' | 'radio-group' | 'combobox';
  options: Array<{ label: JSX.Element | string; value: string }>;
}

interface OtherFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseProps<TFieldValues, TName> {
  type: Exclude<FieldType, 'select' | 'radio-group' | 'combobox'>;
  options?: never;
}

type OnboardingFormFieldProps<T extends FieldValues> =
  | SelectOrRadioGroupProps<T, FieldPath<T>>
  | OtherFieldProps<T, FieldPath<T>>;

export function OnboardingFormField<T extends FieldValues>({
  disableMapping,
  form,
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
  maskFormat,
  maskChar,
  inputProps,
  disabled,
}: OnboardingFormFieldProps<T>) {
  const { clientId } = useOnboardingContext();
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');
  const { getFieldRule } = useFilterFunctionsByClientContext(clientData);

  const { t } = useTranslation(['onboarding', 'common']);

  const fieldRule: FieldRule =
    name === 'product' || disableMapping
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
      disabled={fieldVisibility === 'disabled' || disabled}
      render={({ field }) => (
        <FormItem>
          {type !== 'checkbox' ? (
            <>
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
                  {tooltip ??
                    t(
                      [
                        `fields.${tName}.tooltip`,
                        '',
                      ] as unknown as TemplateStringsArray,
                      { index: lastIndex }
                    )}
                </InfoPopover>
              </div>

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
            </>
          ) : null}

          {fieldVisibility === 'readonly' ? (
            <p className="eb-font-bold">
              {(options
                ? options.find(({ value }) => value === field.value)?.label
                : field.value) ?? 'N/A'}
            </p>
          ) : (
            (() => {
              switch (type) {
                case 'industrySelect':
                  return <IndustryTypeSelect field={field} form={form} />;
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
                            <CommandEmpty>
                              {t('common:noOptionFound')}
                            </CommandEmpty>
                            <CommandGroup>
                              {options?.map((option) => (
                                <CommandItem
                                  key={`combobox-option-${option.value}`}
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
                    <Select
                      {...field}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={fieldPlaceholder} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {options?.map((option) => (
                          <SelectItem
                            key={`select-option-${option.value}`}
                            value={option.value}
                          >
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
                      <RadioGroup
                        {...field}
                        value={field.value}
                        onValueChange={field.onChange}
                        className="eb-flex eb-flex-col eb-space-y-1"
                      >
                        {options?.map((option) => (
                          <FormItem
                            className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0"
                            key={`radio-group-option-${option.value}`}
                          >
                            <FormControl>
                              <RadioGroupItem value={option.value} />
                            </FormControl>
                            <FormLabel className="eb-font-normal">
                              {option.label}
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                  );
                case 'checkbox':
                  return (
                    <div className="eb-flex eb-flex-row eb-items-start eb-space-x-3 eb-space-y-0 eb-rounded-md eb-border eb-p-4">
                      <FormControl>
                        <Checkbox
                          {...field}
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="eb-space-y-1 eb-leading-none">
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
                            {tooltip ??
                              t(
                                [
                                  `fields.${tName}.tooltip`,
                                  '',
                                ] as unknown as TemplateStringsArray,
                                { index: lastIndex }
                              )}
                          </InfoPopover>
                        </div>
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
                      </div>
                    </div>
                  );
                case 'date':
                  return (
                    <FormControl>
                      <Input
                        {...field}
                        {...inputProps}
                        type="date"
                        value={field.value}
                        placeholder={fieldPlaceholder}
                      />
                    </FormControl>
                  );
                case 'textarea':
                  return (
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value}
                        placeholder={fieldPlaceholder}
                        onChange={(e) => field.onChange(e)}
                      />
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
                case 'text-with-mask':
                  return (
                    <FormControl>
                      <PatternInput
                        {...field}
                        {...inputProps}
                        maskFormat={maskFormat}
                        maskChar={maskChar}
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

          <FormMessage />
        </FormItem>
      )}
    />
  );
}
