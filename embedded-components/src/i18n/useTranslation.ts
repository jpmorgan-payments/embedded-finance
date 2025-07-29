import { useTranslation as useI18nextTranslation } from 'react-i18next';

import { useScopedContentTokens } from '@/core/EBComponentsProvider/EBComponentsProvider';

/**
 * Custom hook to handle translations with scoped namespaces
 * Wraps the i18next useTranslation hook to prepend providerId to namespaces
 *
 * @param namespace - The namespace to use for translations
 * @returns An object containing the translation function that matches the i18n TFunction signature
 */
export const useTranslation: typeof useI18nextTranslation = (
  namespace,
  options
) => {
  const { providerId } = useScopedContentTokens();
  console.log(providerId);

  const defaultNamespace = Array.isArray(namespace) ? namespace[0] : namespace;

  // Use the original hook with our scoped namespace
  const { t: originalT, ...rest } = useI18nextTranslation(namespace, options);
  console.log(originalT);
  // Create a wrapper t function that transforms keys with namespaces
  const wrappedT = (key: string | string[], tOptions: any) => {
    if (typeof key === 'string' && key.includes(':')) {
      const [nsPrefix, keyPart] = key.split(':');

      const transformedKey = `${providerId}-${nsPrefix}:${keyPart}`;
      return originalT([transformedKey, key], tOptions);
    }
    if (typeof key === 'string' && !key.includes(':')) {
      // If key is a simple string, prepend namespace
      const transformedKey = [
        `${providerId}-${defaultNamespace}:${key}`,
        `${defaultNamespace}:${key}`,
      ];
      return originalT(transformedKey, tOptions);
    }
    if (Array.isArray(key)) {
      // If key is an array, map each key to include the providerId prefix
      const transformedKeys = key.flatMap((k) => {
        if (typeof k === 'string' && k.includes(':')) {
          return [`${providerId}-${k}`, k];
        }
        if (typeof k === 'string' && !k.includes(':')) {
          return [
            `${providerId}-${defaultNamespace}:${k}`,
            `${defaultNamespace}:${k}`,
          ];
        }
        return k;
      });

      return originalT(transformedKeys, tOptions);
    }

    return originalT(key, tOptions);
  };

  return {
    t: wrappedT as typeof originalT,
    ...rest,
  };
};
