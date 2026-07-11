import { describe, expect, it } from 'vitest';

import {
  buildOnboardingFlowConfigExport,
  clearConfigProp,
  countConfiguredProps,
  HOSTED_PLATFORM_SAMPLE,
  mergeOnboardingFlowConfig,
  parseOnboardingFlowConfigImport,
  pickOnboardingFlowConfig,
  SELLSENSE_ONBOARDING_BASELINE,
  setConfigProp,
} from './onboarding-flow-props-config';

describe('onboarding-flow-props-config', () => {
  describe('pickOnboardingFlowConfig', () => {
    it('keeps known keys and strips callbacks', () => {
      const picked = pickOnboardingFlowConfig({
        showLinkAccountStep: true,
        hideLinkedAccountRemoval: true,
        onPostClientSettled: () => undefined,
        userEventsHandler: () => undefined,
        flowEntry: { screenId: 'overview' },
      } as Record<string, unknown>);

      expect(picked).toEqual({
        showLinkAccountStep: true,
        hideLinkedAccountRemoval: true,
      });
    });
  });

  describe('parseOnboardingFlowConfigImport', () => {
    it('accepts wrapped onboardingFlowConfig', () => {
      const result = parseOnboardingFlowConfigImport({
        onboardingFlowConfig: {
          showLinkAccountStep: false,
          hideLinkedAccountRemoval: true,
        },
      });
      expect(result).toEqual({
        ok: true,
        config: {
          showLinkAccountStep: false,
          hideLinkedAccountRemoval: true,
        },
      });
    });

    it('accepts bare props object', () => {
      const result = parseOnboardingFlowConfigImport({
        showLinkAccountStep: true,
        disclosureConfig: { platformName: 'SellSense' },
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.config.disclosureConfig).toEqual({
          platformName: 'SellSense',
        });
      }
    });

    it('rejects empty / unknown payloads', () => {
      expect(parseOnboardingFlowConfigImport(null).ok).toBe(false);
      expect(parseOnboardingFlowConfigImport({ foo: 1 }).ok).toBe(false);
    });
  });

  describe('buildOnboardingFlowConfigExport', () => {
    it('wraps props under onboardingFlowConfig', () => {
      expect(
        buildOnboardingFlowConfigExport({
          showLinkAccountStep: true,
          hideLinkedAccountRemoval: true,
        })
      ).toEqual({
        onboardingFlowConfig: {
          showLinkAccountStep: true,
          hideLinkedAccountRemoval: true,
        },
      });
    });
  });

  describe('mergeOnboardingFlowConfig', () => {
    it('merges baseline with overrides and nested link options', () => {
      const merged = mergeOnboardingFlowConfig(SELLSENSE_ONBOARDING_BASELINE, {
        hideLinkedAccountRemoval: true,
        linkAccountStepOptions: {
          completionMode: 'prefillSummary',
          initialValues: {},
        },
      });

      expect(merged.showLinkAccountStep).toBe(true);
      expect(merged.hideLinkedAccountRemoval).toBe(true);
      expect(merged.availableProducts).toEqual(['EMBEDDED_PAYMENTS']);
      expect(merged.linkAccountStepOptions).toEqual({
        completionMode: 'prefillSummary',
        initialValues: {},
      });
    });
  });

  describe('setConfigProp / clearConfigProp / countConfiguredProps', () => {
    it('tracks configured override keys', () => {
      let overrides = setConfigProp({}, 'hideLinkedAccountRemoval', true);
      expect(countConfiguredProps(overrides)).toBe(1);
      overrides = setConfigProp(overrides, 'showLinkAccountStep', false);
      expect(countConfiguredProps(overrides)).toBe(2);
      overrides = clearConfigProp(overrides, 'showLinkAccountStep');
      expect(countConfiguredProps(overrides)).toBe(1);
      expect(overrides).toEqual({ hideLinkedAccountRemoval: true });
    });

    it('does not count values that match the demo baseline', () => {
      let overrides = setConfigProp({}, 'showLinkAccountStep', true);
      expect(overrides).toEqual({});
      expect(countConfiguredProps(overrides)).toBe(0);

      overrides = setConfigProp({}, 'hideLinkedAccountRemoval', true);
      overrides = setConfigProp(overrides, 'hideLinkedAccountRemoval', false);
      expect(overrides).toEqual({});
      expect(countConfiguredProps(overrides)).toBe(0);
    });
  });

  describe('HOSTED_PLATFORM_SAMPLE', () => {
    it('exports a non-empty sample matching hosted config keys', () => {
      const picked = pickOnboardingFlowConfig(HOSTED_PLATFORM_SAMPLE);
      expect(picked.hideLinkedAccountRemoval).toBe(true);
      expect(picked.linkAccountStepOptions).toMatchObject({
        completionMode: 'prefillSummary',
      });
      expect(picked.disclosureConfig?.platformName).toBe('Platform, Inc.');
    });
  });
});
