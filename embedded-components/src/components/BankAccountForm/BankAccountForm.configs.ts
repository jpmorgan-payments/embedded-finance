/**
 * Pre-configured settings for different use cases
 */

import type {
  BankAccountFormConfig,
  PaymentMethodConfig,
  PaymentMethodType,
} from './BankAccountForm.types';

/**
 * Default payment method configurations
 */
const defaultPaymentMethodConfigs: Record<
  PaymentMethodType,
  PaymentMethodConfig
> = {
  ACH: {
    enabled: true,
    label: 'ACH',
    shortLabel: 'ACH',
    description: 'Automated Clearing House - Standard electronic bank transfer',
    requiredFields: {
      accountNumber: true,
      routingNumber: true,
      bankAccountType: true,
      address: false,
      contacts: [],
    },
    routingValidation: {
      length: 9,
      pattern: /^\d{9}$/,
      errorMessage: 'ACH routing number must be exactly 9 digits',
    },
    helperText: 'Standard bank transfer, settles in 1-3 business days',
  },
  WIRE: {
    enabled: true,
    label: 'Wire Transfer',
    shortLabel: 'Wire',
    description: 'Traditional bank wire transfer with same-day settlement',
    requiredFields: {
      accountNumber: true,
      routingNumber: true,
      bankAccountType: true,
      address: true,
      contacts: [],
    },
    routingValidation: {
      length: 9,
      pattern: /^\d{9}$/,
      errorMessage: 'Wire routing number must be exactly 9 digits',
    },
    helperText: 'Same-day transfer, requires full address information',
  },
  RTP: {
    enabled: true,
    label: 'Real-Time Payments (RTP)',
    shortLabel: 'RTP',
    description: 'Instant payments 24/7/365 with immediate settlement',
    requiredFields: {
      accountNumber: true,
      routingNumber: true,
      bankAccountType: true,
      address: false,
      contacts: ['EMAIL'],
    },
    routingValidation: {
      length: 9,
      pattern: /^\d{9}$/,
      errorMessage: 'RTP routing number must be exactly 9 digits',
    },
    helperText: 'Instant transfer available 24/7',
  },
};

/**
 * Pre-configured settings for Linked Accounts
 * - ACH is required and locked (cannot be deselected)
 * - Address is optional
 * - Email contact is recommended but optional
 */
export const linkedAccountConfig: BankAccountFormConfig = {
  useCase: 'LINKED_ACCOUNT',
  paymentMethods: {
    available: ['ACH', 'WIRE', 'RTP'],
    configs: {
      ACH: {
        ...defaultPaymentMethodConfigs.ACH,
        locked: true, // Cannot be deselected for linked accounts
      },
      WIRE: {
        ...defaultPaymentMethodConfigs.WIRE,
      },
      RTP: {
        ...defaultPaymentMethodConfigs.RTP,
      },
    },
    allowMultiple: true,
    defaultSelected: ['ACH'],
  },
  accountHolder: {
    allowIndividual: true,
    allowOrganization: true,
    defaultType: 'INDIVIDUAL',
  },
  requiredFields: {
    certification: true,
  },
  content: {
    title: 'Link A Bank Account',
    description: 'Connect your external bank account to enable payments',
    successTitle: 'Account Linked Successfully',
    successDescription: 'Your external account has been linked.',
    submitButtonText: 'Confirm and Link Account',
    cancelButtonText: 'Cancel',
    loadingMessage: 'Linking your account...',
    sections: {
      accountHolderType: 'Account Holder Type',
      accountHolderInfo: 'Account Holder Information',
      bankAccountDetails: 'Bank Account Details',
      paymentMethods: 'Payment Methods',
      addressInfo: 'Address Information',
      contactInfo: 'Contact Information',
    },
    certificationText:
      'I authorize verification of this external bank account, including microdeposit verification if required. I certify that the information provided is accurate and matches my bank account details.',
  },
};

/**
 * Pre-configured settings for Recipients
 * - All payment methods are optional
 * - Address required for WIRE and RTP
 * - Email required for WIRE and RTP
 * - Multiple payment methods allowed
 */
export const recipientConfig: BankAccountFormConfig = {
  useCase: 'RECIPIENT',
  paymentMethods: {
    available: ['ACH', 'WIRE', 'RTP'],
    configs: {
      ACH: {
        ...defaultPaymentMethodConfigs.ACH,
      },
      WIRE: {
        ...defaultPaymentMethodConfigs.WIRE,
      },
      RTP: {
        ...defaultPaymentMethodConfigs.RTP,
      },
    },
    allowMultiple: true,
    defaultSelected: ['ACH'],
  },
  accountHolder: {
    allowIndividual: true,
    allowOrganization: true,
    defaultType: 'INDIVIDUAL',
  },
  requiredFields: {
    certification: false,
  },
  content: {
    title: 'Create New Recipient',
    description: 'Add a new payment recipient',
    successTitle: 'Recipient Created Successfully',
    successDescription: 'The recipient has been added.',
    submitButtonText: 'Create Recipient',
    cancelButtonText: 'Cancel',
    loadingMessage: 'Creating recipient...',
    sections: {
      accountHolderType: 'Recipient Type',
      accountHolderInfo: 'Recipient Information',
      bankAccountDetails: 'Bank Account Details',
      paymentMethods: 'Payment Methods',
      addressInfo: 'Address Information',
      contactInfo: 'Contact Information',
    },
  },
};

/**
 * Helper function to create a custom config by merging with defaults
 */
export function createCustomConfig(
  baseConfig: BankAccountFormConfig,
  overrides: Partial<BankAccountFormConfig>
): BankAccountFormConfig {
  return {
    ...baseConfig,
    ...overrides,
    paymentMethods: {
      ...baseConfig.paymentMethods,
      ...overrides.paymentMethods,
      configs: {
        ...baseConfig.paymentMethods.configs,
        ...overrides.paymentMethods?.configs,
      },
    },
    accountHolder: {
      ...baseConfig.accountHolder,
      ...overrides.accountHolder,
    },
    requiredFields: {
      ...baseConfig.requiredFields,
      ...overrides.requiredFields,
    },
    content: {
      ...baseConfig.content,
      ...overrides.content,
      sections: {
        ...baseConfig.content.sections,
        ...overrides.content?.sections,
      },
      fieldLabels: {
        ...baseConfig.content.fieldLabels,
        ...overrides.content?.fieldLabels,
      },
    },
  };
}
