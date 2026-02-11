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
    textHeadingFontFamily: 'Geist',

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
    actionableAccentedBoldBorderWidth: '0rem',
    actionableSubtleBorderWidth: '0rem',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE NEGATIVE CHARACTERISTIC - Destructive
    // ═══════════════════════════════════════════════════════════════════════════
    actionableNegativeBoldBorderWidth: '0rem',

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
    containerPrimaryBackground: 'hsl(0 0% 100%)',
    contentPrimaryForeground: 'hsl(240 10% 3.9%)',
    containerCardBackground: 'hsl(0 0% 100%)',
    containerPrimaryForeground: 'hsl(240 10% 3.9%)',
    containerSecondaryBackground: 'hsl(240 4.8% 95.9%)',
    // Updated from 46.1% to 40% lightness for WCAG AA 4.5:1 contrast ratio compliance
    containerSecondaryForeground: 'hsl(240 3.8% 40%)',

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
    // ACTIONABLE CHARACTERISTIC - Accented Bold Variant (solid CTA)
    // ═══════════════════════════════════════════════════════════════════════════
    actionableAccentedBoldBackground: '#155C93',
    actionableAccentedBoldForeground: 'hsl(0 0% 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Subtle Variant (transparent neutral)
    // ═══════════════════════════════════════════════════════════════════════════
    actionableSubtleBackground: 'hsl(240 4.8% 95.9%)',
    actionableSubtleForeground: 'hsl(240 5.9% 10%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACCENT CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    accentBackground: 'hsl(240 4.8% 95.9%)',
    contentAccentForeground: 'hsl(240 5.9% 10%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Negative Bold Variant (solid destructive)
    // ═══════════════════════════════════════════════════════════════════════════
    actionableNegativeBoldBackground: 'hsl(0 84.2% 60.2%)',
    actionableNegativeBoldForeground: 'hsl(0 0% 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Negative (non-actionable contexts)
    // ═══════════════════════════════════════════════════════════════════════════
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
    containerPrimaryBackground: 'hsl(240 10% 3.9%)',
    contentPrimaryForeground: 'hsl(0 0% 98%)',
    containerCardBackground: 'hsl(240 10% 3.9%)',
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
    // ACTIONABLE CHARACTERISTIC - Accented Bold Variant (solid CTA)
    // ═══════════════════════════════════════════════════════════════════════════
    actionableAccentedBoldBackground: '#155C93',
    actionableAccentedBoldForeground: 'hsl(0 0% 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Subtle Variant (transparent neutral)
    // ═══════════════════════════════════════════════════════════════════════════
    actionableSubtleBackground: 'hsl(240 3.7% 15.9%)',
    actionableSubtleForeground: 'hsl(0 0% 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACCENT CHARACTERISTIC
    // ═══════════════════════════════════════════════════════════════════════════
    accentBackground: 'hsl(240 3.7% 15.9%)',
    contentAccentForeground: 'hsl(0 0% 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // ACTIONABLE CHARACTERISTIC - Negative Bold Variant (solid destructive)
    // ═══════════════════════════════════════════════════════════════════════════
    actionableNegativeBoldBackground: 'hsl(0 74% 54%)',
    actionableNegativeBoldForeground: 'hsl(0 0% 98%)',

    // ═══════════════════════════════════════════════════════════════════════════
    // SENTIMENT CHARACTERISTIC - Negative (non-actionable contexts)
    // ═══════════════════════════════════════════════════════════════════════════
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
