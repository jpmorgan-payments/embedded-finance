import type { DeepPartial } from 'react-hook-form';

import type { defaultResources } from './config';

/**
 * Content token configuration for customizing translations and enabling
 * token ID visibility in development/debugging contexts.
 *
 * This type lives within the i18n boundary so it can be safely exported
 * from the published package alongside the i18n config source.
 */
export type EBContentTokens = {
  /** Locale name to use for translations */
  name?: keyof typeof defaultResources;
  /** Custom token overrides per namespace */
  tokens?: DeepPartial<(typeof defaultResources)['enUS']>;
  /**
   * Enable token ID visibility for development/debugging.
   * When true, displays data-content-token attributes on translated text
   * for easy discovery of token IDs during customization.
   * @default false
   */
  showTokenIds?: boolean;
};
