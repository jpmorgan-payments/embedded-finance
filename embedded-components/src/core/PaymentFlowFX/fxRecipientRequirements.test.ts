import { describe, expect, it } from 'vitest';

import {
  FX_CURRENCY_REQUIREMENTS,
  FX_RAIL_INFO,
  getFxAvailableRails,
  getFxCurrencyRequirement,
  getFxRoutingCodeType,
  getRecipientPaymentMethodDisplayLabel,
  getRecipientRoutingFieldDisplayLabel,
  isFxCreditCurrency,
  isIbanCurrency,
} from './fxRecipientRequirements';
import { SUPPORTED_TARGET_CURRENCIES } from './PaymentFlowFX.constants';

describe('fxRecipientRequirements', () => {
  describe('matrix integrity', () => {
    it('defines a requirement for every supported target currency', () => {
      SUPPORTED_TARGET_CURRENCIES.forEach((currency) => {
        expect(FX_CURRENCY_REQUIREMENTS[currency]).toBeDefined();
      });
    });

    it('keys each requirement to its own currency code', () => {
      Object.entries(FX_CURRENCY_REQUIREMENTS).forEach(([key, req]) => {
        expect(req.currency).toBe(key);
      });
    });

    it('labels IBAN currencies with an IBAN account number and hides account type', () => {
      Object.values(FX_CURRENCY_REQUIREMENTS)
        .filter((req) => req.accountNumberFormat === 'IBAN')
        .forEach((req) => {
          expect(req.accountNumberLabel).toBe('IBAN');
          expect(req.requiresAccountType).toBe(false);
        });
    });

    it('uses CLABE (no routing code, no account type) for Mexico', () => {
      const mxn = FX_CURRENCY_REQUIREMENTS.MXN;
      expect(mxn.accountNumberFormat).toBe('CLABE');
      expect(mxn.accountNumberLabel).toBe('CLABE');
      expect(mxn.requiresAccountType).toBe(false);
      expect(mxn.routingCode).toBeUndefined();
    });

    it('does not collect a US account type for Brazil (BRL)', () => {
      const brl = FX_CURRENCY_REQUIREMENTS.BRL;
      expect(brl.requiresAccountType).toBe(false);
      expect(brl.accountNumberLabel).toBe('Account number');
    });

    it('keeps the Canadian chequing/savings distinction', () => {
      expect(FX_CURRENCY_REQUIREMENTS.CAD.requiresAccountType).toBe(true);
    });

    it('assigns a canonical RoutingCodeType to every defined routing code', () => {
      Object.values(FX_CURRENCY_REQUIREMENTS)
        .filter((req) => req.routingCode)
        .forEach((req) => {
          expect(req.routingCode?.routingCodeType).toBeDefined();
          expect(typeof req.routingCode?.routingCodeType).toBe('string');
        });
    });
  });

  describe('getFxCurrencyRequirement', () => {
    it('resolves a supported currency case-insensitively', () => {
      expect(getFxCurrencyRequirement('eur')?.currency).toBe('EUR');
      expect(getFxCurrencyRequirement('EUR')?.currency).toBe('EUR');
    });

    it('returns undefined for USD / domestic and unknown currencies', () => {
      expect(getFxCurrencyRequirement('USD')).toBeUndefined();
      expect(getFxCurrencyRequirement('ZZZ')).toBeUndefined();
      expect(getFxCurrencyRequirement(undefined)).toBeUndefined();
      expect(getFxCurrencyRequirement(null)).toBeUndefined();
    });
  });

  describe('getFxAvailableRails', () => {
    it('returns a de-duplicated, WIRE-before-ACH union across account types', () => {
      // AUD supports both rails on both account types.
      expect(getFxAvailableRails('AUD')).toEqual(['WIRE', 'ACH']);
    });

    it('returns the single supported rail for currencies with one option', () => {
      expect(getFxAvailableRails('EUR')).toEqual(['WIRE']);
      expect(getFxAvailableRails('PLN')).toEqual(['ACH']);
    });

    it('scopes rails to a specific debtor account type when provided', () => {
      // SEK: no rail from a limited account, ACH from a transaction account.
      expect(getFxAvailableRails('SEK', 'limited')).toEqual([]);
      expect(getFxAvailableRails('SEK', 'transaction')).toEqual(['ACH']);
    });

    it('returns an empty array for unsupported currencies', () => {
      expect(getFxAvailableRails('USD')).toEqual([]);
      expect(getFxAvailableRails(undefined)).toEqual([]);
    });
  });

  describe('getFxRoutingCodeType', () => {
    it('maps local-clearing currencies to their national code type', () => {
      expect(getFxRoutingCodeType('CAD')).toBe('CACPA');
      expect(getFxRoutingCodeType('AUD')).toBe('AUBSB');
      expect(getFxRoutingCodeType('HKD')).toBe('HKNCC');
      expect(getFxRoutingCodeType('INR')).toBe('INFSC');
      expect(getFxRoutingCodeType('SGD')).toBe('SGIBG');
      expect(getFxRoutingCodeType('BRL')).toBe('BRSTN');
    });

    it('maps IBAN and SWIFT-routed currencies to BIC', () => {
      expect(getFxRoutingCodeType('EUR')).toBe('BIC');
      expect(getFxRoutingCodeType('GBP')).toBe('BIC');
      expect(getFxRoutingCodeType('PHP')).toBe('BIC');
      expect(getFxRoutingCodeType('KRW')).toBe('BIC');
      expect(getFxRoutingCodeType('VND')).toBe('BIC');
    });

    it('resolves case-insensitively', () => {
      expect(getFxRoutingCodeType('inr')).toBe('INFSC');
    });

    it('returns undefined for self-routing, domestic, and unknown currencies', () => {
      // MXN CLABE embeds bank + branch, so no separate routing code applies.
      expect(getFxRoutingCodeType('MXN')).toBeUndefined();
      expect(getFxRoutingCodeType('USD')).toBeUndefined();
      expect(getFxRoutingCodeType('ZZZ')).toBeUndefined();
      expect(getFxRoutingCodeType(undefined)).toBeUndefined();
      expect(getFxRoutingCodeType(null)).toBeUndefined();
    });
  });

  describe('isIbanCurrency', () => {
    it('is true for EMEA IBAN currencies and false otherwise', () => {
      expect(isIbanCurrency('EUR')).toBe(true);
      expect(isIbanCurrency('GBP')).toBe(true);
      expect(isIbanCurrency('MXN')).toBe(false);
      expect(isIbanCurrency('CAD')).toBe(false);
      expect(isIbanCurrency('USD')).toBe(false);
    });
  });

  describe('FX_RAIL_INFO', () => {
    it('describes ACH as the low-value tier and WIRE as the high-value tier', () => {
      expect(FX_RAIL_INFO.ACH.tier).toMatch(/low-value/i);
      expect(FX_RAIL_INFO.WIRE.tier).toMatch(/high-value/i);
    });
  });

  describe('recipient display labels', () => {
    it('uses FX rail tiers and sort-code label for GBP', () => {
      expect(isFxCreditCurrency('GBP')).toBe(true);
      expect(getRecipientPaymentMethodDisplayLabel('ACH', 'GBP')).toBe(
        'FX Low-value'
      );
      expect(getRecipientPaymentMethodDisplayLabel('WIRE', 'GBP')).toBe(
        'FX High-value'
      );
      expect(getRecipientRoutingFieldDisplayLabel('GBP')).toBe(
        'Sort code (or BIC)'
      );
    });

    it('keeps domestic ACH/WIRE codes and Routing Number for USD', () => {
      expect(isFxCreditCurrency('USD')).toBe(false);
      expect(getRecipientPaymentMethodDisplayLabel('ACH', 'USD')).toBe('ACH');
      expect(getRecipientPaymentMethodDisplayLabel('WIRE', 'USD')).toBe('WIRE');
      expect(getRecipientRoutingFieldDisplayLabel('USD')).toBe(
        'Routing Number'
      );
    });
  });
});
