import { EBTheme } from './config.types';

/**
 * Default theme configuration following Salt Design System nomenclature.
 * @see https://www.saltdesignsystem.com/salt/themes/design-tokens/how-to-read-tokens
 */
export const defaultTheme: EBTheme = {
  colorScheme: 'system',
  variables: {
    // ═══════════════════════════════════════════════════════════════════════════
    // CONTENT CHARACTERISTIC - Typography
    // ═══════════════════════════════════════════════════════════════════════════
    contentFontFamily: 'Geist',

    // ═══════════════════════════════════════════════════════════════════════════
    // SEPARABLE CHARACTERISTIC - Borders
    // ═══════════════════════════════════════════════════════════════════════════
    separableBorderRadius: '0.375rem',

    // ═══════════════════════════════════════════════════════════════════════════
    // LAYOUT & SPACING
    // ═══════════════════════════════════════════════════════════════════════════
    spacingUnit: '0.25rem',

    // ═══════════════════════════════════════════════════════════════════════════
    // OVERLAYABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    overlayableZIndex: 100,

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Buttons
    // ═══════════════════════════════════════════════════════════════════════════
    actionableFontWeight: '500',
    actionableFontSize: '0.875rem',
    actionableLineHeight: '1.25rem',
    actionableTextTransform: 'none',
    actionableLetterSpacing: '0em',
    actionableShiftOnActive: true,
    actionablePrimaryBorderWidth: '0rem',
    actionableSecondaryBorderWidth: '0rem',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Negative (Destructive)
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentNegativeBorderWidth: '0rem',

    // ═══════════════════════════════════════════════════════════════════════════
    // EDITABLE CHARACTERISTIC - Form Labels
    // ═══════════════════════════════════════════════════════════════════════════
    editableLabelFontSize: '0.875rem',
    editableLabelLineHeight: '1.25rem',
    editableLabelFontWeight: '500',
  },
  light: {
    // ═══════════════════════════════════════════════════════════════════════════
    // CONTAINER CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    containerBackground: 'hsl(0 0% 100%)',
    contentPrimaryForeground: 'hsl(240 10% 3.9%)',
    containerPrimaryBackground: 'hsl(0 0% 100%)',
    containerPrimaryForeground: 'hsl(240 10% 3.9%)',
    containerSecondaryBackground: 'hsl(240 4.8% 95.9%)',
    containerSecondaryForeground: 'hsl(240 3.8% 46.1%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // EDITABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    editableLabelForeground: 'hsl(240 10% 3.9%)',
    editableBackground: 'hsl(0 0% 100%)',
    editableBorderColor: 'hsl(240 5.9% 90%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // OVERLAYABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    overlayableBackground: 'hsl(0 0% 100%)',
    overlayableForeground: 'hsl(240 10% 3.9%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Primary Variant
    // ═══════════════════════════════════════════════════════════════════════════
    actionablePrimaryBackground: '#155C93',
    actionablePrimaryForeground: 'hsl(0 0% 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Secondary Variant
    // ═══════════════════════════════════════════════════════════════════════════
    actionableSecondaryBackground: 'hsl(240 4.8% 95.9%)',
    actionableSecondaryForeground: 'hsl(240 5.9% 10%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACCENT CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    accentBackground: 'hsl(240 4.8% 95.9%)',
    accentForeground: 'hsl(240 5.9% 10%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Negative
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentNegativeBackground: 'hsl(0 84.2% 60.2%)',
    sentimentNegativeForeground: 'hsl(0 0% 98%)',
    sentimentNegativeAccentBackground: '#FFECEA',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Positive
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentPositiveForeground: '#00875D',
    sentimentPositiveAccentBackground: '#EAF5F2',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Caution
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentCautionForeground: '#C75300',
    sentimentCautionAccentBackground: '#FFECD9',

    // ═══════════════════════════════════════════════════════════════════════════
    // STATUS CHARACTERISTIC - Info
    // ═══════════════════════════════════════════════════════════════════════════
    statusInfoForeground: '#0078CF',
    statusInfoAccentBackground: '#EAF6FF',

    // ═══════════════════════════════════════════════════════════════════════════
    // SEPARABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    separableBorderColor: 'hsl(240 5.9% 90%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // FOCUSED CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    focusedRingColor: 'hsl(240 10% 3.9%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVIGABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    navigableBackground: 'hsl(0 0% 98%)',
    navigableForeground: 'hsl(240 5.3% 26.1%)',
    navigableAccentBackground: 'hsl(240 4.8% 95.9%)',
    navigableAccentForeground: 'hsl(240 5.9% 10%)',

    // Legacy alert tokens (maps to container secondary)
    alertColor: 'hsl(0 0% 100%)',
    alertForegroundColor: 'hsl(240 10% 3.9%)',
  },
  dark: {
    // ═══════════════════════════════════════════════════════════════════════════
    // CONTAINER CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    containerBackground: 'hsl(240 10% 3.9%)',
    contentPrimaryForeground: 'hsl(0 0% 98%)',
    containerPrimaryBackground: 'hsl(240 10% 3.9%)',
    containerPrimaryForeground: 'hsl(0 0% 98%)',
    containerSecondaryBackground: 'hsl(240 3.7% 15.9%)',
    containerSecondaryForeground: 'hsl(240 5% 64.9%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // EDITABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    editableLabelForeground: 'hsl(0 0% 98%)',
    editableBackground: 'hsl(240 3.7% 15.9%)',
    editableBorderColor: 'hsl(240 3.7% 15.9%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // OVERLAYABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    overlayableBackground: 'hsl(240 10% 3.9%)',
    overlayableForeground: 'hsl(0 0% 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Primary Variant
    // ═══════════════════════════════════════════════════════════════════════════
    actionablePrimaryBackground: '#155C93',
    actionablePrimaryForeground: 'hsl(0 0% 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Secondary Variant
    // ═══════════════════════════════════════════════════════════════════════════
    actionableSecondaryBackground: 'hsl(240 3.7% 15.9%)',
    actionableSecondaryForeground: 'hsl(0 0% 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACCENT CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    accentBackground: 'hsl(240 3.7% 15.9%)',
    accentForeground: 'hsl(0 0% 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Negative
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentNegativeBackground: 'hsl(0 74% 54%)',
    sentimentNegativeForeground: 'hsl(0 0% 98%)',
    sentimentNegativeAccentBackground: '#FFECEA',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Positive
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentPositiveForeground: '#00875D',
    sentimentPositiveAccentBackground: '#EAF5F2',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Caution
    // ═══════════════════════════════════════════════════════════════════════════
    sentimentCautionForeground: '#C75300',
    sentimentCautionAccentBackground: '#FFECD9',

    // ═══════════════════════════════════════════════════════════════════════════
    // STATUS CHARACTERISTIC - Info
    // ═══════════════════════════════════════════════════════════════════════════
    statusInfoForeground: '#0078CF',
    statusInfoAccentBackground: '#EAF6FF',

    // ═══════════════════════════════════════════════════════════════════════════
    // SEPARABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    separableBorderColor: 'hsl(240 3.7% 15.9%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // FOCUSED CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    focusedRingColor: 'hsl(240 4.9% 83.9%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // NAVIGABLE CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    navigableBackground: 'hsl(240 5.9% 10%)',
    navigableForeground: 'hsl(240 4.8% 95.9%)',
    navigableAccentBackground: 'hsl(240 3.7% 15.9%)',
    navigableAccentForeground: 'hsl(240 4.8% 95.9%)',

    // Legacy alert tokens (maps to container secondary)
    alertColor: 'hsl(240 3.7% 15.9%)',
    alertForegroundColor: 'hsl(0 0% 98%)',
  },
};
