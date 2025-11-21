/**
 * Recipients Column Configuration
 *
 * Defines available columns and their configuration options
 * based on the LIST recipients API model.
 */

/**
 * Available column keys that can be displayed in the recipients table
 */
export type RecipientColumnKey =
  | 'name'
  | 'type'
  | 'status'
  | 'accountNumber'
  | 'accountType'
  | 'routingNumber'
  | 'createdAt'
  | 'updatedAt'
  | 'partyId'
  | 'clientId'
  | 'actions';

/**
 * Column configuration for a single column
 */
export interface RecipientColumnConfig {
  /** Whether the column is visible */
  visible: boolean;
  /** Whether the column can be sorted */
  sortable: boolean;
  /** Display label for the column */
  label: string;
  /** Optional description/tooltip for the column */
  description?: string;
}

/**
 * Complete column configuration for all available columns
 */
export type RecipientsColumnConfiguration = Record<
  RecipientColumnKey,
  RecipientColumnConfig
>;

/**
 * Default column configuration
 * Based on the LIST recipients API model fields
 */
export const defaultRecipientsColumnConfig: RecipientsColumnConfiguration = {
  name: {
    visible: true,
    sortable: true,
    label: 'Name',
    description: 'Recipient name (from partyDetails)',
  },
  type: {
    visible: true,
    sortable: true,
    label: 'Type',
    description:
      'Recipient type (RECIPIENT, LINKED_ACCOUNT, SETTLEMENT_ACCOUNT)',
  },
  status: {
    visible: true,
    sortable: true,
    label: 'Status',
    description: 'Recipient status (ACTIVE, INACTIVE, PENDING, etc.)',
  },
  accountNumber: {
    visible: true,
    sortable: true,
    label: 'Account Number',
    description: 'Masked account number',
  },
  accountType: {
    visible: false,
    sortable: true,
    label: 'Account Type',
    description: 'Account type (CHECKING, SAVINGS, etc.)',
  },
  routingNumber: {
    visible: false,
    sortable: false,
    label: 'Routing Number',
    description: 'Bank routing number',
  },
  createdAt: {
    visible: true,
    sortable: true,
    label: 'Created',
    description: 'Date and time the recipient was created',
  },
  updatedAt: {
    visible: false,
    sortable: true,
    label: 'Updated',
    description: 'Date and time the recipient was last updated',
  },
  partyId: {
    visible: false,
    sortable: false,
    label: 'Party ID',
    description: 'Related Party Identifier for Linked Accounts',
  },
  clientId: {
    visible: false,
    sortable: false,
    label: 'Client ID',
    description: 'Client identifier',
  },
  actions: {
    visible: true,
    sortable: false,
    label: 'Actions',
    description: 'Available actions for the recipient',
  },
};

/**
 * Widget-optimized column configuration
 * Shows minimal columns for widget layout
 */
export const widgetRecipientsColumnConfig: RecipientsColumnConfiguration = {
  ...defaultRecipientsColumnConfig,
  type: { ...defaultRecipientsColumnConfig.type, visible: false },
  accountNumber: {
    ...defaultRecipientsColumnConfig.accountNumber,
    visible: false,
  },
  createdAt: { ...defaultRecipientsColumnConfig.createdAt, visible: false },
};

/**
 * Merge user column configuration with base config
 */
export function mergeColumnConfig(
  userConfig?: Partial<RecipientsColumnConfiguration>,
  baseConfig: RecipientsColumnConfiguration = defaultRecipientsColumnConfig
): RecipientsColumnConfiguration {
  if (!userConfig) {
    return baseConfig;
  }

  const merged = { ...baseConfig };

  for (const [key, config] of Object.entries(userConfig)) {
    if (key in merged && config) {
      merged[key as RecipientColumnKey] = {
        ...merged[key as RecipientColumnKey],
        ...config,
      };
    }
  }

  return merged;
}

/**
 * Get visible columns in order
 */
export function getVisibleColumns(
  config: RecipientsColumnConfiguration
): RecipientColumnKey[] {
  return (Object.keys(config) as RecipientColumnKey[]).filter(
    (key) => config[key].visible
  );
}

/**
 * Get sortable columns
 */
export function getSortableColumns(
  config: RecipientsColumnConfiguration
): RecipientColumnKey[] {
  return (Object.keys(config) as RecipientColumnKey[]).filter(
    (key) => config[key].sortable && config[key].visible
  );
}
