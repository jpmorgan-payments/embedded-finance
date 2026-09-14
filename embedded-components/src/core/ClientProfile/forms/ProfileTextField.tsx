import type { ReactNode } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import { PatternInput } from '@/components/PatternInput';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/components/ui';

import { ProfileFieldRestore } from './ProfileFieldRestore';
import { ProfileReadonlyValue } from './ProfileReadonlyValue';

type ProfileTextFieldProps<
  TFieldValues extends FieldValues,
  TFieldName extends FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TFieldName;
  label: ReactNode;
  placeholder?: string;
  description?: ReactNode;
  optionalLabel?: ReactNode;
  required?: boolean;
  readonly?: boolean;
  className?: string;
  inputType?: React.HTMLInputTypeAttribute;
  inputProps?: Omit<
    React.ComponentProps<typeof Input>,
    'defaultValue' | 'name' | 'value' | 'type'
  >;
  maskFormat?: string;
  maskChar?: string;
  obfuscateWhenUnfocused?: boolean;
  restoreAction?: ProfileFieldRestoreAction;
};

export type ProfileFieldRestoreAction = {
  originalValue: ReactNode;
  label: ReactNode;
  onClick: () => void;
};

export function ProfileTextField<
  TFieldValues extends FieldValues,
  TFieldName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder,
  description,
  optionalLabel,
  required = false,
  readonly = false,
  className,
  inputType = 'text',
  inputProps,
  maskFormat,
  maskChar,
  obfuscateWhenUnfocused = false,
  restoreAction,
}: ProfileTextFieldProps<TFieldValues, TFieldName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
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
            <ProfileReadonlyValue value={field.value} />
          ) : (
            <FormControl>
              {maskFormat ? (
                <PatternInput
                  {...field}
                  {...inputProps}
                  value={field.value ?? ''}
                  format={maskFormat}
                  mask={maskChar}
                  obfuscateWhenUnfocused={obfuscateWhenUnfocused}
                  placeholder={placeholder}
                  data-dtrum-tracking={field.name}
                />
              ) : (
                <Input
                  {...field}
                  {...inputProps}
                  type={inputType}
                  value={field.value ?? ''}
                  placeholder={placeholder}
                  data-dtrum-tracking={field.name}
                />
              )}
            </FormControl>
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
      )}
    />
  );
}
