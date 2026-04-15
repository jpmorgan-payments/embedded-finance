import { describe, expect, it, vi } from 'vitest';

import {
  AVAILABLE_COMPONENTS,
  getClientIdForScenario,
  getClientStatusOverrideForScenario,
  getGridDimensions,
  getHeaderDescriptionForScenario,
  getHeaderTitleForScenario,
  getNextScenario,
  getScenarioByKey,
  getScenarioKeyByDisplayName,
  getScenarioNumber,
  getVisibleComponentNamesForScenario,
  getVisibleComponentsForScenario,
  isComponentVisibleForScenario,
  isOnboardingDocsNeededScenario,
  SCENARIO_KEYS,
  SCENARIO_ORDER,
  shouldShowRecipientsForScenario,
} from './scenarios-config';

describe('scenarios-config', () => {
  describe('getNextScenario', () => {
    it('returns the next key in SCENARIO_ORDER', () => {
      expect(getNextScenario(SCENARIO_KEYS.NEW_SELLER_ONBOARDING)).toBe(
        SCENARIO_KEYS.ONBOARDING_IN_REVIEW
      );
    });

    it('wraps from last to first', () => {
      expect(
        getNextScenario(SCENARIO_KEYS.ACTIVE_SELLER_LIMITED_DDA_PAYMENTS)
      ).toBe(SCENARIO_KEYS.NEW_SELLER_ONBOARDING);
    });
  });

  describe('getScenarioKeyByDisplayName / getScenarioByKey', () => {
    it('resolves display name to key and back', () => {
      const key = getScenarioKeyByDisplayName('Linked Bank Account');
      expect(key).toBe(SCENARIO_KEYS.FRESH_START);
      expect(getScenarioByKey(key!).displayName).toBe('Linked Bank Account');
    });

    it('returns undefined for unknown display name', () => {
      expect(
        getScenarioKeyByDisplayName('Not A Real Scenario')
      ).toBeUndefined();
    });
  });

  describe('getClientStatusOverrideForScenario', () => {
    it('returns APPROVED for the last three active scenarios', () => {
      expect(getClientStatusOverrideForScenario('Linked Bank Account')).toBe(
        'APPROVED'
      );
      expect(
        getClientStatusOverrideForScenario('Seller with Limited DDA')
      ).toBe('APPROVED');
      expect(
        getClientStatusOverrideForScenario('Seller with Payments DDA')
      ).toBe('APPROVED');
    });

    it('returns undefined for onboarding scenarios', () => {
      expect(
        getClientStatusOverrideForScenario('New Seller - Onboarding')
      ).toBeUndefined();
    });

    it('returns undefined for empty input', () => {
      expect(getClientStatusOverrideForScenario(null)).toBeUndefined();
      expect(getClientStatusOverrideForScenario(undefined)).toBeUndefined();
    });
  });

  describe('shouldShowRecipientsForScenario', () => {
    it('is true only when Recipients is in visibleComponents', () => {
      expect(shouldShowRecipientsForScenario('Seller with Payments DDA')).toBe(
        true
      );
      expect(shouldShowRecipientsForScenario('Seller with Limited DDA')).toBe(
        false
      );
      expect(shouldShowRecipientsForScenario('New Seller - Onboarding')).toBe(
        false
      );
    });

    it('returns false for unknown scenario', () => {
      expect(shouldShowRecipientsForScenario('Unknown')).toBe(false);
    });
  });

  describe('getVisibleComponentsForScenario', () => {
    it('returns empty for onboarding scenarios', () => {
      expect(
        getVisibleComponentsForScenario('New Seller - Onboarding')
      ).toEqual([]);
    });

    it('returns configs for active scenarios with layout', () => {
      const configs = getVisibleComponentsForScenario(
        'Seller with Limited DDA'
      );
      expect(configs.length).toBeGreaterThan(0);
      expect(
        configs.some((c) => c.component === AVAILABLE_COMPONENTS.ACCOUNTS)
      ).toBe(true);
    });

    it('returns empty and warns for invalid scenario name', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(getVisibleComponentsForScenario('')).toEqual([]);
      expect(warn).toHaveBeenCalled();
      warn.mockRestore();
    });
  });

  describe('getVisibleComponentNamesForScenario', () => {
    it('lists component names in order', () => {
      const names = getVisibleComponentNamesForScenario(
        'Seller with Payments DDA'
      );
      expect(names).toContain('Recipients');
      expect(names).toContain('ClientDetails');
    });
  });

  describe('isComponentVisibleForScenario', () => {
    it('detects LinkedAccountWidget on Payments DDA scenario', () => {
      expect(
        isComponentVisibleForScenario(
          'Seller with Payments DDA',
          AVAILABLE_COMPONENTS.LINKED_ACCOUNTS
        )
      ).toBe(true);
    });

    it('is false when component not in layout', () => {
      expect(
        isComponentVisibleForScenario(
          'Seller with Limited DDA',
          AVAILABLE_COMPONENTS.RECIPIENTS
        )
      ).toBe(false);
    });
  });

  describe('getGridDimensions', () => {
    it('returns zeros for onboarding', () => {
      expect(getGridDimensions('New Seller - Onboarding')).toEqual({
        maxRows: 0,
        maxColumns: 0,
      });
    });

    it('computes max row and column from positions', () => {
      const { maxRows, maxColumns } = getGridDimensions(
        'Seller with Payments DDA'
      );
      expect(maxRows).toBeGreaterThan(0);
      expect(maxColumns).toBeGreaterThan(0);
    });
  });

  describe('getClientIdForScenario', () => {
    it('returns client id when defined', () => {
      expect(getClientIdForScenario('Linked Bank Account')).toBe('0030000131');
    });

    it('returns undefined for onboarding without client', () => {
      expect(getClientIdForScenario('New Seller - Onboarding')).toBeUndefined();
    });
  });

  describe('header helpers', () => {
    it('getHeaderTitleForScenario returns configured title or fallback', () => {
      expect(getHeaderTitleForScenario('Linked Bank Account')).toContain(
        'Bank'
      );
      expect(getHeaderTitleForScenario('___unknown___')).toBe(
        'Wallet Management'
      );
    });

    it('getHeaderDescriptionForScenario returns text for known scenario', () => {
      expect(
        getHeaderDescriptionForScenario('Seller with Limited DDA').length
      ).toBeGreaterThan(10);
    });
  });

  describe('isOnboardingDocsNeededScenario', () => {
    it('is true only for Docs Needed', () => {
      expect(isOnboardingDocsNeededScenario('Onboarding - Docs Needed')).toBe(
        true
      );
      expect(isOnboardingDocsNeededScenario('New Seller - Onboarding')).toBe(
        false
      );
    });
  });

  describe('getScenarioNumber', () => {
    it('returns 1-based index in SCENARIO_ORDER', () => {
      expect(getScenarioNumber('New Seller - Onboarding')).toBe(1);
      expect(getScenarioNumber('Seller with Payments DDA')).toBe(
        SCENARIO_ORDER.length
      );
    });

    it('falls back for unknown scenario', () => {
      expect(getScenarioNumber('unknown')).toBe(1);
    });
  });
});
