import { useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  ControllerProps,
  FieldPath,
  FieldValues,
  useFormContext,
} from 'react-hook-form';

import { cn } from '@/lib/utils';
import { PhoneInput } from '@/components/ui/phone-input';
import { InfoPopover } from '@/components/LearnMorePopover';
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
import { ImportantDateSelector } from '@/components/ux/ImportantDateSelector/ImportantDateSelector';
import { PatternInput } from '@/components/ux/PatternInput';
import { IndustryTypeSelect } from '@/core/OnboardingFlow/components/IndustryTypeSelect/IndustryTypeSelect';
import { useOnboardingContext } from '@/core/OnboardingFlow/contexts/OnboardingContext';
import {
  FieldRule,
  OnboardingFormValuesSubmit,
  OptionalDefaults,
} from '@/core/OnboardingFlow/types/form.types';
import { useFormUtilsWithClientContext } from '@/core/OnboardingFlow/utils/formUtils';

type FieldType =
  | 'text'
  | 'email'
  | 'select'
  | 'radio-group'
  | 'radio-group-blocks'
  | 'checkbox'
  | 'checkbox-basic'
  | 'array'
  | 'date'
  | 'textarea'
  | 'combobox'
  | 'industrySelect'
  | 'phone'
  | 'importantDate';

interface BaseProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<
    ControllerProps<TFieldValues, TName>,
    'render' | 'rules' | 'defaultValue'
  > {
  type?: FieldType;
  label?: string | React.ReactNode;
  placeholder?: string;
  description?: string;
  tooltip?: string | React.ReactNode;
  required?: boolean;
  readonly?: boolean;
  className?: string;
  inputButton?: React.ReactNode;
  noOptionalLabel?: boolean;
  disableFieldRuleMapping?: boolean;
  inputProps?: React.ComponentProps<typeof Input>;
  maskFormat?: string;
  maskChar?: string;
  valueOverride?: string;
  onChange?: (...value: any[]) => void;
  labelClassName?: string;
  popoutTooltip?: boolean;
}

interface SelectOrRadioGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends BaseProps<TFieldValues, TName> {
  type: 'select' | 'radio-group' | 'radio-group-blocks' | 'combobox';
  options: Array<{
    label: React.ReactNode | string;
    value: string;
    description?: string;
  }>;
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
  noOptionalLabel,
  disableFieldRuleMapping,
  inputProps,
  maskFormat,
  maskChar,
  shouldUnregister,
  valueOverride,
  onChange: onChangeProp,
  labelClassName,
  popoutTooltip = false,
}: OnboardingFormFieldProps<TFieldValues>) {
  const form = useFormContext();
  const { clientData, organizationType } = useOnboardingContext();
  const { getFieldRule } = useFormUtilsWithClientContext(clientData);

  const { t } = useTranslation(['onboarding', 'onboarding-overview', 'common']);

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
    // TODO: need to add shared tokens
    const key = `fields.${tName}.${id}`;
    const stepperFlowKey = `onboarding:${key}`;
    const overviewFlowKey = `onboarding-overview:${key}`;
    const overviewFlowKeyWithOrgType = `onboarding-overview:${key}.${organizationType}`;
    return t(
      [
        overviewFlowKeyWithOrgType,
        overviewFlowKey,
        stepperFlowKey,
        'common:noTokenFallback',
      ] as unknown as TemplateStringsArray,
      {
        number,
        key,
      }
    );
  };

  const fieldPlaceholder = placeholder ?? getContentToken('placeholder');

  const fieldLabel = (
    <>
      {label ?? getContentToken('label')}
      {fieldRequired || noOptionalLabel ? (
        ''
      ) : (
        <span className="eb-font-normal eb-text-muted-foreground">
          {' '}
          ({t('common:optional')})
        </span>
      )}
    </>
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
      render={({ field }) => {
        const { onBlur, ...fieldWithoutBlur } = field;
        const [open, setOpen] = useState(false);

        return (
          <FormItem className={className}>
            {type !== 'checkbox' && type !== 'checkbox-basic' ? (
              <>
                <div className="eb-flex eb-items-center eb-space-x-2">
                  <FormLabel className={labelClassName}>{fieldLabel}</FormLabel>
                  <InfoPopover popoutTooltip={popoutTooltip}>
                    {fieldTooltip}
                  </InfoPopover>
                </div>
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
                          data-dtrum-tracking={field.name}
                          onChange={(value) => {
                            onChangeProp?.(value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                    );
                  case 'industrySelect':
                    return (
                      <IndustryTypeSelect
                        field={field}
                        data-dtrum-tracking={field.name}
                        placeholder={fieldPlaceholder}
                        onChange={(value) => {
                          onChangeProp?.(value);
                          field.onChange(value);
                          field.onBlur();
                        }}
                      />
                    );
                  case 'combobox':
                    return (
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="input"
                              size="input"
                              role="combobox"
                              aria-expanded={open}
                              className="eb-justify-between"
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
                                    value={`${option.label} ${option.value}`}
                                    onSelect={() => {
                                      onChangeProp?.(option.value);
                                      field.onChange(
                                        option.value === field.value
                                          ? ''
                                          : option.value
                                      );
                                      onBlur();
                                      setOpen(false);
                                    }}
                                    className="eb-cursor-pointer"
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
                  case 'select':
                    return (
                      <Select
                        onValueChange={(value) => {
                          onChangeProp?.(value);
                          field.onChange(value);
                          onBlur();
                        }}
                        value={field.value}
                        data-dtrum-tracking={field.name}
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
                  case 'radio-group':
                    return (
                      <FormControl>
                        <RadioGroup
                          {...field}
                          value={field.value}
                          onValueChange={(value) => {
                            onChangeProp?.(value);
                            field.onChange(value);
                            onBlur();
                          }}
                          className="eb-flex eb-flex-col eb-space-y-1"
                          data-dtrum-tracking={field.name}
                        >
                          {options?.map((option) => (
                            <FormItem
                              className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0"
                              key={`radio-group-option-${option.value}`}
                            >
                              <FormControl>
                                <RadioGroupItem value={option.value} />
                              </FormControl>
                              <FormLabel className="eb-font-normal eb-text-foreground">
                                {option.label}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                    );
                  case 'radio-group-blocks':
                    return (
                      <FormControl>
                        <RadioGroup
                          {...field}
                          value={field.value}
                          onValueChange={(value) => {
                            onChangeProp?.(value);
                            field.onChange(value);
                            onBlur();
                          }}
                          className="eb-grid eb-gap-3"
                          data-dtrum-tracking={field.name}
                        >
                          {options?.map((option) => (
                            <FormItem
                              key={`radio-group-option-${option.value}`}
                            >
                              <FormLabel className="eb-flex eb-cursor-pointer eb-select-none eb-items-start eb-gap-3 eb-rounded-input eb-border eb-bg-input eb-p-6 eb-text-sm eb-font-medium eb-leading-none eb-shadow-md hover:eb-bg-accent/50 peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-50 has-[[data-state=checked]]:eb-border-primary has-[[data-state=checked]]:eb-bg-primary/5">
                                <FormControl>
                                  <RadioGroupItem
                                    value={option.value}
                                    className="eb-shadow-none data-[state=checked]:eb-border-primary data-[state=checked]:eb-bg-primary [&_svg]:eb-fill-white [&_svg]:eb-stroke-white"
                                  />
                                </FormControl>
                                <div className="eb-grid eb-gap-1.5 eb-font-normal">
                                  <div className="eb-font-normal">
                                    {option.label}
                                  </div>
                                  <FormDescription className="eb-text-xs">
                                    {option.description}
                                  </FormDescription>
                                </div>
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
                            onCheckedChange={(checked) => {
                              onChangeProp?.(checked);
                              field.onChange(checked);
                            }}
                            data-dtrum-tracking={field.name}
                          />
                        </FormControl>
                        <div className="eb-space-y-1 eb-leading-none">
                          <div className="eb-flex eb-items-center eb-space-x-2">
                            <FormLabel className="eb-text-foreground">
                              {fieldLabel}
                            </FormLabel>
                            <InfoPopover popoutTooltip={popoutTooltip}>
                              {fieldTooltip}
                            </InfoPopover>
                          </div>
                          <FormDescription className="eb-text-xs eb-text-gray-500">
                            {fieldDescription}
                          </FormDescription>
                        </div>
                      </div>
                    );
                  case 'checkbox-basic':
                    return (
                      <div className="eb-flex eb-items-center eb-space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              onChangeProp?.(checked);
                              field.onChange(checked);
                            }}
                          />
                        </FormControl>
                        <div className="eb-flex eb-items-center eb-space-x-2">
                          <FormLabel className="eb-text-sm eb-leading-none eb-text-foreground peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                            {fieldLabel}
                          </FormLabel>
                          <InfoPopover popoutTooltip={popoutTooltip}>
                            {fieldTooltip}
                          </InfoPopover>
                        </div>
                      </div>
                    );
                  case 'textarea':
                    return (
                      <FormControl>
                        <Textarea
                          {...field}
                          value={valueOverride ?? field.value}
                          placeholder={fieldPlaceholder}
                          onChange={(e) => {
                            onChangeProp?.(e.target.value);
                            field.onChange(e);
                          }}
                        />
                      </FormControl>
                    );
                  case 'text':
                    return maskFormat ? (
                      <div className="eb-full eb-flex eb-items-center eb-space-x-2">
                        <FormControl>
                          <PatternInput
                            {...field}
                            {...inputProps}
                            format={maskFormat ?? ''}
                            mask={maskChar}
                            type={type}
                            defaultValue={field.value}
                            value={valueOverride ?? field.value}
                            placeholder={fieldPlaceholder}
                            onChange={(e) => {
                              onChangeProp?.(e.target.value);
                              field.onChange(e);
                            }}
                          />
                        </FormControl>
                        {inputButton}
                      </div>
                    ) : (
                      <div className="eb-full eb-flex eb-items-center eb-space-x-2">
                        <FormControl>
                          <Input
                            {...field}
                            {...inputProps}
                            type={type}
                            value={valueOverride ?? field.value}
                            placeholder={fieldPlaceholder}
                            data-dtrum-tracking={field.name}
                            onChange={(e) => {
                              onChangeProp?.(e.target.value);
                              field.onChange(e);
                            }}
                          />
                        </FormControl>
                        {inputButton}
                      </div>
                    );
                  case 'importantDate':
                    return (
                      <FormControl>
                        <ImportantDateSelector
                          {...field}
                          format="MDY"
                          value={
                            field.value
                              ? new Date(`${field.value}T12:00:00Z`)
                              : undefined
                          }
                          onChange={async (date, errorMsg) => {
                            if (errorMsg && form) {
                              onChangeProp?.('');
                              field.onChange('');
                              form.setError(field.name, {
                                type: 'manual',
                                message: errorMsg,
                              });
                              await form.trigger(field.name);
                            } else {
                              form?.clearErrors(field.name);
                              onChangeProp?.(date?.toISOString().split('T')[0]);
                              field.onChange(date?.toISOString().split('T')[0]);
                            }
                            onBlur();
                          }}
                          data-dtrum-tracking={field.name}
                        />
                      </FormControl>
                    );
                  case 'email':
                  case 'date':
                  default:
                    return (
                      <div className="eb-full eb-flex eb-items-center eb-space-x-2">
                        <FormControl>
                          <Input
                            {...field}
                            {...inputProps}
                            type={type}
                            value={field.value}
                            placeholder={fieldPlaceholder}
                            data-dtrum-tracking={field.name}
                          />
                        </FormControl>
                        {inputButton}
                      </div>
                    );
                }
              })()
            )}

            {fieldDescription && type !== 'checkbox' && (
              <FormDescription className="eb-text-xs eb-italic eb-text-muted-foreground">
                {fieldDescription}
              </FormDescription>
            )}

            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
