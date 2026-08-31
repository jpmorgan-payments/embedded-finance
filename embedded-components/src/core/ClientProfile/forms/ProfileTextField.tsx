import type { ReactNode } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@/components/ui';

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
  className?: string;
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
  className,
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
          <FormControl>
            <Input
              {...field}
              type="text"
              value={field.value ?? ''}
              placeholder={placeholder}
              data-dtrum-tracking={field.name}
            />
          </FormControl>
          {description ? (
            <FormDescription className="eb-text-xs eb-italic">
              {description}
            </FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
