import { useState, type ReactNode } from 'react';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { cn } from '@/lib/utils';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

import { ProfileFieldRestore } from './ProfileFieldRestore';
import { ProfileReadonlyValue } from './ProfileReadonlyValue';
import type { ProfileFieldRestoreAction } from './ProfileTextField';

export type ProfileSelectOption = {
  value: string;
  label: ReactNode;
  searchValue?: string;
  disabled?: boolean;
};

type ProfileSelectFieldProps<
  TFieldValues extends FieldValues,
  TFieldName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TFieldName;
  label: ReactNode;
  options: ProfileSelectOption[];
  placeholder: string;
  description?: ReactNode;
  optionalLabel?: ReactNode;
  searchPlaceholder?: string;
  noResultsLabel?: string;
  required?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  className?: string;
  onValueChange?: (value: string) => void;
  restoreAction?: ProfileFieldRestoreAction;
};

export function ProfileSelectField<
  TFieldValues extends FieldValues,
  TFieldName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  options,
  placeholder,
  description,
  optionalLabel,
  searchPlaceholder = placeholder,
  noResultsLabel = 'No results found.',
  required = false,
  searchable = false,
  disabled = false,
  readonly = false,
  className,
  onValueChange,
  restoreAction,
}: ProfileSelectFieldProps<TFieldValues, TFieldName>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selectedOption = options.find(
          (option) => option.value === field.value
        );
        const selectValue = (value: string) => {
          field.onChange(value);
          onValueChange?.(value);
        };

        return (
          <FormItem className={className}>
            <FormLabel>
              {label}
              {!required && optionalLabel ? (
                <span className="eb-font-normal eb-text-muted-foreground">
                  {' '}
                  ({optionalLabel})
                </span>
              ) : null}
            </FormLabel>
            {readonly ? (
              <ProfileReadonlyValue
                value={selectedOption?.label ?? field.value}
              />
            ) : searchable ? (
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={isOpen}
                      disabled={disabled}
                      className={cn(
                        'eb-h-10 eb-w-full eb-justify-between eb-bg-input eb-px-3 eb-font-normal',
                        !selectedOption && 'eb-text-muted-foreground'
                      )}
                    >
                      <span className="eb-truncate">
                        {selectedOption?.label ?? placeholder}
                      </span>
                      <ChevronsUpDownIcon className="eb-size-4 eb-shrink-0 eb-opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="eb-w-[var(--radix-popover-trigger-width)] eb-p-0"
                >
                  <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                      <CommandEmpty>{noResultsLabel}</CommandEmpty>
                      <CommandGroup>
                        {options.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.searchValue ?? option.value}
                            disabled={option.disabled}
                            onSelect={() => {
                              selectValue(option.value);
                              setIsOpen(false);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                'eb-mr-2 eb-size-4',
                                option.value === field.value
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
            ) : (
              <Select
                value={field.value ?? ''}
                onValueChange={selectValue}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
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
            )}
            {description ? (
              <FormDescription className="eb-text-xs">
                {description}
              </FormDescription>
            ) : null}
            {!readonly && restoreAction ? (
              <ProfileFieldRestore action={restoreAction} />
            ) : null}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
