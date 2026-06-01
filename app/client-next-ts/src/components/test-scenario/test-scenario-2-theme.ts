import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';

const fontStack =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif';

/**
 * Theme tokens for `/test-scenario-2` only — warm neutral shell, dark primary CTAs, teal accents.
 * Derived from the reference UX site palette (not registered in SellSense theme options).
 */
export const TEST_SCENARIO_2_THEME_VARIABLES = {
  contentFontFamily: fontStack,
  textHeadingFontFamily: fontStack,
  actionableFontFamily: fontStack,
  actionableFontWeight: '600',
  actionableFontSize: '0.875rem',
  actionableLineHeight: '1.25rem',
  actionableTextTransform: 'none',
  actionableLetterSpacing: '0em',
  actionableAccentedBoldFontWeight: '600',
  actionableSubtleFontWeight: '600',
  actionableShiftOnActive: false,
  actionableBorderRadius: '4px',
  editableBorderRadius: '4px',
  editableLabelFontSize: '0.75rem',
  editableLabelLineHeight: '1rem',
  editableLabelFontWeight: '600',
  separableBorderRadius: '6px',
  spacingUnit: '0.25rem',

  containerPrimaryBackground: '#FBF9F8',
  containerCardBackground: '#FFFFFF',
  containerPrimaryForeground: '#161513',
  containerSecondaryBackground: '#F5F4F2',
  containerSecondaryForeground: '#6B6762',
  contentPrimaryForeground: '#161513',
  overlayableBackground: '#FFFFFF',
  overlayableForeground: '#161513',
  accentBackground: '#F5F4F2',
  accentForeground: '#161513',
  contentAccentForeground: '#6B6762',
  editableBackground: '#FFFFFF',
  editableBorderColor: '#807B77',
  editableLabelForeground: '#161513',
  separableBorderColor: '#E8E6E4',

  actionableAccentedBoldBackground: '#312D2A',
  actionableAccentedBoldBackgroundHover: '#211E1C',
  actionableAccentedBoldBackgroundActive: '#1A1816',
  actionableAccentedBoldForeground: '#FFFFFF',
  actionableAccentedBoldBorderWidth: '0px',

  actionableSubtleBackground: '#FFFFFF',
  actionableSubtleBackgroundHover: '#F5F4F2',
  actionableSubtleBackgroundActive: '#F1EFED',
  actionableSubtleForeground: '#0E7297',
  actionableSubtleForegroundHover: '#00688C',
  actionableSubtleForegroundActive: '#025E7E',
  actionableSubtleBorderWidth: '1px',

  focusedRingColor: '#0E7297',

  actionableNegativeBoldBackground: '#B3311F',
  actionableNegativeBoldBackgroundHover: '#AA2222',
  actionableNegativeBoldBackgroundActive: '#8F2A1A',
  actionableNegativeBoldForeground: '#FFFFFF',
  sentimentNegativeAccentBackground: '#FFEBE8',
  sentimentPositiveForeground: '#436B1D',
  sentimentPositiveAccentBackground: '#E4F5D3',
  sentimentCautionForeground: '#8F520A',
  sentimentCautionAccentBackground: '#FCEDDC',
  statusInfoForeground: '#0E7297',
  statusInfoAccentBackground: '#E4F1F7',
  statusSuccessForeground: '#436B1D',
  statusSuccessAccentBackground: '#E4F5D3',
  statusWarningForeground: '#8F520A',
  statusWarningAccentBackground: '#FCEDDC',
} satisfies EBThemeVariables;
