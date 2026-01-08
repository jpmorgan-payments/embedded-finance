import type { BankAccountFormConfig } from '../BankAccountForm.types';

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
