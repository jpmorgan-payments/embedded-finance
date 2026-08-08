import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  deleteMasterModePreset,
  listMasterModePresets,
  saveMasterModePreset,
} from './master-mode-presets-storage';

describe('master-mode-presets-storage', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('saves, lists, updates, and deletes named presets', () => {
    const created = saveMasterModePreset({
      name: 'Partner Alpha',
      bundle: {
        theme: { baseTheme: 'Empty', variables: { primaryColor: '#123456' } },
        contentTokens: {
          name: 'enUS',
          tokens: { common: { errors: { footnote: 'Help' } } },
        },
        onboardingFlowPropOverrides: { showLinkAccountStep: true },
      },
    });

    expect(created.fileName).toBe('partner-alpha.json');
    expect(listMasterModePresets()).toHaveLength(1);

    const updated = saveMasterModePreset({
      id: created.id,
      name: 'Partner Alpha v2',
      fileName: 'partner-alpha-v2.json',
      bundle: {
        theme: { baseTheme: 'Empty', variables: { primaryColor: '#abcdef' } },
      },
    });

    expect(updated.name).toBe('Partner Alpha v2');
    expect(updated.fileName).toBe('partner-alpha-v2.json');
    expect(
      listMasterModePresets()[0]?.bundle.theme?.variables?.primaryColor
    ).toBe('#abcdef');

    deleteMasterModePreset(created.id);
    expect(listMasterModePresets()).toHaveLength(0);
  });
});
