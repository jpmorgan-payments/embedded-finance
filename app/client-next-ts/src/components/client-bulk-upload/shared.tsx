import { useState, type ComponentProps, type HTMLAttributes } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Wand2,
} from 'lucide-react';

import {
  maskSensitive,
  type DetailField,
  type DetailFieldId,
} from '@/lib/client-bulk-upload/details';
import type { ClientField, PersonField } from '@/lib/client-bulk-upload/model';
import { ORGANIZATION_TYPES } from '@/lib/client-bulk-upload/schema';
import type {
  ClientValidation,
  Issue,
  IssueFix,
} from '@/lib/client-bulk-upload/validate';
import { cn } from '@/lib/utils';

export type FieldRef =
  | { scope: 'client'; field: ClientField | 'people' | DetailFieldId }
  | {
      scope: 'person';
      personIndex: number;
      field: PersonField | 'roles' | DetailFieldId;
    };

export function issuesFor(issues: Issue[], ref: FieldRef): Issue[] {
  return issues.filter((issue) => {
    if (issue.target.scope !== ref.scope || issue.target.field !== ref.field) {
      return false;
    }
    return (
      ref.scope === 'client' ||
      (issue.target.scope === 'person' &&
        issue.target.personIndex === ref.personIndex)
    );
  });
}

export function worstSeverity(issues: Issue[]): 'error' | 'warning' | null {
  if (issues.some((issue) => issue.severity === 'error')) return 'error';
  if (issues.length > 0) return 'warning';
  return null;
}

/**
 * Errors appear once a client has been edited or imported (or after a
 * download attempt). While someone is still working on a client, "missing
 * value" errors stay hidden so the row doesn't light up red mid-typing.
 */
export function visibleIssues(
  issues: Issue[],
  options: { reveal: boolean; editing: boolean }
): Issue[] {
  if (!options.reveal) return [];
  return options.editing ? issues.filter((issue) => !issue.required) : issues;
}

export const fieldStateClass = {
  error: 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-200',
  warning:
    'border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-amber-100',
  none: '',
} as const;

export function StatusIcon({
  blank,
  validation,
  showErrors,
  className,
}: {
  blank: boolean;
  validation: ClientValidation;
  showErrors: boolean;
  className?: string;
}) {
  if (blank) {
    return (
      <Circle
        className={cn('size-4 text-jpm-gray-300', className)}
        aria-label="Empty row"
      />
    );
  }
  if (validation.errorCount > 0 && showErrors) {
    return (
      <AlertCircle
        className={cn('size-4 text-red-600', className)}
        aria-label={`${validation.errorCount} problem${validation.errorCount === 1 ? '' : 's'}`}
      />
    );
  }
  if (validation.errorCount > 0) {
    return (
      <Circle
        className={cn('size-4 text-jpm-gray-400', className)}
        aria-label="In progress"
      />
    );
  }
  if (validation.warningCount > 0) {
    return (
      <AlertTriangle
        className={cn('size-4 text-amber-500', className)}
        aria-label="Check warning"
      />
    );
  }
  return (
    <CheckCircle2
      className={cn('size-4 text-emerald-600', className)}
      aria-label="Ready"
    />
  );
}

export function IssueList({
  issues,
  onFix,
  className,
}: {
  issues: Issue[];
  onFix: (fix: IssueFix) => void;
  className?: string;
}) {
  if (issues.length === 0) return null;
  return (
    <ul className={cn('space-y-1 text-xs', className)} role="list">
      {issues.map((issue, index) => (
        <li
          key={`${issue.message}-${index}`}
          className={cn(
            'flex flex-wrap items-center gap-x-2 gap-y-1',
            issue.severity === 'error' ? 'text-red-700' : 'text-amber-800'
          )}
        >
          {issue.severity === 'error' ? (
            <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
          )}
          <span>{issue.message}</span>
          {issue.fix ? (
            <button
              type="button"
              onClick={() => issue.fix && onFix(issue.fix)}
              className="inline-flex items-center gap-1 rounded border border-sp-brand/40 bg-white px-1.5 py-0.5 font-medium text-sp-brand hover:bg-sp-accent"
            >
              <Wand2 className="size-3" aria-hidden />
              Use “{issue.fix.value}”
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function OrganizationTypeSelect({
  value,
  onChange,
  className,
  ...props
}: Omit<ComponentProps<'select'>, 'onChange' | 'value'> & {
  value: string;
  onChange: (value: string) => void;
}) {
  const isKnown =
    value === '' || ORGANIZATION_TYPES.some((option) => option.value === value);
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={cn(!value && 'text-jpm-gray-400', className)}
      {...props}
    >
      <option value="">Choose…</option>
      {!isKnown ? <option value={value}>{value} (not accepted)</option> : null}
      {ORGANIZATION_TYPES.map((option) => (
        <option
          key={option.value}
          value={option.value}
          className="text-jpm-gray-900"
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function RoleCheckbox({
  checked,
  onChange,
  label,
  invalid,
  ...props
}: Omit<ComponentProps<'input'>, 'onChange' | 'type'> & {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  invalid?: boolean;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
      aria-invalid={invalid || undefined}
      className={cn(
        'size-4 cursor-pointer rounded border-jpm-gray-300 accent-sp-brand',
        invalid && 'outline outline-2 outline-offset-2 outline-red-400'
      )}
      {...props}
    />
  );
}

type DetailInputProps = Omit<
  HTMLAttributes<HTMLElement>,
  'onChange' | 'onBlur' | 'onFocus'
> & {
  field: DetailField;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

/**
 * Input for an optional detail. Select fields show their default (if any) as
 * the empty choice; sensitive values are masked unless the field has focus.
 */
export function DetailInput({
  field,
  value,
  onChange,
  className,
  onBlur,
  ...props
}: DetailInputProps) {
  const [focused, setFocused] = useState(false);

  if (field.input === 'select' && field.options) {
    const known = !value || field.options.some((o) => o.value === value);
    const defaultLabel = field.defaultValue
      ? field.options.find((o) => o.value === field.defaultValue)?.label
      : undefined;
    return (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className={cn(!value && 'text-jpm-gray-400', className)}
        {...props}
      >
        <option value="">
          {defaultLabel ? `${defaultLabel} (default)` : 'Choose…'}
        </option>
        {!known ? <option value={value}>{value} (not accepted)</option> : null}
        {field.options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="text-jpm-gray-900"
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  const masked = field.sensitive && !focused && value;
  return (
    <input
      type="text"
      value={masked ? maskSensitive(field.id, value) : value}
      placeholder={field.placeholder}
      onChange={(event) => onChange(event.target.value)}
      onFocus={(event) => {
        // Swap in the real value before React re-renders so a selection made
        // right after focus (Tab, keyboard navigation) covers the real text.
        const input = event.currentTarget;
        if (field.sensitive && input.value !== value) {
          input.value = value;
          input.select();
        }
        setFocused(true);
      }}
      onBlur={() => {
        setFocused(false);
        onBlur?.();
      }}
      autoComplete="off"
      spellCheck={false}
      data-sensitive={field.sensitive || undefined}
      title={
        field.sensitive && value
          ? 'Hidden for privacy — click to show'
          : undefined
      }
      className={className}
      {...props}
    />
  );
}
