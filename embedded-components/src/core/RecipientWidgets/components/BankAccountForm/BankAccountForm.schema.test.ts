import { describe, expect, it } from 'vitest';

import {
  createBankAccountFormSchema,
  type ValidationGetter,
} from './BankAccountForm.schema';
import type {
  BankAccountFormConfig,
  BankAccountFormData,
} from './BankAccountForm.types';

/** Validation getter that echoes the key so we can assert on it. */
const v: ValidationGetter = (key) => key;

type IntlConfig = BankAccountFormConfig['internationalFieldConfig'];

function makeConfig(intl?: IntlConfig): BankAccountFormConfig {
  const methodConfig = (label: string) => ({
    enabled: true,
    label,
    labelString: label,
    shortLabel: label,
    shortLabelString: label,
    description: label,
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
      errorMessage: 'routingNumbers.validation.digits',
    },
  });

  return {
    useCase: 'RECIPIENT',
    paymentMethods: {
      available: ['ACH', 'WIRE', 'RTP'],
      configs: {
        ACH: methodConfig('Low value'),
        WIRE: methodConfig('High value'),
        RTP: methodConfig('RTP'),
      },
      allowMultiple: true,
      defaultSelected: [],
    },
    accountHolder: {
      allowIndividual: true,
      allowOrganization: true,
      defaultType: 'INDIVIDUAL',
      prefillFromClient: false,
    },
    requiredFields: { certification: false },
    content: { submitButtonText: 'Submit' },
    internationalFieldConfig: intl,
  } as unknown as BankAccountFormConfig;
}

function makeData(
  overrides: Partial<BankAccountFormData> = {}
): BankAccountFormData {
  return {
    accountType: 'INDIVIDUAL',
    firstName: 'Ada',
    lastName: 'Lovelace',
    businessName: '',
    accountNumber: 'DE89370400440532013000',
    routingNumbers: [{ paymentType: 'ACH', routingNumber: '' }],
    useSameRoutingNumber: true,
    paymentTypes: ['ACH'],
    contacts: [],
    ...overrides,
  } as unknown as BankAccountFormData;
}

function hasIssueAt(
  result: ReturnType<
    ReturnType<typeof createBankAccountFormSchema>['safeParse']
  >,
  path: string
): boolean {
  if (result.success) return false;
  return result.error.issues.some((i) => i.path.join('.') === path);
}

describe('createBankAccountFormSchema — internationalFieldConfig (FX)', () => {
  it('treats the routing/bank code as optional for IBAN currencies', () => {
    const schema = createBankAccountFormSchema(
      makeConfig({
        hideBankAccountType: true,
        accountNumberFormat: 'IBAN',
        relaxRoutingFormat: true,
        routingCodeLabel: 'BIC / SWIFT',
        routingCodeRequired: false,
      }),
      v
    );

    const result = schema.safeParse(makeData());
    expect(result.success).toBe(true);
  });

  it('requires the routing/bank code when the currency mandates it', () => {
    const schema = createBankAccountFormSchema(
      makeConfig({
        hideBankAccountType: true,
        accountNumberFormat: 'LOCAL',
        relaxRoutingFormat: true,
        routingCodeLabel: 'IFSC code',
        routingCodeRequired: true,
      }),
      v
    );

    const result = schema.safeParse(makeData());
    expect(result.success).toBe(false);
    expect(hasIssueAt(result, 'routingNumbers.0.routingNumber')).toBe(true);
  });

  it('accepts a non-numeric routing code (IFSC/BIC) when the format is relaxed', () => {
    const schema = createBankAccountFormSchema(
      makeConfig({
        hideBankAccountType: true,
        accountNumberFormat: 'LOCAL',
        relaxRoutingFormat: true,
        routingCodeLabel: 'IFSC code',
        routingCodeRequired: true,
      }),
      v
    );

    const result = schema.safeParse(
      makeData({
        accountNumber: '000123456789',
        routingNumbers: [{ paymentType: 'ACH', routingNumber: 'HDFC0001234' }],
      })
    );
    expect(result.success).toBe(true);
  });

  it('does not validate a routing code when the field is hidden (CLABE)', () => {
    const schema = createBankAccountFormSchema(
      makeConfig({
        hideBankAccountType: true,
        accountNumberFormat: 'CLABE',
        relaxRoutingFormat: true,
        hideRoutingNumber: true,
      }),
      v
    );

    const result = schema.safeParse(
      makeData({ accountNumber: '032180000118359719' })
    );
    expect(result.success).toBe(true);
  });

  it('still enforces the US 9-digit routing rule for domestic recipients', () => {
    const schema = createBankAccountFormSchema(makeConfig(), v);

    const valid = schema.safeParse(
      makeData({
        accountNumber: '123456789',
        bankAccountType: 'CHECKING',
        routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
      })
    );
    expect(valid.success).toBe(true);

    const invalid = schema.safeParse(
      makeData({
        accountNumber: '123456789',
        bankAccountType: 'CHECKING',
        routingNumbers: [{ paymentType: 'ACH', routingNumber: 'ABC' }],
      })
    );
    expect(invalid.success).toBe(false);
    expect(hasIssueAt(invalid, 'routingNumbers.0.routingNumber')).toBe(true);
  });
});
