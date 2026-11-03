import i18next, { type i18n as I18nInstance } from 'i18next';
import { z } from 'zod';

import { getRegisteredI18n } from './i18nRegistry';

/**
 * Zod 4 error map that translates Zod's built-in issues through i18next using
 * the `zod` namespace (`src/i18n/<locale>/zod.json`). Keys are compatible with
 * the `zod-i18n-map` locale format, so `zod` content-token overrides apply.
 *
 * Messages set on a schema (e.g. `.min(1, 'Required')`) take precedence over
 * this map.
 */

type TranslateFn = (
  key: string | string[],
  options?: Record<string, unknown>
) => string;

const ns = 'zod';

const jsonStringifyReplacer = (_: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value;

const joinValues = (values: readonly unknown[], separator = ' | ') =>
  values
    .map((value) => (typeof value === 'string' ? `'${value}'` : value))
    .join(separator);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getKeyAndValues = (param: unknown, defaultKey: string) => {
  if (typeof param === 'string') return { key: param, values: {} };
  if (isRecord(param)) {
    const key = typeof param.key === 'string' ? param.key : defaultKey;
    const values = isRecord(param.values) ? param.values : {};
    return { key, values };
  }
  return { key: defaultKey, values: {} };
};

const getRangeKind = (issue: { exact?: boolean; inclusive?: boolean }) => {
  if (issue.exact) return 'exact';
  return issue.inclusive ? 'inclusive' : 'not_inclusive';
};

// Zod 4 reports integer and bigint bounds with their own origins; the locale
// files share the number messages for them.
const normalizeSizeOrigin = (origin: string) =>
  origin === 'int' || origin === 'bigint' ? 'number' : origin;

const getDefaultMessage = (issue: z.core.$ZodRawIssue): string => {
  const result = z.core.config().localeError?.(issue);
  if (typeof result === 'string') return result;
  return result?.message ?? 'Invalid input';
};

/**
 * Creates a Zod error map that translates with the i18n instance returned by
 * `getInstance` at validation time.
 */
export const createZodI18nErrorMap =
  (getInstance: () => I18nInstance): z.core.$ZodErrorMap =>
  (issue) => {
    const instance = getInstance();
    const t = instance.t.bind(instance) as unknown as TranslateFn;
    const defaultValue = getDefaultMessage(issue);
    const issuePath = issue.path ?? [];
    const path =
      issuePath.length > 0
        ? {
            context: 'with_path',
            path: t(issuePath.join('.'), {
              ns,
              defaultValue: issuePath.join('.'),
            }),
          }
        : {};
    const common = { ns, defaultValue, ...path };

    switch (issue.code) {
      case 'invalid_type': {
        const { input } = issue;
        if (input === undefined) {
          return t('errors.invalid_type_received_undefined', common);
        }
        if (input === null) {
          return t('errors.invalid_type_received_null', common);
        }
        if (input instanceof Date && Number.isNaN(input.getTime())) {
          return t('errors.invalid_date', common);
        }
        // Zod 4 names integers `int`; Zod 3 (and the locale files) used
        // `integer` and reported non-integer numbers as `float`.
        const expected = issue.expected === 'int' ? 'integer' : issue.expected;
        const parsedType = z.core.util.getParsedType(input);
        const received =
          issue.expected === 'int' && parsedType === 'number'
            ? 'float'
            : parsedType;
        return t('errors.invalid_type', {
          expected: t(`types.${expected}`, { ns, defaultValue: expected }),
          received: t(`types.${received}`, { ns, defaultValue: received }),
          ...common,
        });
      }
      case 'invalid_value': {
        const { input, values } = issue;
        const schemaType = (issue.inst as z.core.$ZodType | undefined)?._zod
          ?.def?.type;
        if (schemaType !== 'enum') {
          return t('errors.invalid_literal', {
            expected: JSON.stringify(values[0], jsonStringifyReplacer),
            ...common,
          });
        }
        // Zod 3 reported missing / wrongly typed enum input as a type error
        // ("Required", "Expected 'A' | 'B', received number").
        if (input === undefined) {
          return t('errors.invalid_type_received_undefined', common);
        }
        if (input === null) {
          return t('errors.invalid_type_received_null', common);
        }
        const isNumericEnum = values.some((value) => typeof value === 'number');
        if (
          typeof input !== 'string' &&
          !(typeof input === 'number' && isNumericEnum)
        ) {
          const received = z.core.util.getParsedType(input);
          return t('errors.invalid_type', {
            expected: joinValues(values),
            received: t(`types.${received}`, { ns, defaultValue: received }),
            ...common,
          });
        }
        return t('errors.invalid_enum_value', {
          options: joinValues(values),
          received: input,
          ...common,
        });
      }
      case 'unrecognized_keys':
        return t('errors.unrecognized_keys', {
          keys: joinValues(issue.keys, ', '),
          count: issue.keys.length,
          ...common,
        });
      case 'invalid_union':
        return t('errors.invalid_union', common);
      case 'invalid_key':
        return t('errors.invalid_key', common);
      case 'invalid_element':
        return t('errors.invalid_element', common);
      case 'invalid_format':
        switch (issue.format) {
          case 'starts_with':
            return t('errors.invalid_string.startsWith', {
              startsWith: (issue as { prefix?: string }).prefix,
              ...common,
            });
          case 'ends_with':
            return t('errors.invalid_string.endsWith', {
              endsWith: (issue as { suffix?: string }).suffix,
              ...common,
            });
          case 'includes':
            return t('errors.invalid_string.includes', {
              includes: (issue as { includes?: string }).includes,
              ...common,
            });
          default:
            return t(
              [
                `errors.invalid_string.${issue.format}`,
                'errors.invalid_string.default',
              ],
              {
                validation: t(`validations.${issue.format}`, {
                  ns,
                  defaultValue: issue.format,
                }),
                ...common,
              }
            );
        }
      case 'too_small': {
        const origin = normalizeSizeOrigin(issue.origin);
        const minimum =
          origin === 'date' ? new Date(Number(issue.minimum)) : issue.minimum;
        return t(`errors.too_small.${origin}.${getRangeKind(issue)}`, {
          minimum,
          count: typeof minimum === 'number' ? minimum : undefined,
          ...common,
        });
      }
      case 'too_big': {
        const origin = normalizeSizeOrigin(issue.origin);
        const maximum =
          origin === 'date' ? new Date(Number(issue.maximum)) : issue.maximum;
        return t(`errors.too_big.${origin}.${getRangeKind(issue)}`, {
          maximum,
          count: typeof maximum === 'number' ? maximum : undefined,
          ...common,
        });
      }
      case 'not_multiple_of':
        return t('errors.not_multiple_of', {
          multipleOf: issue.divisor,
          ...common,
        });
      case 'custom': {
        const { key, values } = getKeyAndValues(
          issue.params?.i18n,
          'errors.custom'
        );
        return t(key, { ...values, ...common });
      }
      default:
        return undefined;
    }
  };

/**
 * Global error map; follows the active provider's i18n instance, falling back
 * to the global instance (initialized by `config.ts`, which installs this map).
 */
export const zodI18nErrorMap = createZodI18nErrorMap(
  () => getRegisteredI18n() ?? i18next
);
