import { useTranslation } from 'react-i18next';

import { getLocaleFromLanguage } from '../utils/getLocaleFromLanguage';

/**
 * Hook to get the current locale string from the i18n instance
 *
 * Uses i18next's resolvedLanguage (if available) which is the actual resolved language
 * after fallbacks, otherwise falls back to i18n.language.
 *
 * @returns The current locale string (e.g., 'en-US', 'fr-CA')
 */
export const useLocale = (): string => {
  const { i18n } = useTranslation();
  // Use resolvedLanguage if available (more accurate after fallbacks), otherwise use language
  const languageCode = i18n.resolvedLanguage || i18n.language;
  return getLocaleFromLanguage(languageCode);
};
