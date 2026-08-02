import { describe, expect, it } from 'vitest';

import {
  describeMasterModeFormat,
  groupContentTokenKeys,
  parseMasterModeImport,
  parseMasterModeText,
  toSafeFileName,
} from './master-mode-bundle';

const SAMPLE_CONTENT_OVERRIDE = {
  contentTokens: {
    'features.Support.ClientInfoError.title': 'trouble',
  },
  globalConfiguration: {
    enabledCapabilities: 'C2_EP_HOSTED_UI',
    ebDesignTokens: {
      primaryColor: '#1B7F9E',
      borderRadius: '0.375rem',
      fontFamily: 'Open Sans, system-ui, sans-serif',
      destructiveColor: '#dc2626',
    },
    embeddedComponentsContentTokens: {
      name: 'enUS',
      tokens: {
        common: {
          errors: {
            footnote: 'Contact support',
          },
        },
        'onboarding-overview': {
          fields: {
            controllerEmail: {
              label: 'Franchisee Email',
            },
          },
        },
      },
    },
    saltEPDesignTokens: {
      actionableAccentedBoldBackground: '#1A7B99',
      contentFontFamily: 'Open Sans',
    },
    onboardingFlowConfig: {
      availableProducts: ['EMBEDDED_PAYMENTS'],
      availableJurisdictions: ['US'],
      showLinkAccountStep: true,
      hideLinkedAccountRemoval: true,
      disclosureConfig: {
        platformName: 'Example Platform',
        platformAgreementLabel: 'Program Agreement',
      },
    },
  },
};

describe('parseMasterModeImport', () => {
  it('parses contentOverride with globalConfiguration', () => {
    const result = parseMasterModeImport(SAMPLE_CONTENT_OVERRIDE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.format).toBe('content-override');
    expect(result.summary.themeVariableCount).toBeGreaterThan(0);
    expect(result.summary.contentTokenCount).toBeGreaterThan(0);
    expect(result.summary.configPropCount).toBeGreaterThan(0);
    expect(
      result.bundle.theme?.variables?.actionableAccentedBoldBackground
    ).toBe('#1A7B99');
    expect(result.bundle.theme?.variables?.primaryColor).toBe('#1B7F9E');
    expect(result.bundle.contentTokens?.tokens?.common).toBeTruthy();
    expect(result.bundle.onboardingFlowPropOverrides?.showLinkAccountStep).toBe(
      true
    );
    expect(result.summary.sources.theme).toBe('saltEPDesignTokens');
    expect(result.summary.sources.contentTokens).toBe(
      'embeddedComponentsContentTokens'
    );
    expect(result.summary.sources.config).toBe('onboardingFlowConfig');
  });

  it('parses stringified contentOverride inside a page model', () => {
    const model = {
      title: 'Hosted UI',
      templateName: 'spa-page-template',
      ':items': {
        root: {
          ':items': {
            responsivegrid: {
              ':items': {
                c1app: {
                  contentOverride: JSON.stringify(SAMPLE_CONTENT_OVERRIDE),
                },
              },
            },
          },
        },
      },
    };

    const result = parseMasterModeImport(model);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.format).toBe('hosted-page-model');
    expect(
      result.bundle.onboardingFlowPropOverrides?.hideLinkedAccountRemoval
    ).toBe(true);
    expect(result.summary.contentTokenCount).toBeGreaterThan(0);
  });

  it('parses a native master bundle', () => {
    const result = parseMasterModeImport({
      kind: 'sellsense-master-customization',
      version: 1,
      name: 'Demo',
      fileName: 'demo.json',
      theme: {
        baseTheme: 'Empty',
        variables: { primaryColor: '#111111' },
      },
      contentTokens: {
        name: 'enUS',
        tokens: { common: { errors: { footnote: 'Hi' } } },
      },
      onboardingFlowPropOverrides: {
        showDisclosureFooter: true,
      },
      mocks: {
        'GET /ef/do/v1/accounts': { items: [] },
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.format).toBe('master-bundle');
    expect(result.summary.mockOverrideCount).toBe(1);
    expect(result.bundle.theme?.variables?.primaryColor).toBe('#111111');
  });

  it('rejects empty payloads', () => {
    expect(parseMasterModeImport(null).ok).toBe(false);
    expect(parseMasterModeImport({ foo: 1 }).ok).toBe(false);
  });
});

describe('parseMasterModeText', () => {
  it('validates and recognizes pasted page-model JSON', () => {
    const text = JSON.stringify({
      ':type': 'jpmc-ebx/components/page',
      ':items': {
        root: {
          contentOverride: JSON.stringify(SAMPLE_CONTENT_OVERRIDE),
        },
      },
    });

    const result = parseMasterModeText(text);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.format).toBe('hosted-page-model');
    expect(describeMasterModeFormat(result.format)).toMatch(
      /hosted page model/i
    );
  });

  it('rejects invalid JSON with a clear error', () => {
    const result = parseMasterModeText('{ "foo": ');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/Invalid JSON/i);
  });

  it('rejects empty paste', () => {
    expect(parseMasterModeText('   ').ok).toBe(false);
  });
});

describe('toSafeFileName', () => {
  it('slugifies names', () => {
    expect(toSafeFileName('Chick fil A Hosted')).toBe(
      'chick-fil-a-hosted.json'
    );
    expect(toSafeFileName('  ')).toBe('master-customization.json');
  });
});

describe('groupContentTokenKeys', () => {
  it('groups by namespace', () => {
    const groups = groupContentTokenKeys({
      common: { errors: { footnote: 'a' } },
      'onboarding-overview': {
        fields: { controllerEmail: { label: 'Email' } },
      },
    });
    expect(groups.map((g) => g.namespace).sort()).toEqual([
      'common',
      'onboarding-overview',
    ]);
    expect(groups.find((g) => g.namespace === 'common')?.count).toBe(1);
  });
});
