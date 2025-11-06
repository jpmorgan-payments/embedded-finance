import { ReactNode, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Control, FieldPath, FieldValues } from 'react-hook-form';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { US_STATE_OPTIONS } from './usStateOptions';

export interface StandardFormFieldOption {
  value: string;
  label: ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface StandardFormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  /** Form control from react-hook-form */
  control: Control<TFieldValues>;
  /** Field name */
  name: TName;
  /** Field type */
  type:
    | 'text'
    | 'email'
    | 'tel'
    | 'number'
    | 'password'
    | 'textarea'
    | 'select'
    | 'combobox'
    | 'us-state'
    | 'radio-group'
    | 'radio-group-blocks'
    | 'checkbox'
    | 'checkbox-basic';
  /** Field label */
  label?: ReactNode;
  /** Field description/helper text */
  description?: ReactNode;
  /** Placeholder text */
  placeholder?: string;
  /** Whether field is required (default: false, shows "(optional)" if false) */
  required?: boolean;
  /** Whether to show the optional label for non-required fields (default: true) */
  showOptionalLabel?: boolean;
  /** Options for select, combobox, radio-group, etc. */
  options?: StandardFormFieldOption[];
  /** Additional className for the FormItem wrapper */
  className?: string;
  /** Additional className for the input/control element */
  inputClassName?: string;
  /** Input props to pass through */
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  /** Textarea props to pass through */
  textareaProps?: React.TextareaHTMLAttributes<HTMLTextAreaElement>;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Custom icon to display in label */
  icon?: ReactNode;
  /** Text to display when no combobox options are found (default: "No option found") */
  noOptionsText?: string;
}

/**
 * ComboboxField - Internal helper component for combobox rendering
 */
interface ComboboxFieldProps {
  field: any;
  options: Array<{ label: ReactNode; value: string; disabled?: boolean }>;
  placeholder: string;
  noOptionsText: string;
  disabled: boolean;
  className?: string;
  inputClassName?: string;
  renderLabel: () => ReactNode;
  renderDescription: () => ReactNode;
}

const ComboboxField = ({
  field,
  options,
  placeholder,
  noOptionsText,
  disabled,
  className,
  inputClassName,
  renderLabel,
  renderDescription,
}: ComboboxFieldProps) => {
  const [open, setOpen] = useState(false);
  const { onBlur, ...fieldWithoutBlur } = field;

  return (
    <FormItem className={className}>
      {renderLabel()}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="input"
              size="input"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn('eb-justify-between', inputClassName)}
              {...fieldWithoutBlur}
            >
              {field.value
                ? options.find((option) => option.value === field.value)?.label
                : placeholder}
              <ChevronsUpDown className="eb-ml-2 eb-h-4 eb-w-4 eb-shrink-0 eb-opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="eb-w-[--radix-popover-trigger-width] eb-p-0">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>{noOptionsText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.label} ${option.value}`}
                    onSelect={() => {
                      field.onChange(
                        option.value === field.value ? '' : option.value
                      );
                      onBlur();
                      setOpen(false);
                    }}
                    disabled={option.disabled}
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
      {renderDescription()}
      <FormMessage />
    </FormItem>
  );
};

/**
 * StandardFormField - A generic, reusable form field component
 *
 * Designed specifically for react-hook-form with comprehensive field type support.
 * Follows OnboardingFlow design patterns but more flexible and less specialized.
 *
 * @example
 * ```tsx
 * <StandardFormField
 *   control={form.control}
 *   name="email"
 *   type="email"
 *   label="Email Address"
 *   description="We'll send you updates"
 *   required
 * />
 *
 * // With combobox (searchable dropdown)
 * <StandardFormField
 *   control={form.control}
 *   name="country"
 *   type="combobox"
 *   label="Country"
 *   options={countryOptions}
 * />
 *
 * // US State with built-in combobox
 * <StandardFormField
 *   control={form.control}
 *   name="state"
 *   type="us-state"
 *   label="State"
 *   required
 * />
 * ```
 */
export const StandardFormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  type,
  label,
  description,
  placeholder,
  required = false,
  showOptionalLabel = true,
  options = [],
  className,
  inputClassName,
  inputProps,
  textareaProps,
  disabled = false,
  icon,
  noOptionsText,
}: StandardFormFieldProps<TFieldValues, TName>) => {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // - No asterisk by default
        // - Shows "(optional)" for non-required fields
        const renderLabel = () => {
          if (!label) return null;

          const labelContent = (
            <>
              {label}
              {!required && showOptionalLabel && (
                <span className="eb-font-normal eb-text-muted-foreground">
                  {' '}
                  (optional)
                </span>
              )}
            </>
          );

          return icon ? (
            <FormLabel>
              <span className="eb-flex eb-items-center eb-gap-2">
                {icon}
                {labelContent}
              </span>
            </FormLabel>
          ) : (
            <FormLabel>{labelContent}</FormLabel>
          );
        };

        // Render description
        const renderDescription = () => {
          if (!description) return null;
          return (
            <FormDescription className="eb-text-xs eb-italic eb-text-muted-foreground">
              {description}
            </FormDescription>
          );
        };

        // Render different field types
        switch (type) {
          case 'text':
          case 'email':
          case 'tel':
          case 'number':
          case 'password':
            return (
              <FormItem className={className}>
                {renderLabel()}
                <FormControl>
                  <Input
                    {...field}
                    type={type}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={inputClassName}
                    {...inputProps}
                  />
                </FormControl>
                {renderDescription()}
                <FormMessage />
              </FormItem>
            );

          case 'textarea':
            return (
              <FormItem className={className}>
                {renderLabel()}
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={inputClassName}
                    {...textareaProps}
                  />
                </FormControl>
                {renderDescription()}
                <FormMessage />
              </FormItem>
            );

          case 'select':
            return (
              <FormItem className={className}>
                {renderLabel()}
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={disabled}
                >
                  <FormControl>
                    <SelectTrigger className={inputClassName}>
                      <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {renderDescription()}
                <FormMessage />
              </FormItem>
            );

          case 'combobox':
          case 'us-state': {
            // Use combobox for both regular combobox and us-state
            const comboboxOptions =
              type === 'us-state' ? US_STATE_OPTIONS : options;

            return (
              <ComboboxField
                field={field}
                options={comboboxOptions}
                placeholder={
                  placeholder ||
                  (type === 'us-state' ? 'Select state' : 'Select...')
                }
                noOptionsText={noOptionsText || 'No option found'}
                disabled={disabled}
                className={className}
                inputClassName={inputClassName}
                renderLabel={renderLabel}
                renderDescription={renderDescription}
              />
            );
          }

          case 'radio-group':
            return (
              <FormItem className={className}>
                {renderLabel()}
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={disabled}
                    className="eb-flex eb-flex-col eb-space-y-1"
                  >
                    {options.map((option) => (
                      <FormItem
                        key={option.value}
                        className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0"
                      >
                        <FormControl>
                          <RadioGroupItem
                            value={option.value}
                            disabled={option.disabled}
                          />
                        </FormControl>
                        <FormLabel className="eb-font-normal eb-text-foreground">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                {renderDescription()}
                <FormMessage />
              </FormItem>
            );

          case 'radio-group-blocks':
            return (
              <FormItem className={className}>
                {renderLabel()}
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={disabled}
                    className="eb-grid eb-gap-3"
                  >
                    {options.map((option) => (
                      <FormItem key={option.value}>
                        <FormLabel className="eb-flex eb-cursor-pointer eb-select-none eb-items-start eb-gap-3 eb-rounded-input eb-border eb-bg-input eb-p-6 eb-text-sm eb-font-medium eb-leading-none eb-shadow-md hover:eb-bg-accent/50 peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-50 has-[[data-state=checked]]:eb-border-primary has-[[data-state=checked]]:eb-bg-primary/5">
                          <FormControl>
                            <RadioGroupItem
                              value={option.value}
                              disabled={option.disabled}
                              className="eb-shadow-none data-[state=checked]:eb-border-primary data-[state=checked]:eb-bg-primary [&_svg]:eb-fill-white [&_svg]:eb-stroke-white"
                            />
                          </FormControl>
                          <div className="eb-grid eb-gap-1.5 eb-font-normal">
                            <div className="eb-font-normal">{option.label}</div>
                            {option.description && (
                              <FormDescription className="eb-text-xs eb-italic eb-text-muted-foreground">
                                {option.description}
                              </FormDescription>
                            )}
                          </div>
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                {renderDescription()}
                <FormMessage />
              </FormItem>
            );

          case 'checkbox':
            return (
              <FormItem className={className}>
                <div className="eb-flex eb-flex-row eb-items-start eb-space-x-3 eb-space-y-0 eb-rounded-md eb-border eb-p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                    />
                  </FormControl>
                  <div className="eb-space-y-1 eb-leading-none">
                    {renderLabel()}
                    {renderDescription()}
                    <FormMessage />
                  </div>
                </div>
              </FormItem>
            );

          case 'checkbox-basic':
            return (
              <FormItem className={className}>
                <div className="eb-flex eb-items-start eb-space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={disabled}
                      className="eb-mt-0.5"
                    />
                  </FormControl>
                  <div className="eb-space-y-1.5">
                    {renderLabel()}
                    {renderDescription()}
                    <FormMessage />
                  </div>
                </div>
              </FormItem>
            );

          default:
            return (
              <FormItem className={className}>
                {renderLabel()}
                <FormControl>
                  <Input {...field} disabled={disabled} />
                </FormControl>
                {renderDescription()}
                <FormMessage />
              </FormItem>
            );
        }
      }}
    />
  );
};

StandardFormField.displayName = 'StandardFormField';
