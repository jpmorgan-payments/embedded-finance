import { RecipientType } from '@/api/generated/ep-recipients.schemas';

/**
 * Supported recipient types for the accounts widget
 * SETTLEMENT_ACCOUNT is excluded as it has a different use case
 */
export type SupportedRecipientType = Exclude<
  RecipientType,
  'SETTLEMENT_ACCOUNT'
>;

/**
 * i18n namespace type for type-safe translations
 */
export type RecipientI18nNamespace = 'linked-accounts' | 'recipients';

/**
 * Configuration for each recipient type
 */
export interface RecipientTypeConfig {
  /** i18n namespace for translations */
  i18nNamespace: RecipientI18nNamespace;
  /** Whether microdeposit verification is supported */
  supportsMicrodeposits: boolean;
  /** Widget container ID for event tracking */
  widgetId: string;
  /** User journey event prefix */
  eventPrefix: string;
}

/**
 * Configuration map for each supported recipient type
 */
export const RECIPIENT_TYPE_CONFIG: Record<
  SupportedRecipientType,
  RecipientTypeConfig
> = {
  LINKED_ACCOUNT: {
    i18nNamespace: 'linked-accounts',
    supportsMicrodeposits: true,
    widgetId: 'linked-account-widget',
    eventPrefix: 'LINKED_ACCOUNT',
  },
  RECIPIENT: {
    i18nNamespace: 'recipients',
    supportsMicrodeposits: false,
    widgetId: 'recipients-widget',
    eventPrefix: 'RECIPIENT',
  },
};

/**
 * Get configuration for a recipient type
 * @param type - The recipient type
 * @returns Configuration for the specified recipient type
 */
export function getRecipientTypeConfig(
  type: SupportedRecipientType
): RecipientTypeConfig {
  return RECIPIENT_TYPE_CONFIG[type];
}

/**
 * Generate user journey event names based on recipient type prefix
 * @param prefix - The event prefix from recipient type config
 * @returns Object containing all user journey event names
 */
export function getUserJourneys(prefix: string) {
  return {
    VIEW_ACCOUNTS: `${prefix}_VIEW_ACCOUNTS`,
    LINK_STARTED: `${prefix}_LINK_STARTED`,
    LINK_COMPLETED: `${prefix}_LINK_COMPLETED`,
    VERIFY_STARTED: `${prefix}_VERIFY_STARTED`,
    VERIFY_COMPLETED: `${prefix}_VERIFY_COMPLETED`,
    EDIT_STARTED: `${prefix}_EDIT_STARTED`,
    EDIT_COMPLETED: `${prefix}_EDIT_COMPLETED`,
    REMOVE_STARTED: `${prefix}_REMOVE_STARTED`,
    REMOVE_COMPLETED: `${prefix}_REMOVE_COMPLETED`,
  } as const;
}
