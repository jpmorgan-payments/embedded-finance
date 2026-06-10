'use client';

import { useMemo } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

import {
  formatFlexibleJsonSuccess,
  parseFlexibleJsonObject,
} from '@/components/test-scenario/parse-flexible-json';
import type { JsonValidationResult } from '@/components/test-scenario/test-scenario-mock-json-validation';
import { cn } from '@/lib/utils';

type TestScenarioJsonFieldProps = {
  id: string;
  label: string;
  description?: string;
  value: string;
  onChange: (value: string, parsed: Record<string, unknown> | null) => void;
  onValidationChange?: (result: JsonValidationResult | null) => void;
  validate?: (parsed: Record<string, unknown>) => JsonValidationResult;
  /** When true, an empty textarea skips validation (no error, no success). */
  optional?: boolean;
  placeholder?: string;
  minRows?: number;
  className?: string;
};

function evaluateValue(
  value: string,
  options?: {
    optional?: boolean;
    validate?: (parsed: Record<string, unknown>) => JsonValidationResult;
  }
): JsonValidationResult | null {
  if (options?.optional && !value.trim()) {
    return null;
  }

  const parseResult = parseFlexibleJsonObject(value);
  if (!parseResult.ok) {
    return {
      valid: false,
      message: parseResult.hint
        ? `${parseResult.error} ${parseResult.hint}`
        : parseResult.error,
      level: 'error',
    };
  }

  if (options?.validate) {
    return options.validate(parseResult.parsed);
  }

  return {
    valid: true,
    message: formatFlexibleJsonSuccess(parseResult.format),
    level: 'success',
  };
}

export function TestScenarioJsonField({
  id,
  label,
  description,
  value,
  onChange,
  onValidationChange,
  validate,
  optional = false,
  placeholder = '{}',
  minRows = 6,
  className,
}: TestScenarioJsonFieldProps) {
  const validation = useMemo(
    () => evaluateValue(value, { optional, validate }),
    [value, optional, validate]
  );

  const handleChange = (next: string) => {
    const isEmptyOptional = optional && !next.trim();
    const parseResult = isEmptyOptional
      ? null
      : parseFlexibleJsonObject(next);
    onChange(
      next,
      parseResult && parseResult.ok ? parseResult.parsed : null
    );
    onValidationChange?.(evaluateValue(next, { optional, validate }));
  };

  const borderClass =
    validation?.level === 'error'
      ? 'border-red-300 focus-visible:ring-red-200'
      : validation?.level === 'warning'
        ? 'border-amber-300 focus-visible:ring-amber-200'
        : validation?.level === 'success'
          ? 'border-emerald-300 focus-visible:ring-emerald-200'
          : 'border-neutral-300';

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className="text-sm font-medium text-neutral-900">
        {label}
      </label>
      {description ? (
        <p className="whitespace-pre-line text-xs leading-relaxed text-neutral-500">
          {description}
        </p>
      ) : null}
      <p className="text-xs text-neutral-400">
        Accepts strict JSON or TS/JS object literals (unquoted keys, single
        quotes, trailing commas, comments).
      </p>
      <textarea
        id={id}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        rows={minRows}
        spellCheck={false}
        className={cn(
          'w-full rounded-md border bg-white px-3 py-2 font-mono text-xs text-neutral-900 outline-none focus-visible:ring-2',
          borderClass
        )}
      />
      {validation ? (
        <div
          className={cn(
            'flex items-start gap-1.5 text-xs leading-relaxed',
            validation.level === 'error' && 'text-red-600',
            validation.level === 'warning' && 'text-amber-700',
            validation.level === 'success' && 'text-emerald-700'
          )}
        >
          {validation.level === 'error' ? (
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span className="min-w-0 break-words">{validation.message}</span>
        </div>
      ) : null}
    </div>
  );
}
