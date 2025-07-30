import { FlatNamespace, KeyPrefix, TFunction } from 'i18next';
import {
  FallbackNs,
  useTranslation as useI18nextTranslation,
  UseTranslationOptions,
} from 'react-i18next';
import { $Tuple } from 'react-i18next/helpers';

import { useContentTokens } from '@/core/EBComponentsProvider/EBComponentsProvider';

function getNestedValue(
  obj: Record<string, any> | string | undefined,
  path: string
): unknown {
  if (!obj || !path || typeof obj === 'string') return undefined;

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || typeof current !== 'object' || !(part in current)) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Custom hook to handle translations with scoped namespaces
 * Wraps the i18next useTranslation hook to prepend providerId to namespaces
 *
 * @param namespace - The namespace to use for translations
 * @returns An object containing the translation function that matches the i18n TFunction signature
 */
export function useTranslation<
  Ns extends FlatNamespace | $Tuple<FlatNamespace> | undefined = undefined,
  KPrefix extends KeyPrefix<FallbackNs<Ns>> = undefined,
>(
  namespace: Ns,
  options?: UseTranslationOptions<KPrefix>
): { t: TFunction<FallbackNs<Ns>, KPrefix> } {
  const { tokens } = useContentTokens();
  const defaultNamespace = Array.isArray(namespace) ? namespace[0] : namespace;

  // Use the original hook with our scoped namespace
  const { t: originalT } = useI18nextTranslation(namespace, options);

  // Create a wrapper t function that transforms keys with namespaces
  // @ts-expect-error
  const wrappedT = (key, tOptions) => {
    if (typeof key === 'string' && key.includes(':')) {
      const [nsPrefix, keyPart] = key.split(':');

      const token = getNestedValue(
        tokens?.[nsPrefix as keyof typeof tokens],
        keyPart
      );

      if (token !== undefined) {
        return token;
      }

      return originalT(key, tOptions);
    }

    if (typeof key === 'string' && !key.includes(':')) {
      const token = getNestedValue(
        tokens?.[defaultNamespace as keyof typeof tokens],
        key
      );

      if (token !== undefined) {
        return token;
      }

      return originalT(key, tOptions);
    }

    if (Array.isArray(key)) {
      // If key is an array, map each key to include the providerId prefix
      const valueList = key.flatMap((k) => {
        if (typeof k === 'string' && k.includes(':')) {
          const [nsPrefix, keyPart] = k.split(':');
          const token = getNestedValue(
            tokens?.[nsPrefix as keyof typeof tokens],
            keyPart
          );
          if (token !== undefined) {
            return token;
          }
          return originalT(k, tOptions);
        }
        if (typeof k === 'string' && !k.includes(':')) {
          const token = getNestedValue(
            tokens?.[defaultNamespace as keyof typeof tokens],
            k
          );
          if (token !== undefined) {
            return token;
          }
          return originalT(k, tOptions);
        }
        return '';
      });

      return valueList.find((value) => value !== undefined);
    }

    return key;
  };

  wrappedT.$TFunctionBrand = originalT.$TFunctionBrand;

  return { t: wrappedT as TFunction<FallbackNs<Ns>, KPrefix> };
}
