import { type ReactNode } from 'react';
import { defaultResources } from '@/i18n/config';
import { useTranslation } from 'react-i18next';

import { useContentTokens } from '@/core/EBComponentsProvider';

/** Valid namespace keys from default resources */
type ValidNamespace = keyof (typeof defaultResources)['enUS'];

type TranslationResult = string | ReactNode;

/**
 * Returns a wrapped translation function that annotates output with token IDs.
 *
 * When `showTokenIds` is enabled:
 * - Returns a <span data-content-token="namespace.key">translated text</span>
 *
 * When disabled:
 * - Returns the plain translated string (normal behavior)
 *
 * Uses the same type inference as `useTranslation` for full intellisense.
 *
 * @example
 * ```tsx
 * // Single namespace
 * const { t } = useTranslationWithTokens('recipients');
 * return <h1>{t('title')}</h1>;
 *
 * // Multiple namespaces
 * const { t } = useTranslationWithTokens(['accounts', 'common']);
 * return <span>{t('actions.save')}</span>;
 * ```
 */
export function useTranslationWithTokens<N extends ValidNamespace>(
  ns: N | N[]
) {
  const contentTokensConfig = useContentTokens();
  const { t: originalT, i18n, ready } = useTranslation(ns);

  const showTokenIds = contentTokensConfig?.showTokenIds ?? false;
  const primaryNs: ValidNamespace = Array.isArray(ns) ? ns[0] : ns;

  type TFunc = typeof originalT;

  /**
   * Translate a key, optionally annotating with token ID.
   * Returns ReactNode when showTokenIds is enabled, string otherwise.
   */
  function t(...args: Parameters<TFunc>): TranslationResult {
    const [key, options] = args;
    // Use any cast to work around complex TFunction overload types
    const translated = (originalT as any)(key, options);

    if (!showTokenIds) {
      return translated;
    }

    // Build full token ID (namespace.key)
    const keyStr = String(key);
    const namespace =
      (options as any)?.ns ?? (keyStr.includes(':') ? undefined : primaryNs);
    const tokenId = namespace ? `${namespace}:${keyStr}` : keyStr;

    return (
      <span data-content-token={tokenId} className="eb-contents">
        {translated}
      </span>
    );
  }

  /**
   * Translate a key, always returning a plain string (no annotation).
   * Use this when the result must be a string (e.g., for title attributes).
   */
  function tString(...args: Parameters<TFunc>): string {
    const [key, options] = args;
    // Use any cast to work around complex TFunction overload types
    return (originalT as any)(key, options);
  }

  return { t, tString, i18n, ready };
}
