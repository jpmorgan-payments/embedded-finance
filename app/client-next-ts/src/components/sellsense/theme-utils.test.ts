import { describe, expect, it } from 'vitest';

import { createThemeStyleUtils } from './theme-utils';
import type { ThemeOption } from './use-sellsense-themes';

const ALL_THEMES: ThemeOption[] = [
  'Empty',
  'Empty+',
  'Default Blue',
  'Salt Theme',
  'Create Commerce',
  'SellSense',
  'PayFicient',
  'Custom',
];

function exerciseThemeUtils(theme: ThemeOption) {
  const u = createThemeStyleUtils(theme);
  u.getHeaderStyles();
  u.getHeaderLabelStyles();
  u.getHeaderSelectStyles();
  u.getHeaderButtonStyles();
  u.getHeaderTextStyles();
  u.getHeaderCompanyTextStyles();
  u.getHeaderSettingsButtonStyles();
  u.getSidebarStyles();
  u.getSidebarButtonStyles(false);
  u.getSidebarButtonStyles(true);
  u.getSidebarLabelStyles();
  u.getSidebarTextStyles();
  u.getCardStyles();
  u.getIconStyles();
  u.getTagStyles();
  u.getDialogStyles();
  u.getModalStyles();
  u.getContentAreaStyles();
  u.getLogoPath();
  u.getLogoAlt();
  u.getLogoStyles();
  u.getLayoutButtonStyles(false);
  u.getLayoutButtonStyles(true);
  u.getAlertStyles();
  u.getAlertTextStyles();
  u.getAlertButtonStyles();
}

describe('createThemeStyleUtils', () => {
  it('exercises every style getter for each theme option', () => {
    ALL_THEMES.forEach(exerciseThemeUtils);
  });

  it('maps SellSense to brand header and logo', () => {
    const u = createThemeStyleUtils('SellSense');
    expect(u.getHeaderStyles()).toContain('F7F3F0');
    expect(u.getLogoPath()).toBe('/sellSense.svg');
    expect(u.getLogoAlt()).toBe('SellSense Logo');
  });

  it('uses neutral styling and hides logo for Empty theme', () => {
    const u = createThemeStyleUtils('Empty');
    expect(u.getHeaderStyles()).toContain('gray-50');
    expect(u.getLogoPath()).toBe('');
    expect(u.getLogoStyles()).toContain('hidden');
  });

  it('differentiates sidebar selected state', () => {
    const u = createThemeStyleUtils('SellSense');
    expect(u.getSidebarButtonStyles(true)).not.toBe(
      u.getSidebarButtonStyles(false)
    );
  });

  it('falls back to default branch for unlisted theme values', () => {
    const u = createThemeStyleUtils('Not A Theme' as unknown as ThemeOption);
    expect(u.getHeaderStyles()).toContain('bg-white');
  });
});
