import type { FieldPath, FieldValues, UseFormReturn } from 'react-hook-form';

import type { ApiErrorReasonV2 } from '@/api/generated/smbdo.schemas';

export type ApiFieldPathMap<TFieldValues extends FieldValues> = Record<
  string,
  FieldPath<TFieldValues> | FieldPath<TFieldValues>[]
>;

function removeBracketDelimiters(message: string): string {
  let sanitized = '';

  for (let index = 0; index < message.length; index += 1) {
    if (message[index] !== '[') {
      sanitized += message[index];
      continue;
    }

    const closingBracketIndex = message.indexOf(']', index + 1);
    if (closingBracketIndex <= index + 1) {
      sanitized += message[index];
      continue;
    }

    sanitized += message.slice(index + 1, closingBracketIndex);
    index = closingBracketIndex;
  }

  return sanitized;
}

export function sanitizeServerErrorMessage(message: string): string {
  let sanitized = message.replace(
    /^Field\s+\/[^/]*(?:\/[^/]*)*\/\s+value must have the expected value\.\s*/i,
    ''
  );
  sanitized = sanitized.replace(/Field\s+\/[^/]*(?:\/[^/]*)*\/\s*/g, '');
  sanitized = removeBracketDelimiters(sanitized);

  if (sanitized && sanitized !== message) {
    sanitized = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);
  }

  return sanitized.trim() || message;
}

const normalizeApiPath = (path: string) =>
  path
    .trim()
    .replace(/^\$\.?/, '')
    .replace(/^party\./, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\[(\d+)\]/g, '.$1')
    .replace(/\//g, '.')
    .replace(/\.{2,}/g, '.');

export function getApiErrorReasons(error: unknown): ApiErrorReasonV2[] {
  const responseData = (
    error as {
      response?: {
        data?: {
          context?: ApiErrorReasonV2[];
          reasons?: ApiErrorReasonV2[];
        };
      };
    }
  )?.response?.data;

  return [
    ...(responseData?.context ?? []),
    ...(responseData?.reasons ?? []),
  ].filter(
    (reason, index, reasons) =>
      Boolean(reason?.message) &&
      reasons.findIndex(
        (candidate) =>
          candidate.field === reason.field &&
          candidate.message === reason.message
      ) === index
  );
}

export function applyApiFieldErrors<TFieldValues extends FieldValues>(
  form: UseFormReturn<TFieldValues>,
  error: unknown,
  pathMap: ApiFieldPathMap<TFieldValues>
): boolean {
  const reasons = getApiErrorReasons(error);
  let firstField: FieldPath<TFieldValues> | undefined;
  let hasMappedError = false;

  reasons.forEach((reason) => {
    if (!reason.field || !reason.message) return;
    const normalizedPath = normalizeApiPath(reason.field);
    const mappedFields = pathMap[normalizedPath];
    if (!mappedFields) return;

    const fields = Array.isArray(mappedFields) ? mappedFields : [mappedFields];
    fields.forEach((field) => {
      form.setError(field, {
        type: 'server',
        message: `Server Error: ${sanitizeServerErrorMessage(reason.message!)}`,
      });
      firstField ??= field;
      hasMappedError = true;
    });
  });

  if (firstField) form.setFocus(firstField);
  return hasMappedError;
}

export function hasUnmappedApiErrors<TFieldValues extends FieldValues>(
  error: unknown,
  pathMap: ApiFieldPathMap<TFieldValues>
): boolean {
  const reasons = getApiErrorReasons(error);
  if (reasons.length === 0) return true;
  return reasons.some(
    (reason) => !reason.field || !pathMap[normalizeApiPath(reason.field)]
  );
}
