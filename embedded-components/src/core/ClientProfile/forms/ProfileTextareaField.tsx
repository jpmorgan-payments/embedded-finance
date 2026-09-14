import type { ReactNode } from 'react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Textarea,
} from '@/components/ui';

import { ProfileFieldRestore } from './ProfileFieldRestore';
import type { ProfileFieldRestoreAction } from './ProfileTextField';

export function ProfileTextareaField<
  TFieldValues extends FieldValues,
  TFieldName extends FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  placeholder,
  description,
  required = false,
  rows = 5,
  maxLength,
  restoreAction,
}: {
  control: Control<TFieldValues>;
  name: TFieldName;
  label: ReactNode;
  placeholder?: string;
  description?: ReactNode;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  restoreAction?: ProfileFieldRestoreAction;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              {...field}
              value={field.value ?? ''}
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
              aria-required={required}
              data-dtrum-tracking={field.name}
            />
          </FormControl>
          {description ? (
            <FormDescription className="eb-text-xs">
              {description}
            </FormDescription>
          ) : null}
          {restoreAction ? (
            <ProfileFieldRestore action={restoreAction} />
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
