import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';

const contentFontStack =
  '"Neue Haas Unica Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';
const headingFontStack =
  '"Futura Passata", "Neue Haas Unica Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif';

/**
 * Theme tokens for `/test-scenario-3` only — deep-green brand on a warm neutral shell.
 * Derived from the hosted-UI `saltEPDesignTokens` / `ebDesignTokens` configuration.
 */
export const TEST_SCENARIO_3_THEME_VARIABLES = {
  // Typography (saltEPDesignTokens contentFontFamily / actionableFontFamily / textHeadingFontFamily)
  contentFontFamily: contentFontStack,
  actionableFontFamily: contentFontStack,
  textHeadingFontFamily: headingFontStack,

  // Radii (ebDesignTokens borderRadius / buttonBorderRadius)
  actionableBorderRadius: '0.375rem',
  editableBorderRadius: '0.375rem',
  separableBorderRadius: '0.375rem',

  // Containers / surfaces
  containerPrimaryBackground: '#F2F0EC',
  containerSecondaryBackground: '#E9E4D9',
  containerCardBackground: '#FFFFFF',
  containerPrimaryForeground: '#1D3C34',
  containerSecondaryForeground: '#1D3C34',
  contentPrimaryForeground: '#1D3C34',

  // Inputs (editableBackground + ebDesignTokens borderColor)
  editableBackground: '#FFFFFF',
  editableBorderColor: '#e5e7eb',
  separableBorderColor: '#e5e7eb',

  // Overlays
  overlayableForeground: '#1D3C34',

  // Primary CTA (actionableAccentedBold*)
  actionableAccentedBoldBackground: '#1D3C34',
  actionableAccentedBoldBackgroundHover: '#162E28',
  actionableAccentedBoldBackgroundActive: '#0F211D',
  actionableAccentedBoldForeground: '#FFFFFF',

  // Subtle / link actions (actionableSubtleForeground*)
  actionableSubtleForeground: '#1D3C34',
  actionableSubtleForegroundHover: '#162E28',
  actionableSubtleForegroundActive: '#0F211D',

  // Sentiment
  sentimentPositiveForeground: '#1D3C34',
  sentimentPositiveAccentBackground: '#FFFFFF',
  sentimentCautionForeground: '#1D3C34',
  sentimentCautionAccentBackground: '#FDBE87',

  // Destructive (actionableNegativeBold* / ebDesignTokens destructiveColor)
  actionableNegativeBoldBackground: '#EF4444',
  actionableNegativeBoldForeground: '#FAFAFA',

  // Status
  statusInfoAccentBackground: '#B6DFF2',

  // Focus ring (focusedRingColor / ebDesignTokens ringColor)
  focusedRingColor: '#0060f0',
} satisfies EBThemeVariables;
