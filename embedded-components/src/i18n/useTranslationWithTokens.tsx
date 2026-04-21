import { type ReactNode } from 'react';
import { defaultResources } from '@/i18n/config';
import { useTranslation } from 'react-i18next';

import { useContentTokens } from '@/core/EBComponentsProvider';

/** Valid namespace keys from default resources */
type ValidNamespace = keyof (typeof defaultResources)['enUS'];

/**
 * Translation result type that excludes null/undefined.
 * This ensures the return type is always renderable content.
 */
export type TranslationResult = string | Exclude<ReactNode, null | undefined>;

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
   *
   * Must forward all arguments to i18next `t` (e.g. `t(key, defaultValue, options)`
   * for interpolation). Only passing `(key, options)` drops the third argument and
   * breaks strings like `Document {{number}}`.
   */
  function t(...args: Parameters<TFunc>): TranslationResult {
    const translated = (originalT as any)(...args);

    if (!showTokenIds) {
      return translated;
    }

    // If the translated content is empty, return empty string to avoid rendering empty spans
    // This preserves the behavior of conditional rendering based on empty content
    if (translated === '' || translated === null || translated === undefined) {
      return translated ?? '';
    }

    // Build full token ID (namespace.key)
    // When args[0] is an array of fallback keys, use only the first key
    // so the data-content-token attribute is a single clean key rather
    // than a comma-joined list of all fallback keys.
    const rawKey = args[0];
    const keyStr = String(Array.isArray(rawKey) ? rawKey[0] : rawKey);
    // Prefer `ns` from the last object arg (covers t(key, opts) and t(key, default, opts))
    let optionsForNs: Record<string, unknown> | undefined;
    for (let i = args.length - 1; i >= 1; i -= 1) {
      const a = args[i];
      if (typeof a === 'object' && a !== null && !Array.isArray(a)) {
        optionsForNs = a as Record<string, unknown>;
        break;
      }
    }
    const namespace =
      (optionsForNs as { ns?: string } | undefined)?.ns ??
      (keyStr.includes(':') ? undefined : primaryNs);
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
  const tString = (...args: Parameters<TFunc>): string => {
    return (originalT as any)(...args);
  };

  return { t, tString, i18n, ready };
}
