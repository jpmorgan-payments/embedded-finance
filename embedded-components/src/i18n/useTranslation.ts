import { Namespace, TFunction } from 'i18next';

import { useScopedContentTokens } from '@/core/EBComponentsProvider/EBComponentsProvider';

import { i18n } from './config';

/**
 * Custom hook to handle translations with scoped namespaces
 *
 * @param namespace - The namespace to use for translations
 * @returns An object containing the translation function that matches the i18n TFunction signature
 */
export const useTranslation = (namespace: Namespace) => {
  const { providerId } = useScopedContentTokens();

  // Handle different namespace types (string, string[], undefined)
  const scopedNamespace =
    typeof namespace === 'string'
      ? `${providerId}-${namespace}`
      : Array.isArray(namespace)
        ? namespace.map((ns) => `${providerId}-${ns}`)
        : `${providerId}-common`; // Default namespace if undefined

  /**
   * Get translated text by key
   * This preserves the exact same function signature as the original i18n.t function
   */
  const t = ((key: string, options?: any) => {
    if (Array.isArray(scopedNamespace) && Array.isArray(namespace)) {
      // When namespace is an array, pass it directly to i18n.t via ns option
      return i18n.t(
        [
          ...scopedNamespace.map((ns) => `${ns}:${key}`),
          ...namespace.map((ns) => `${ns}:${key}`),
        ],
        options
      );
    }

    // For string namespace, use the conventional format
    return i18n.t(
      [`${scopedNamespace}:${key}`, `${namespace}:${key}`],
      options
    );
  }) as TFunction;

  return { t };
};
