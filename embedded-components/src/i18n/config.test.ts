import { describe, expect, it } from 'vitest';

import {
  createI18nInstance,
  defaultResources,
  i18n,
  resources,
} from './config';

describe('i18n/config', () => {
  describe('defaultResources', () => {
    it('has enUS, frCA, and esUS locales', () => {
      expect(defaultResources).toHaveProperty('enUS');
      expect(defaultResources).toHaveProperty('frCA');
      expect(defaultResources).toHaveProperty('esUS');
    });

    it('each locale has the expected namespaces', () => {
      const expectedNamespaces = [
        'common',
        'validation',
        'onboarding-overview',
        'make-payment',
        'linked-accounts',
        'bank-account-form',
        'client-details',
        'accounts',
        'recipients',
        'transactions',
        'zod',
      ];

      for (const ns of expectedNamespaces) {
        expect(defaultResources.enUS).toHaveProperty(ns);
      }
    });

    it('has locale identifiers', () => {
      expect(defaultResources.enUS.locale).toBe('en-US');
      expect(defaultResources.frCA.locale).toBe('fr-CA');
      expect(defaultResources.esUS.locale).toBe('es-US');
    });
  });

  describe('resources (mutable clone)', () => {
    it('is a deep clone of defaultResources', () => {
      expect(resources.enUS.locale).toBe(defaultResources.enUS.locale);
      // Should not be the same reference
      expect(resources).not.toBe(defaultResources);
    });
  });

  describe('global i18n instance', () => {
    it('is initialized with enUS as default language', () => {
      expect(i18n.language).toBe('enUS');
    });

    it('has fallback language set to enUS', () => {
      expect(i18n.options.fallbackLng).toContain('enUS');
    });

    it('can translate a known key', () => {
      // common namespace should have error messages
      const result = i18n.t('errors.defaultMessages.500', { ns: 'common' });
      expect(result).toBeTruthy();
      expect(result).not.toBe('errors.defaultMessages.500');
    });

    it('interpolation format handles "inc" format', () => {
      // The format function should increment numbers
      const formatted = i18n.options.interpolation?.format?.(
        '5',
        'inc',
        'enUS'
      );
      expect(formatted).toBe(6);
    });

    it('interpolation format handles non-numeric "inc"', () => {
      const formatted = i18n.options.interpolation?.format?.(
        'abc',
        'inc',
        'enUS'
      );
      // NaN check fails, returns original value
      expect(formatted).toBe('abc');
    });

    it('interpolation format handles "dateOnly" format', () => {
      const date = new Date('2026-03-15');
      const formatted = i18n.options.interpolation?.format?.(
        date,
        'dateOnly',
        'enUS'
      );
      expect(formatted).toContain('2026');
      expect(formatted).toContain('March');
    });

    it('interpolation format returns value for unknown format', () => {
      const formatted = i18n.options.interpolation?.format?.(
        'hello',
        'unknown',
        'enUS'
      );
      expect(formatted).toBe('hello');
    });
  });

  describe('createI18nInstance', () => {
    it('creates an isolated instance with default config', () => {
      const instance = createI18nInstance(undefined);
      expect(instance.language).toBe('enUS');
      expect(instance).not.toBe(i18n);
    });

    it('respects the "name" option for language', () => {
      const instance = createI18nInstance({ name: 'frCA' });
      expect(instance.language).toBe('frCA');
    });

    it('applies custom content tokens', () => {
      const instance = createI18nInstance({
        tokens: {
          common: { errors: { unknownError: 'Custom Error' } } as any,
        },
      });

      const result = instance.t('errors.unknownError', { ns: 'common' });
      expect(result).toBe('Custom Error');
    });

    it('does not mutate the global i18n instance', () => {
      const originalValue = i18n.t('errors.unknownError', { ns: 'common' });

      createI18nInstance({
        tokens: {
          common: { errors: { unknownError: 'Changed!' } } as any,
        },
      });

      const afterValue = i18n.t('errors.unknownError', { ns: 'common' });
      expect(afterValue).toBe(originalValue);
    });

    it('instance format handles dateOnly with locale lookup', () => {
      const instance = createI18nInstance({ name: 'frCA' });
      const date = new Date('2026-06-15');
      const formatted = instance.options.interpolation?.format?.(
        date,
        'dateOnly',
        'frCA'
      );
      expect(formatted).toContain('2026');
    });

    it('instance format returns value for unknown format', () => {
      const instance = createI18nInstance(undefined);
      const formatted = instance.options.interpolation?.format?.(
        'test',
        'nope',
        'enUS'
      );
      expect(formatted).toBe('test');
    });
  });
});
