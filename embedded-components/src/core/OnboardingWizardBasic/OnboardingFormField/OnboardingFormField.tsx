import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  ControllerProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { PhoneInput } from '@/components/ui/phone-input';
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
import { useFormUtilsWithClientContext } from '../utils/formUtils';
import {
  FieldRule,
  OnboardingFormValuesSubmit,
  OptionalDefaults,
} from '../utils/types';

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
  | 'phone';

interface BaseProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<
    ControllerProps<TFieldValues, TName>,
    'render' | 'rules' | 'defaultValue'
  > {
  type?: FieldType;
  label?: string | JSX.Element;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  required?: boolean;
  readonly?: boolean;
  className?: string;
  inputButton?: React.ReactNode;
  disableFieldRuleMapping?: boolean;
  inputProps?: React.ComponentProps<typeof Input>;
  form?: UseFormReturn<TFieldValues, any, any>; // TODO: remove when IndustrySelect refactored
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

export function OnboardingFormField<TFieldValues extends FieldValues>({
  control,
  name,
  type = 'text',
  options,
  label,
  placeholder,
  description,
  tooltip,
  required,
  disabled,
  readonly,
  className,
  inputButton,
  disableFieldRuleMapping,
  inputProps,
  form,
  maskFormat,
  maskChar,
  shouldUnregister,
}: OnboardingFormFieldProps<TFieldValues>) {
  const { clientId } = useOnboardingContext();
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');
  const { getFieldRule } = useFormUtilsWithClientContext(clientData);

  const { t } = useTranslation(['onboarding', 'common']);

  let fieldRule: OptionalDefaults<FieldRule> = {};
  if (!disableFieldRuleMapping) {
    const fieldRuleConfig = getFieldRule(
      name as FieldPath<OnboardingFormValuesSubmit>
    );
    if (fieldRuleConfig.ruleType !== 'single') {
      throw new Error(`Field ${name} is not configured as a single field.`);
    }
    fieldRule = fieldRuleConfig.fieldRule;
  }

  const fieldRequired = required ?? fieldRule.required ?? false;
  const fieldDisplay = fieldRule.display ?? 'visible';
  const fieldInteraction =
    readonly || fieldRule.interaction === 'readonly'
      ? 'readonly'
      : disabled || fieldRule.interaction === 'disabled'
        ? 'disabled'
        : (fieldRule.interaction ?? 'enabled');

  // Split the name into a name and index for the translation function
  const nameParts = name.split('.');
  const tName = nameParts
    .filter((part) => Number.isNaN(Number(part)))
    .join('.');
  const lastIndex = nameParts
    .reverse()
    .find((part) => !Number.isNaN(Number(part)));
  const number = lastIndex ? Number(lastIndex) + 1 : undefined;

  const getContentToken = (id: string) => {
    const key = `fields.${tName}.${id}`;
    return t(
      [key, 'common:noTokenFallback'] as unknown as TemplateStringsArray,
      {
        number,
        key,
      }
    );
  };

  const fieldPlaceholder = placeholder ?? getContentToken('placeholder');

  const fieldLabel = (
    <span>
      {label ?? getContentToken('label')}
      {fieldRequired ? (
        ''
      ) : (
        <span className="eb-font-normal eb-text-muted-foreground">
          {' '}
          ({t('common:optional')})
        </span>
      )}
    </span>
  );

  const fieldTooltip = tooltip ?? getContentToken('tooltip');

  const fieldDescription = description ?? getContentToken('description');

  if (fieldDisplay === 'hidden') {
    return null;
  }

  return (
    <FormField
      control={control}
      name={name}
      disabled={fieldInteraction === 'disabled'}
      shouldUnregister={shouldUnregister}
      render={({ field }) => (
        <FormItem className={className}>
          {type !== 'checkbox' ? (
            <>
              <div className="eb-flex eb-items-center eb-space-x-2">
                <FormLabel asterisk={fieldRequired}>{fieldLabel}</FormLabel>
                <InfoPopover>{fieldTooltip}</InfoPopover>
              </div>

              <FormDescription className="eb-text-xs eb-text-gray-500">
                {fieldDescription}
              </FormDescription>
            </>
          ) : null}

          {fieldInteraction === 'readonly' ? (
            <p className="eb-font-bold">
              {(options
                ? options.find(({ value }) => value === field.value)?.label
                : field.value) ?? 'N/A'}
            </p>
          ) : (
            (() => {
              switch (type) {
                case 'phone':
                  return (
                    <FormControl>
                      <PhoneInput
                        {...field}
                        countries={['US']}
                        placeholder="Enter phone number"
                        international={false}
                        defaultCountry="US"
                      />
                    </FormControl>
                  );
                case 'industrySelect':
                  return <IndustryTypeSelect field={field} form={form} />;
                case 'combobox': {
                  const { onBlur, onChange, ...fieldWithoutBlur } = field;
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
                            {...fieldWithoutBlur}
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
                                    onChange(
                                      currentValue === field.value
                                        ? ''
                                        : currentValue
                                    );
                                    onBlur();
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
                case 'select': {
                  const { onBlur, onChange, ...fieldWithoutBlur } = field;
                  return (
                    <Select
                      onValueChange={(value) => {
                        onChange(value);
                        onBlur();
                      }}
                      value={field.value}
                    >
                      <FormControl {...fieldWithoutBlur}>
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
                }
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
                          <FormLabel asterisk={fieldRequired}>
                            {fieldLabel}
                          </FormLabel>
                          <InfoPopover>{fieldTooltip}</InfoPopover>
                        </div>
                        <FormDescription className="eb-text-xs eb-text-gray-500">
                          {fieldDescription}
                        </FormDescription>
                      </div>
                    </div>
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
                  return maskFormat ? (
                    <FormControl>
                      <div className="eb-full eb-flex eb-max-w-sm eb-items-center eb-space-x-2">
                        <PatternInput
                          {...field}
                          {...inputProps}
                          format={maskFormat ?? ''}
                          mask={maskChar}
                          type={type}
                          defaultValue={field.value}
                          value={field.value}
                          placeholder={fieldPlaceholder}
                        />
                        {inputButton}
                      </div>
                    </FormControl>
                  ) : (
                    <FormControl>
                      <div className="eb-full eb-flex eb-max-w-sm eb-items-center eb-space-x-2">
                        <Input
                          {...field}
                          {...inputProps}
                          type={type}
                          value={field.value}
                          placeholder={fieldPlaceholder}
                        />
                        {inputButton}
                      </div>
                    </FormControl>
                  );
                case 'email':
                case 'date':
                default:
                  return (
                    <FormControl>
                      <div className="eb-full eb-flex eb-max-w-sm eb-items-center eb-space-x-2">
                        <Input
                          {...field}
                          {...inputProps}
                          type={type}
                          value={field.value}
                          placeholder={fieldPlaceholder}
                        />
                        {inputButton}
                      </div>
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
