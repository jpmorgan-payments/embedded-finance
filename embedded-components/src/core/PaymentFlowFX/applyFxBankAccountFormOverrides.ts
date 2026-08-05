/**
 * Applies cross-border (FX) overrides to a bank-account form config.
 *
 * Relabels rails as value tiers, restricts available rails to those the
 * destination currency supports, and relaxes US-domestic field rules.
 * Pure transform — the caller resolves display strings (owns i18n).
 */
import type { BankAccountFormConfig } from '@/core/RecipientWidgets/components/BankAccountForm';

import {
  getFxAvailableRails,
  getFxCurrencyRequirement,
} from './fxRecipientRequirements';

export type FxBankAccountFormOverrideLabels = {
  highValue: string;
  lowValue: string;
  wireDescription: string;
  achDescription: string;
};

/**
 * Returns a form config adapted for an FX credit currency, or the original
 * config when the currency has no FX requirement descriptor.
 */
export function applyFxBankAccountFormOverrides(
  config: BankAccountFormConfig,
  currency: string,
  labels: FxBankAccountFormOverrideLabels
): BankAccountFormConfig {
  const requirement = getFxCurrencyRequirement(currency);
  if (!requirement) return config;

  const rails = getFxAvailableRails(currency);

  return {
    ...config,
    paymentMethods: {
      ...config.paymentMethods,
      available:
        rails.length > 0
          ? rails
          : config.paymentMethods.available.filter((m) => m !== 'RTP'),
      defaultSelected:
        rails.length === 1 ? rails : config.paymentMethods.defaultSelected,
      configs: {
        ...config.paymentMethods.configs,
        WIRE: {
          ...config.paymentMethods.configs.WIRE,
          label: labels.highValue,
          labelString: labels.highValue,
          shortLabel: labels.highValue,
          shortLabelString: labels.highValue,
          description: labels.wireDescription,
        },
        ACH: {
          ...config.paymentMethods.configs.ACH,
          label: labels.lowValue,
          labelString: labels.lowValue,
          shortLabel: labels.lowValue,
          shortLabelString: labels.lowValue,
          description: labels.achDescription,
        },
      },
    },
    content: {
      ...config.content,
      fieldLabels: {
        ...config.content.fieldLabels,
        accountNumber: requirement.accountNumberLabel,
      },
    },
    internationalFieldConfig: {
      hideBankAccountType: !requirement.requiresAccountType,
      accountNumberFormat: requirement.accountNumberFormat,
      relaxRoutingFormat: true,
      routingCodeLabel: requirement.routingCode?.label,
      routingCodeRequired: requirement.routingCode?.required ?? false,
      hideRoutingNumber: !requirement.routingCode,
    },
  };
}
