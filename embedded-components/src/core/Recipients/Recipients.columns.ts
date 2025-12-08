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
 * Get default column configuration with translations
 * Based on the LIST recipients API model fields
 *
 * @param t - Translation function (type-asserted to avoid TypeScript overload issues)
 * @returns Column configuration with translated labels
 */
export const getDefaultRecipientsColumnConfig = (
  t: (key: string, options?: any) => string
): RecipientsColumnConfiguration => {
  // Extract all translations to variables to avoid TypeScript overload issues
  const nameLabel = t('recipients:columns.name', { defaultValue: 'Name' });
  const typeLabel = t('recipients:columns.type', { defaultValue: 'Type' });
  const statusLabel = t('recipients:columns.status', {
    defaultValue: 'Status',
  });
  const accountNumberLabel = t('recipients:columns.accountNumber', {
    defaultValue: 'Account Number',
  });
  const accountTypeLabel = t('recipients:columns.accountType', {
    defaultValue: 'Account Type',
  });
  const routingNumberLabel = t('recipients:columns.routingNumber', {
    defaultValue: 'Routing Number',
  });
  const createdAtLabel = t('recipients:columns.createdAt', {
    defaultValue: 'Created',
  });
  const updatedAtLabel = t('recipients:columns.updatedAt', {
    defaultValue: 'Updated',
  });
  const partyIdLabel = t('recipients:columns.partyId', {
    defaultValue: 'Party ID',
  });
  const clientIdLabel = t('recipients:columns.clientId', {
    defaultValue: 'Client ID',
  });
  const actionsLabel = t('recipients:columns.actions', {
    defaultValue: 'Actions',
  });

  return {
    name: {
      visible: true,
      sortable: true,
      label: nameLabel,
      description: 'Recipient name (from partyDetails)',
    },
    type: {
      visible: true,
      sortable: true,
      label: typeLabel,
      description:
        'Recipient type (RECIPIENT, LINKED_ACCOUNT, SETTLEMENT_ACCOUNT)',
    },
    status: {
      visible: true,
      sortable: true,
      label: statusLabel,
      description: 'Recipient status (ACTIVE, INACTIVE, PENDING, etc.)',
    },
    accountNumber: {
      visible: true,
      sortable: true,
      label: accountNumberLabel,
      description: 'Masked account number',
    },
    accountType: {
      visible: false,
      sortable: true,
      label: accountTypeLabel,
      description: 'Account type (CHECKING, SAVINGS, etc.)',
    },
    routingNumber: {
      visible: false,
      sortable: false,
      label: routingNumberLabel,
      description: 'Bank routing number',
    },
    createdAt: {
      visible: true,
      sortable: true,
      label: createdAtLabel,
      description: 'Date and time the recipient was created',
    },
    updatedAt: {
      visible: false,
      sortable: true,
      label: updatedAtLabel,
      description: 'Date and time the recipient was last updated',
    },
    partyId: {
      visible: false,
      sortable: false,
      label: partyIdLabel,
      description: 'Related Party Identifier for Linked Accounts',
    },
    clientId: {
      visible: false,
      sortable: false,
      label: clientIdLabel,
      description: 'Client identifier',
    },
    actions: {
      visible: true,
      sortable: false,
      label: actionsLabel,
      description: 'Available actions for the recipient',
    },
  };
};

/**
 * Get widget-optimized column configuration with translations
 * Shows minimal columns for widget layout
 *
 * @param t - Translation function
 * @returns Widget column configuration with translated labels
 */
export const getWidgetRecipientsColumnConfig = (
  t: (key: string, options?: any) => string
): RecipientsColumnConfiguration => {
  const baseConfig = getDefaultRecipientsColumnConfig(t);
  return {
    ...baseConfig,
    type: { ...baseConfig.type, visible: false },
    accountNumber: {
      ...baseConfig.accountNumber,
      visible: false,
    },
    createdAt: { ...baseConfig.createdAt, visible: false },
  };
};

/**
 * Default column configuration (legacy, for backward compatibility)
 * @deprecated Use getDefaultRecipientsColumnConfig(t) instead
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
 * Widget-optimized column configuration (legacy, for backward compatibility)
 * @deprecated Use getWidgetRecipientsColumnConfig(t) instead
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
