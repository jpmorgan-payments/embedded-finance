import { describe, expect, it } from 'vitest';

import type { BankAccountFormConfig } from '@/core/RecipientWidgets/components/BankAccountForm';

import { applyFxBankAccountFormOverrides } from './applyFxBankAccountFormOverrides';

const baseConfig = {
  paymentMethods: {
    available: ['ACH', 'WIRE', 'RTP'],
    defaultSelected: ['ACH'],
    configs: {
      ACH: {
        label: 'ACH',
        labelString: 'ACH',
        shortLabel: 'ACH',
        shortLabelString: 'ACH',
        description: 'ACH desc',
      },
      WIRE: {
        label: 'Wire',
        labelString: 'Wire',
        shortLabel: 'Wire',
        shortLabelString: 'Wire',
        description: 'Wire desc',
      },
      RTP: {
        label: 'RTP',
        labelString: 'RTP',
        shortLabel: 'RTP',
        shortLabelString: 'RTP',
        description: 'RTP desc',
      },
    },
  },
  content: {
    fieldLabels: {
      accountNumber: 'Account Number',
    },
  },
} as unknown as BankAccountFormConfig;

const labels = {
  highValue: 'FX High-value',
  lowValue: 'FX Low-value',
  wireDescription: 'Wire FX desc',
  achDescription: 'ACH FX desc',
};

describe('applyFxBankAccountFormOverrides', () => {
  it('returns the original config for unsupported / domestic currencies', () => {
    expect(applyFxBankAccountFormOverrides(baseConfig, 'USD', labels)).toBe(
      baseConfig
    );
  });

  it('applies FX rail labels and international field config for EUR', () => {
    const next = applyFxBankAccountFormOverrides(baseConfig, 'EUR', labels);

    expect(next.paymentMethods.configs.WIRE.label).toBe('FX High-value');
    expect(next.paymentMethods.configs.ACH.label).toBe('FX Low-value');
    expect(next.paymentMethods.available).not.toContain('RTP');
    expect(next.internationalFieldConfig?.accountNumberFormat).toBe('IBAN');
    expect(next.content.fieldLabels?.accountNumber).toBeTruthy();
  });
});
