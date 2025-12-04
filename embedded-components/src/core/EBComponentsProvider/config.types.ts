import { defaultResources } from '@/i18n/config';
import { DefaultOptions } from '@tanstack/react-query';
import { DeepPartial } from 'react-hook-form';

export type EBColorScheme = 'dark' | 'light' | 'system';

/**
 * Design Token naming follows Salt Design System nomenclature:
 * @see https://www.saltdesignsystem.com/salt/themes/design-tokens/how-to-read-tokens
 *
 * Token format: [characteristic][Specifier][Emphasis][Variant][Property][State]
 *
 * Characteristics:
 * - actionable: Interactive elements (buttons, links)
 * - container: Surfaces and backgrounds
 * - content: Text and icons
 * - editable: Form inputs
 * - overlayable: Popovers, dialogs, tooltips
 * - navigable: Navigation elements
 * - separable: Borders, dividers
 * - focused: Focus ring indicators
 * - sentiment: Negative, positive, caution emotions
 * - status: Info, error, success, warning states
 *
 * Properties:
 * - background: Background colors
 * - foreground: Text/icon colors
 * - borderColor: Border colors
 *
 * States:
 * - hover: Hover state
 * - active: Active/pressed state
 * - disabled: Disabled state
 */
export type EBThemeVariables = {
  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT CHARACTERISTIC - Typography and text properties
  // ═══════════════════════════════════════════════════════════════════════════

  /** Primary font family for body text and general content */
  contentFontFamily?: string;

  /** Font family for headings (h1-h6) */
  contentHeaderFontFamily?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTAINER CHARACTERISTIC - Surfaces and layout backgrounds
  // ═══════════════════════════════════════════════════════════════════════════

  /** Base page background color */
  containerBackground?: string;

  /** Primary text color on containers */
  contentPrimaryForeground?: string;

  /** Primary surface background (cards, panels) */
  containerPrimaryBackground?: string;

  /** Text color on primary surfaces */
  containerPrimaryForeground?: string;

  /** Secondary surface background (muted areas) */
  containerSecondaryBackground?: string;

  /** Text color on secondary surfaces */
  containerSecondaryForeground?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONABLE CHARACTERISTIC - Buttons and interactive elements
  // ═══════════════════════════════════════════════════════════════════════════

  /** Font family for buttons */
  actionableFontFamily?: string;

  /** Font weight for button text */
  actionableFontWeight?: string;

  /** Font size for button text */
  actionableFontSize?: string;

  /** Line height for button text */
  actionableLineHeight?: string;

  /** Text transform (uppercase, lowercase, none) */
  actionableTextTransform?: string;

  /** Letter spacing for button text */
  actionableLetterSpacing?: string;

  /** Border radius for buttons */
  actionableBorderRadius?: string;

  /** Enable button press animation (1px shift) */
  actionableShiftOnActive?: boolean;

  // Actionable Primary Variant (main CTA buttons)
  /** Primary button background */
  actionablePrimaryBackground?: string;

  /** Primary button background on hover */
  actionablePrimaryBackgroundHover?: string;

  /** Primary button background when active/pressed */
  actionablePrimaryBackgroundActive?: string;

  /** Primary button text color */
  actionablePrimaryForeground?: string;

  /** Primary button text on hover */
  actionablePrimaryForegroundHover?: string;

  /** Primary button text when active */
  actionablePrimaryForegroundActive?: string;

  /** Primary button border width */
  actionablePrimaryBorderWidth?: string;

  /** Primary button font weight override */
  actionablePrimaryFontWeight?: string;

  // Actionable Secondary Variant (secondary actions)
  /** Secondary button background */
  actionableSecondaryBackground?: string;

  /** Secondary button background on hover */
  actionableSecondaryBackgroundHover?: string;

  /** Secondary button background when active */
  actionableSecondaryBackgroundActive?: string;

  /** Secondary button text color */
  actionableSecondaryForeground?: string;

  /** Secondary button text on hover */
  actionableSecondaryForegroundHover?: string;

  /** Secondary button text when active */
  actionableSecondaryForegroundActive?: string;

  /** Secondary button border width */
  actionableSecondaryBorderWidth?: string;

  /** Secondary button font weight override */
  actionableSecondaryFontWeight?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // EDITABLE CHARACTERISTIC - Form inputs and text fields
  // ═══════════════════════════════════════════════════════════════════════════

  /** Input field background */
  editableBackground?: string;

  /** Input field border color */
  editableBorderColor?: string;

  /** Border radius for input fields */
  editableBorderRadius?: string;

  /** Form label font size */
  editableLabelFontSize?: string;

  /** Form label line height */
  editableLabelLineHeight?: string;

  /** Form label font weight */
  editableLabelFontWeight?: string;

  /** Form label text color */
  editableLabelForeground?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // OVERLAYABLE CHARACTERISTIC - Popovers, dialogs, tooltips
  // ═══════════════════════════════════════════════════════════════════════════

  /** Popover/dialog background */
  overlayableBackground?: string;

  /** Popover/dialog text color */
  overlayableForeground?: string;

  /** Z-index for overlays */
  overlayableZIndex?: number;

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGABLE CHARACTERISTIC - Sidebars and navigation elements
  // ═══════════════════════════════════════════════════════════════════════════

  /** Navigation/sidebar background */
  navigableBackground?: string;

  /** Navigation/sidebar text color */
  navigableForeground?: string;

  /** Navigation accent background (active/hover state) */
  navigableAccentBackground?: string;

  /** Navigation accent text color */
  navigableAccentForeground?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // SEPARABLE CHARACTERISTIC - Borders and dividers
  // ═══════════════════════════════════════════════════════════════════════════

  /** Default border color */
  separableBorderColor?: string;

  /** Default border radius */
  separableBorderRadius?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // FOCUSED CHARACTERISTIC - Focus indicators
  // ═══════════════════════════════════════════════════════════════════════════

  /** Focus ring color */
  focusedRingColor?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // SENTIMENT CHARACTERISTIC - Emotional states (negative, positive, caution)
  // ═══════════════════════════════════════════════════════════════════════════

  // Sentiment Negative (destructive actions, errors in actionable context)
  /** Negative/destructive button background */
  sentimentNegativeBackground?: string;

  /** Negative/destructive background on hover */
  sentimentNegativeBackgroundHover?: string;

  /** Negative/destructive background when active */
  sentimentNegativeBackgroundActive?: string;

  /** Negative/destructive text color */
  sentimentNegativeForeground?: string;

  /** Negative/destructive text on hover */
  sentimentNegativeForegroundHover?: string;

  /** Negative/destructive text when active */
  sentimentNegativeForegroundActive?: string;

  /** Negative/destructive subtle background (alerts) */
  sentimentNegativeAccentBackground?: string;

  /** Negative/destructive border width */
  sentimentNegativeBorderWidth?: string;

  /** Negative/destructive button font weight */
  sentimentNegativeFontWeight?: string;

  // Sentiment Positive (success states)
  /** Positive/success indicator color */
  sentimentPositiveForeground?: string;

  /** Positive/success subtle background */
  sentimentPositiveAccentBackground?: string;

  // Sentiment Caution (warnings)
  /** Caution/warning indicator color */
  sentimentCautionForeground?: string;

  /** Caution/warning subtle background */
  sentimentCautionAccentBackground?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS CHARACTERISTIC - Informational states (info, error, success, warning)
  // ═══════════════════════════════════════════════════════════════════════════

  /** Info status color (blue) */
  statusInfoForeground?: string;

  /** Info status subtle background */
  statusInfoAccentBackground?: string;

  /** Error status color (matches sentiment negative) */
  statusErrorForeground?: string;

  /** Error status subtle background */
  statusErrorAccentBackground?: string;

  /** Success status color (matches sentiment positive) */
  statusSuccessForeground?: string;

  /** Success status subtle background */
  statusSuccessAccentBackground?: string;

  /** Warning status color (matches sentiment caution) */
  statusWarningForeground?: string;

  /** Warning status subtle background */
  statusWarningAccentBackground?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYOUT & SPACING
  // ═══════════════════════════════════════════════════════════════════════════

  /** Base spacing unit (multiplier for spacing scale) */
  spacingUnit?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // ACCENT CHARACTERISTIC - Highlight and metric colors
  // ═══════════════════════════════════════════════════════════════════════════

  /** Accent background for highlighted areas */
  accentBackground?: string;

  /** Accent text color */
  accentForeground?: string;

  /** Metric/data visualization accent color */
  accentMetricBackground?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY TOKENS - Supported for backward compatibility
  // ═══════════════════════════════════════════════════════════════════════════

  /** @deprecated Use `contentFontFamily` instead */
  fontFamily?: string;
  /** @deprecated Use `contentHeaderFontFamily` instead */
  headerFontFamily?: string;
  /** @deprecated Use `actionableFontFamily` instead */
  buttonFontFamily?: string;
  /** @deprecated Use `containerBackground` instead */
  backgroundColor?: string;
  /** @deprecated Use `contentPrimaryForeground` instead */
  foregroundColor?: string;
  /** @deprecated Use `separableBorderRadius` instead */
  borderRadius?: string;
  /** @deprecated Use `editableBorderRadius` instead */
  inputBorderRadius?: string;
  /** @deprecated Use `actionableBorderRadius` instead */
  buttonBorderRadius?: string;
  /** @deprecated Use `actionableFontWeight` instead */
  buttonFontWeight?: string;
  /** @deprecated Use `actionableFontSize` instead */
  buttonFontSize?: string;
  /** @deprecated Use `actionableLineHeight` instead */
  buttonLineHeight?: string;
  /** @deprecated Use `actionableShiftOnActive` instead */
  shiftButtonOnActive?: boolean;
  /** @deprecated Use `actionablePrimaryFontWeight` instead */
  primaryButtonFontWeight?: string;
  /** @deprecated Use `actionableSecondaryFontWeight` instead */
  secondaryButtonFontWeight?: string;
  /** @deprecated Use `sentimentNegativeFontWeight` instead */
  destructiveButtonFontWeight?: string;
  /** @deprecated Use `actionablePrimaryBorderWidth` instead */
  primaryBorderWidth?: string;
  /** @deprecated Use `actionableSecondaryBorderWidth` instead */
  secondaryBorderWidth?: string;
  /** @deprecated Use `sentimentNegativeBorderWidth` instead */
  destructiveBorderWidth?: string;
  /** @deprecated Use `actionablePrimaryBackground` instead */
  primaryColor?: string;
  /** @deprecated Use `actionablePrimaryBackgroundHover` instead */
  primaryHoverColor?: string;
  /** @deprecated Use `actionablePrimaryBackgroundActive` instead */
  primaryActiveColor?: string;
  /** @deprecated Use `actionablePrimaryForeground` instead */
  primaryForegroundColor?: string;
  /** @deprecated Use `actionablePrimaryForegroundHover` instead */
  primaryForegroundHoverColor?: string;
  /** @deprecated Use `actionablePrimaryForegroundActive` instead */
  primaryForegroundActiveColor?: string;
  /** @deprecated Use `actionableSecondaryBackground` instead */
  secondaryColor?: string;
  /** @deprecated Use `actionableSecondaryBackgroundHover` instead */
  secondaryHoverColor?: string;
  /** @deprecated Use `actionableSecondaryBackgroundActive` instead */
  secondaryActiveColor?: string;
  /** @deprecated Use `actionableSecondaryForeground` instead */
  secondaryForegroundColor?: string;
  /** @deprecated Use `actionableSecondaryForegroundHover` instead */
  secondaryForegroundHoverColor?: string;
  /** @deprecated Use `actionableSecondaryForegroundActive` instead */
  secondaryForegroundActiveColor?: string;
  /** @deprecated Use `sentimentNegativeBackground` instead */
  destructiveColor?: string;
  /** @deprecated Use `sentimentNegativeBackgroundHover` instead */
  destructiveHoverColor?: string;
  /** @deprecated Use `sentimentNegativeBackgroundActive` instead */
  destructiveActiveColor?: string;
  /** @deprecated Use `sentimentNegativeForeground` instead */
  destructiveForegroundColor?: string;
  /** @deprecated Use `sentimentNegativeForegroundHover` instead */
  destructiveForegroundHoverColor?: string;
  /** @deprecated Use `sentimentNegativeForegroundActive` instead */
  destructiveForegroundActiveColor?: string;
  /** @deprecated Use `sentimentNegativeAccentBackground` instead */
  destructiveAccentColor?: string;
  /** @deprecated Use `statusInfoForeground` instead */
  informativeColor?: string;
  /** @deprecated Use `statusInfoAccentBackground` instead */
  informativeAccentColor?: string;
  /** @deprecated Use `sentimentCautionForeground` instead */
  warningColor?: string;
  /** @deprecated Use `sentimentCautionAccentBackground` instead */
  warningAccentColor?: string;
  /** @deprecated Use `sentimentPositiveForeground` instead */
  successColor?: string;
  /** @deprecated Use `sentimentPositiveAccentBackground` instead */
  successAccentColor?: string;
  /** @deprecated Use `accentMetricBackground` instead */
  metricAccentColor?: string;
  /** @deprecated Use `containerSecondaryBackground` for alerts */
  alertColor?: string;
  /** @deprecated Use `containerSecondaryForeground` for alerts */
  alertForegroundColor?: string;
  /** @deprecated Use `containerSecondaryBackground` instead */
  mutedColor?: string;
  /** @deprecated Use `containerSecondaryForeground` instead */
  mutedForegroundColor?: string;
  /** @deprecated Use `accentBackground` instead */
  accentColor?: string;
  /** @deprecated Use `accentForeground` instead */
  accentForegroundColor?: string;
  /** @deprecated Use `containerPrimaryBackground` instead */
  cardColor?: string;
  /** @deprecated Use `containerPrimaryForeground` instead */
  cardForegroundColor?: string;
  /** @deprecated Use `overlayableBackground` instead */
  popoverColor?: string;
  /** @deprecated Use `overlayableForeground` instead */
  popoverForegroundColor?: string;
  /** @deprecated Use `separableBorderColor` instead */
  borderColor?: string;
  /** @deprecated Use `editableBackground` instead */
  inputColor?: string;
  /** @deprecated Use `editableBorderColor` instead */
  inputBorderColor?: string;
  /** @deprecated Use `focusedRingColor` instead */
  ringColor?: string;
  /** @deprecated Use `overlayableZIndex` instead */
  zIndexOverlay?: number;
  /** @deprecated Use `actionableTextTransform` instead */
  buttonTextTransform?: string;
  /** @deprecated Use `actionableLetterSpacing` instead */
  buttonLetterSpacing?: string;
  /** @deprecated Use `editableLabelFontSize` instead */
  formLabelFontSize?: string;
  /** @deprecated Use `editableLabelFontWeight` instead */
  formLabelFontWeight?: string;
  /** @deprecated Use `editableLabelLineHeight` instead */
  formLabelLineHeight?: string;
  /** @deprecated Use `editableLabelForeground` instead */
  formLabelForegroundColor?: string;
  /** @deprecated Use `navigableBackground` instead */
  sidebarBackgroundColor?: string;
  /** @deprecated Use `navigableForeground` instead */
  sidebarForegroundColor?: string;
  /** @deprecated Use `navigableAccentBackground` instead */
  sidebarAccentColor?: string;
  /** @deprecated Use `navigableAccentForeground` instead */
  sidebarAccentForegroundColor?: string;
};

export type EBTheme = {
  colorScheme?: EBColorScheme;
  variables?: EBThemeVariables;
  light?: EBThemeVariables;
  dark?: EBThemeVariables;
};

export type EBConfig = {
  apiBaseUrl: string;
  // Optional map of base URLs for different resources
  apiBaseUrls?: Record<string, string>;
  theme?: EBTheme;
  headers?: Record<string, string>;
  reactQueryDefaultOptions?: DefaultOptions;
  contentTokens?: {
    name?: keyof typeof defaultResources;
    tokens?: DeepPartial<(typeof defaultResources)['enUS']>;
  };
  queryParams?: Record<string, string>;
  clientId?: string;
};
