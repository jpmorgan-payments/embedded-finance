import { defaultResources } from '@/i18n/config';

/**
 * Gets the locale string (e.g., 'en-US', 'fr-CA') from an i18n language code (e.g., 'enUS', 'frCA')
 *
 * @param languageCode - The i18n language code (e.g., 'enUS', 'frCA')
 * @returns The locale string (e.g., 'en-US', 'fr-CA') or 'en-US' as fallback
 */
export const getLocaleFromLanguage = (languageCode?: string): string => {
  if (!languageCode) {
    return 'en-US';
  }

  const resource =
    defaultResources[languageCode as keyof typeof defaultResources];
  return resource?.locale || 'en-US';
};
