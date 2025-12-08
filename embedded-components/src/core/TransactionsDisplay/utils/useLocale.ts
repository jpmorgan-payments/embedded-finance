import { useTranslation } from 'react-i18next';

import { getLocaleFromLanguage } from './getLocaleFromLanguage';

/**
 * Hook to get the current locale string from the i18n instance
 *
 * @returns The current locale string (e.g., 'en-US', 'fr-CA')
 */
export const useLocale = (): string => {
  const { i18n } = useTranslation();
  return getLocaleFromLanguage(i18n.language);
};
