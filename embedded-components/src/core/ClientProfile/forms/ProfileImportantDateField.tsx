import type { ReactNode } from 'react';
import {
  useFormContext,
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
import { ImportantDateSelector } from '@/components/ImportantDateSelector';

import { ProfileFieldRestore } from './ProfileFieldRestore';
import type { ProfileFieldRestoreAction } from './ProfileTextField';

const parseIsoDate = (value: string | undefined) =>
  value ? new Date(`${value}T12:00:00`) : undefined;

const formatLocalIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

export function ProfileImportantDateField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  required = false,
  optionalLabel,
  disabled = false,
  restoreAction,
}: {
  control: Control<TFieldValues>;
  name: FieldPathByValue<TFieldValues, string>;
  label: ReactNode;
  description?: ReactNode;
  required?: boolean;
  optionalLabel?: ReactNode;
  disabled?: boolean;
  restoreAction?: ProfileFieldRestoreAction;
}) {
  const form = useFormContext<TFieldValues>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
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
            <ImportantDateSelector
              ref={field.ref}
              format="MDY"
              aria-label={typeof label === 'string' ? label : undefined}
              value={parseIsoDate(field.value)}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              onBlur={field.onBlur}
              onChange={(date, errorMessage) => {
                if (errorMessage) {
                  field.onChange('');
                  window.setTimeout(() => {
                    form.setError(name, {
                      type: 'manual',
                      message: errorMessage,
                    });
                  }, 0);
                  return;
                }
                form.clearErrors(name);
                field.onChange(date ? formatLocalIsoDate(date) : '');
              }}
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
