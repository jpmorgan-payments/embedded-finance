import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ConfigLoader,
  ConfigValidationError,
  MappingNotFoundError,
} from '../configLoader';
import { OnboardingCriteria } from '../../types';
import { ConfigValidationError } from '../configErrors';

// Mock fetch for testing
global.fetch = vi.fn();

describe('ConfigLoader', () => {
  let configLoader: ConfigLoader;

  beforeEach(() => {
    configLoader = ConfigLoader.getInstance();
    configLoader.resetCache();
    vi.clearAllMocks();
  });

  const mockValidConfig = {
    mappings: {
      'EMBEDDED_PAYMENTS-US-LLC': {
        product: 'EMBEDDED_PAYMENTS',
        jurisdiction: 'US',
        legalEntityType: 'LLC',
        arazzoFile:
          '/api-flow-explorer/data/arazzo-specs/embedded-payments-us-llc.yaml',
        requiredOperations: ['createClient', 'submitBusinessInformation'],
        displayName: 'Embedded Payments - US LLC',
        description: 'Test description',
      },
    },
    defaultCriteria: {
      product: 'EMBEDDED_PAYMENTS',
      jurisdiction: 'US',
      legalEntityType: 'LLC',
    },
    supportedCombinations: ['EMBEDDED_PAYMENTS-US-LLC'],
  };

  describe('loadConfig', () => {
    it('should load and validate configuration successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidConfig),
      });

      const config = await configLoader.loadConfig();
      expect(config).toEqual(mockValidConfig);
      expect(fetch).toHaveBeenCalledWith(
        '/api-flow-explorer/data/criteria-mapping.json',
      );
    });

    it('should throw ConfigValidationError for invalid configuration', async () => {
      const invalidConfig = {
        mappings: {},
        // Missing required fields
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidConfig),
      });

      await expect(configLoader.loadConfig()).rejects.toThrow(
        ConfigValidationError,
      );
    });

    it('should handle fetch errors', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(configLoader.loadConfig()).rejects.toThrow(
        'Failed to load configuration: 404 Not Found',
      );
    });
  });

  describe('getMappingForCriteria', () => {
    beforeEach(() => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidConfig),
      });
    });

    it('should return mapping for valid criteria', async () => {
      const criteria: OnboardingCriteria = {
        product: 'EMBEDDED_PAYMENTS',
        jurisdiction: 'US',
        legalEntityType: 'LLC',
      };

      const mapping = await configLoader.getMappingForCriteria(criteria);
      expect(mapping).toEqual(
        mockValidConfig.mappings['EMBEDDED_PAYMENTS-US-LLC'],
      );
    });

    it('should throw MappingNotFoundError for invalid criteria', async () => {
      const criteria: OnboardingCriteria = {
        product: 'EMBEDDED_PAYMENTS',
        jurisdiction: 'CA',
        legalEntityType: 'CORPORATION',
      };

      await expect(
        configLoader.getMappingForCriteria(criteria),
      ).rejects.toThrow(MappingNotFoundError);
    });
  });

  describe('isCombinationSupported', () => {
    beforeEach(() => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidConfig),
      });
    });

    it('should return true for supported combination', async () => {
      const criteria: OnboardingCriteria = {
        product: 'EMBEDDED_PAYMENTS',
        jurisdiction: 'US',
        legalEntityType: 'LLC',
      };

      const isSupported = await configLoader.isCombinationSupported(criteria);
      expect(isSupported).toBe(true);
    });

    it('should return false for unsupported combination', async () => {
      const criteria: OnboardingCriteria = {
        product: 'MERCHANT_SERVICES',
        jurisdiction: 'CA',
        legalEntityType: 'PARTNERSHIP',
      };

      const isSupported = await configLoader.isCombinationSupported(criteria);
      expect(isSupported).toBe(false);
    });
  });

  describe('getAvailableOptions', () => {
    beforeEach(() => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidConfig),
      });
    });

    it('should return available options from mappings', async () => {
      const options = await configLoader.getAvailableOptions();

      expect(options.products).toContain('EMBEDDED_PAYMENTS');
      expect(options.jurisdictions).toContain('US');
      expect(options.legalEntityTypes).toContain('LLC');
    });
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const result = configLoader.validateConfig(mockValidConfig);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidConfig = {
        mappings: {
          'TEST-KEY': {
            product: 'EMBEDDED_PAYMENTS',
            // Missing other required fields
          },
        },
      };

      const result = configLoader.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should detect key format mismatches', () => {
      const invalidConfig = {
        mappings: {
          'WRONG-KEY-FORMAT': {
            product: 'EMBEDDED_PAYMENTS',
            jurisdiction: 'US',
            legalEntityType: 'LLC',
            arazzoFile: '/test.yaml',
            requiredOperations: ['test'],
          },
        },
        defaultCriteria: {
          product: 'EMBEDDED_PAYMENTS',
          jurisdiction: 'US',
          legalEntityType: 'LLC',
        },
        supportedCombinations: ['WRONG-KEY-FORMAT'],
      };

      const result = configLoader.validateConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.code === 'INVALID_KEY_FORMAT')).toBe(
        true,
      );
    });
  });
});
