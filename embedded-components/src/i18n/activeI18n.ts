import { type i18n as I18nInstance } from 'i18next';

// Importing the config also initializes the global fallback instance.
import { i18n as globalI18n } from './config';
import { getRegisteredI18n } from './i18nRegistry';

/**
 * Translation for code that runs outside React (Zod schemas, formatters,
 * field-map helpers). Uses the i18n instance of the active
 * `EBComponentsProvider` so its locale and content tokens apply; if several
 * providers are mounted the newest one wins, and outside a provider the global
 * en-US instance is used.
 */
export {
  activateI18nInstance,
  deactivateI18nInstance,
  setPendingI18nInstance,
} from './i18nRegistry';

export const getActiveI18n = (): I18nInstance =>
  getRegisteredI18n() ?? globalI18n;

/**
 * `t` bound to the active provider's i18n instance at call time.
 *
 * Call it when the text is needed (render, validation), not at module load —
 * for Zod schemas use a lazy error: `{ error: () => tActive('key') }`.
 */
export const tActive = ((...args: unknown[]) => {
  const instance = getActiveI18n();
  return (instance.t as unknown as (...params: unknown[]) => string).apply(
    instance,
    args
  );
}) as unknown as typeof globalI18n.t;
