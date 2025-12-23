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

  /** Font family for headings (h1-h6) - maps to Salt's text-h*-fontFamily pattern */
  textHeadingFontFamily?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTAINER CHARACTERISTIC - Surfaces and layout backgrounds
  // ═══════════════════════════════════════════════════════════════════════════

  /** Base page background color - maps to Salt's container-primary-background */
  containerPrimaryBackground?: string;

  /** Primary text color on containers - maps to Salt's content-primary-foreground */
  contentPrimaryForeground?: string;

  /** Primary surface background (cards, panels) - extension token (not in Salt) */
  containerCardBackground?: string;

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

  // Actionable Accented Bold Variant (solid CTA with accent/brand color)
  /** Accented bold button background (solid CTA style) */
  actionableAccentedBoldBackground?: string;

  /** Accented bold button background on hover */
  actionableAccentedBoldBackgroundHover?: string;

  /** Accented bold button background when active/pressed */
  actionableAccentedBoldBackgroundActive?: string;

  /** Accented bold button text color */
  actionableAccentedBoldForeground?: string;

  /** Accented bold button text on hover */
  actionableAccentedBoldForegroundHover?: string;

  /** Accented bold button text when active */
  actionableAccentedBoldForegroundActive?: string;

  /** Accented bold button border color */
  actionableAccentedBoldBorderColor?: string;

  /** Accented bold button border color on hover */
  actionableAccentedBoldBorderColorHover?: string;

  /** Accented bold button border color when active */
  actionableAccentedBoldBorderColorActive?: string;

  /** Accented bold button border width */
  actionableAccentedBoldBorderWidth?: string;

  /** Accented bold button font weight override */
  actionableAccentedBoldFontWeight?: string;

  // Actionable Accented Variant (bordered with accent color)
  /** Accented button background (bordered style) */
  actionableAccentedBackground?: string;

  /** Accented button background on hover */
  actionableAccentedBackgroundHover?: string;

  /** Accented button background when active */
  actionableAccentedBackgroundActive?: string;

  /** Accented button text color */
  actionableAccentedForeground?: string;

  /** Accented button text on hover */
  actionableAccentedForegroundHover?: string;

  /** Accented button text when active */
  actionableAccentedForegroundActive?: string;

  /** Accented button border color */
  actionableAccentedBorderColor?: string;

  /** Accented button border color on hover */
  actionableAccentedBorderColorHover?: string;

  /** Accented button border color when active */
  actionableAccentedBorderColorActive?: string;

  /** Accented button background when selected */
  actionableAccentedBackgroundSelected?: string;

  /** Accented button border color when selected */
  actionableAccentedBorderColorSelected?: string;

  /** Accented button text color when selected */
  actionableAccentedForegroundSelected?: string;

  // Actionable Accented Subtle Variant (transparent with accent color)
  /** Accented subtle button background (transparent style) */
  actionableAccentedSubtleBackground?: string;

  /** Accented subtle button background on hover */
  actionableAccentedSubtleBackgroundHover?: string;

  /** Accented subtle button background when active */
  actionableAccentedSubtleBackgroundActive?: string;

  /** Accented subtle button text color */
  actionableAccentedSubtleForeground?: string;

  /** Accented subtle button text on hover */
  actionableAccentedSubtleForegroundHover?: string;

  /** Accented subtle button text when active */
  actionableAccentedSubtleForegroundActive?: string;

  /** Accented subtle button border color */
  actionableAccentedSubtleBorderColor?: string;

  /** Accented subtle button border color on hover */
  actionableAccentedSubtleBorderColorHover?: string;

  /** Accented subtle button border color when active */
  actionableAccentedSubtleBorderColorActive?: string;

  // Actionable Bold Variant (solid neutral)
  /** Bold button background (solid neutral style) */
  actionableBoldBackground?: string;

  /** Bold button background on hover */
  actionableBoldBackgroundHover?: string;

  /** Bold button background when active */
  actionableBoldBackgroundActive?: string;

  /** Bold button text color */
  actionableBoldForeground?: string;

  /** Bold button text on hover */
  actionableBoldForegroundHover?: string;

  /** Bold button text when active */
  actionableBoldForegroundActive?: string;

  /** Bold button border color */
  actionableBoldBorderColor?: string;

  /** Bold button border color on hover */
  actionableBoldBorderColorHover?: string;

  /** Bold button border color when active */
  actionableBoldBorderColorActive?: string;

  /** Bold button border width */
  actionableBoldBorderWidth?: string;

  /** Bold button font weight override */
  actionableBoldFontWeight?: string;

  // Actionable Variant (bordered neutral - base)
  /** Actionable button background (bordered neutral style) */
  actionableBackground?: string;

  /** Actionable button background on hover */
  actionableBackgroundHover?: string;

  /** Actionable button background when active */
  actionableBackgroundActive?: string;

  /** Actionable button text color */
  actionableForeground?: string;

  /** Actionable button text on hover */
  actionableForegroundHover?: string;

  /** Actionable button text when active */
  actionableForegroundActive?: string;

  /** Actionable button border color */
  actionableBorderColor?: string;

  /** Actionable button border color on hover */
  actionableBorderColorHover?: string;

  /** Actionable button border color when active */
  actionableBorderColorActive?: string;

  /** Actionable button background when selected */
  actionableBackgroundSelected?: string;

  /** Actionable button border color when selected */
  actionableBorderColorSelected?: string;

  /** Actionable button text color when selected */
  actionableForegroundSelected?: string;

  // Actionable Subtle Variant (transparent neutral - previous Secondary)
  /** Subtle button background (transparent neutral style) */
  actionableSubtleBackground?: string;

  /** Subtle button background on hover */
  actionableSubtleBackgroundHover?: string;

  /** Subtle button background when active */
  actionableSubtleBackgroundActive?: string;

  /** Subtle button text color */
  actionableSubtleForeground?: string;

  /** Subtle button text on hover */
  actionableSubtleForegroundHover?: string;

  /** Subtle button text when active */
  actionableSubtleForegroundActive?: string;

  /** Subtle button border color */
  actionableSubtleBorderColor?: string;

  /** Subtle button border color on hover */
  actionableSubtleBorderColorHover?: string;

  /** Subtle button border color when active */
  actionableSubtleBorderColorActive?: string;

  /** Subtle button border width */
  actionableSubtleBorderWidth?: string;

  /** Subtle button font weight override */
  actionableSubtleFontWeight?: string;

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
  // ACTIONABLE NEGATIVE CHARACTERISTIC - Destructive actions
  // ═══════════════════════════════════════════════════════════════════════════

  // Actionable Negative Bold Variant (solid destructive)
  /** Negative bold button background (solid destructive style) */
  actionableNegativeBoldBackground?: string;

  /** Negative bold button background on hover */
  actionableNegativeBoldBackgroundHover?: string;

  /** Negative bold button background when active */
  actionableNegativeBoldBackgroundActive?: string;

  /** Negative bold button text color */
  actionableNegativeBoldForeground?: string;

  /** Negative bold button text on hover */
  actionableNegativeBoldForegroundHover?: string;

  /** Negative bold button text when active */
  actionableNegativeBoldForegroundActive?: string;

  /** Negative bold button border color */
  actionableNegativeBoldBorderColor?: string;

  /** Negative bold button border color on hover */
  actionableNegativeBoldBorderColorHover?: string;

  /** Negative bold button border color when active */
  actionableNegativeBoldBorderColorActive?: string;

  /** Negative bold button border width */
  actionableNegativeBoldBorderWidth?: string;

  /** Negative bold button font weight override */
  actionableNegativeBoldFontWeight?: string;

  // Actionable Negative Variant (bordered destructive)
  /** Negative button background (bordered destructive style) */
  actionableNegativeBackground?: string;

  /** Negative button background on hover */
  actionableNegativeBackgroundHover?: string;

  /** Negative button background when active */
  actionableNegativeBackgroundActive?: string;

  /** Negative button text color */
  actionableNegativeForeground?: string;

  /** Negative button text on hover */
  actionableNegativeForegroundHover?: string;

  /** Negative button text when active */
  actionableNegativeForegroundActive?: string;

  /** Negative button border color */
  actionableNegativeBorderColor?: string;

  /** Negative button border color on hover */
  actionableNegativeBorderColorHover?: string;

  /** Negative button border color when active */
  actionableNegativeBorderColorActive?: string;

  /** Negative button background when selected */
  actionableNegativeBackgroundSelected?: string;

  /** Negative button border color when selected */
  actionableNegativeBorderColorSelected?: string;

  /** Negative button text color when selected */
  actionableNegativeForegroundSelected?: string;

  // Actionable Negative Subtle Variant (transparent destructive)
  /** Negative subtle button background (transparent destructive style) */
  actionableNegativeSubtleBackground?: string;

  /** Negative subtle button background on hover */
  actionableNegativeSubtleBackgroundHover?: string;

  /** Negative subtle button background when active */
  actionableNegativeSubtleBackgroundActive?: string;

  /** Negative subtle button text color */
  actionableNegativeSubtleForeground?: string;

  /** Negative subtle button text on hover */
  actionableNegativeSubtleForegroundHover?: string;

  /** Negative subtle button text when active */
  actionableNegativeSubtleForegroundActive?: string;

  /** Negative subtle button border color */
  actionableNegativeSubtleBorderColor?: string;

  /** Negative subtle button border color on hover */
  actionableNegativeSubtleBorderColorHover?: string;

  /** Negative subtle button border color when active */
  actionableNegativeSubtleBorderColorActive?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // SENTIMENT CHARACTERISTIC - Emotional states (negative, positive, caution)
  // ═══════════════════════════════════════════════════════════════════════════

  // Sentiment Negative (non-actionable contexts - alerts, error messages)
  /** Negative/destructive subtle background (alerts, error messages) */
  sentimentNegativeAccentBackground?: string;

  // Sentiment Positive (success states - non-actionable)
  /** Positive/success indicator color */
  sentimentPositiveForeground?: string;

  /** Positive/success subtle background */
  sentimentPositiveAccentBackground?: string;

  // Sentiment Caution (warnings - non-actionable)
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

  /** Error status color (matches sentiment negative) - maps to Salt's status-error-foreground-informative */
  statusErrorForegroundInformative?: string;

  /** Error status subtle background - maps to Salt's status-error-background */
  statusErrorBackground?: string;

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

  /** Accent text color - maps to Salt's content-accent-foreground */
  contentAccentForeground?: string;

  /** Metric/data visualization accent color */
  accentMetricBackground?: string;

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY TOKENS - Supported for backward compatibility
  // ═══════════════════════════════════════════════════════════════════════════

  /** @deprecated Use `contentFontFamily` instead */
  fontFamily?: string;
  /** @deprecated Use `textHeadingFontFamily` instead */
  headerFontFamily?: string;
  /** @deprecated Use `textHeadingFontFamily` instead */
  contentHeaderFontFamily?: string;
  /** @deprecated Use `actionableFontFamily` instead */
  buttonFontFamily?: string;
  /** @deprecated Use `containerPrimaryBackground` instead */
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
  /** @deprecated Use `actionableAccentedBoldFontWeight` instead */
  primaryButtonFontWeight?: string;
  /** @deprecated Use `actionableSubtleFontWeight` instead */
  secondaryButtonFontWeight?: string;
  /** @deprecated Use `actionableNegativeBoldFontWeight` instead */
  destructiveButtonFontWeight?: string;
  /** @deprecated Use `actionableAccentedBoldBorderWidth` instead */
  primaryBorderWidth?: string;
  /** @deprecated Use `actionableSubtleBorderWidth` instead */
  secondaryBorderWidth?: string;
  /** @deprecated Use `actionableNegativeBoldBorderWidth` instead */
  destructiveBorderWidth?: string;
  /** @deprecated Use `actionableAccentedBoldBackground` instead */
  primaryColor?: string;
  /** @deprecated Use `actionableAccentedBoldBackgroundHover` instead */
  primaryHoverColor?: string;
  /** @deprecated Use `actionableAccentedBoldBackgroundActive` instead */
  primaryActiveColor?: string;
  /** @deprecated Use `actionableAccentedBoldForeground` instead */
  primaryForegroundColor?: string;
  /** @deprecated Use `actionableAccentedBoldForegroundHover` instead */
  primaryForegroundHoverColor?: string;
  /** @deprecated Use `actionableAccentedBoldForegroundActive` instead */
  primaryForegroundActiveColor?: string;
  /** @deprecated Use `actionableSubtleBackground` instead */
  secondaryColor?: string;
  /** @deprecated Use `actionableSubtleBackgroundHover` instead */
  secondaryHoverColor?: string;
  /** @deprecated Use `actionableSubtleBackgroundActive` instead */
  secondaryActiveColor?: string;
  /** @deprecated Use `actionableSubtleForeground` instead */
  secondaryForegroundColor?: string;
  /** @deprecated Use `actionableSubtleForegroundHover` instead */
  secondaryForegroundHoverColor?: string;
  /** @deprecated Use `actionableSubtleForegroundActive` instead */
  secondaryForegroundActiveColor?: string;
  /** @deprecated Use `actionableNegativeBoldBackground` instead */
  destructiveColor?: string;
  /** @deprecated Use `actionableNegativeBoldBackgroundHover` instead */
  destructiveHoverColor?: string;
  /** @deprecated Use `actionableNegativeBoldBackgroundActive` instead */
  destructiveActiveColor?: string;
  /** @deprecated Use `actionableNegativeBoldForeground` instead */
  destructiveForegroundColor?: string;
  /** @deprecated Use `actionableNegativeBoldForegroundHover` instead */
  destructiveForegroundHoverColor?: string;
  /** @deprecated Use `actionableNegativeBoldForegroundActive` instead */
  destructiveForegroundActiveColor?: string;
  /** @deprecated Use `sentimentNegativeAccentBackground` instead (for non-actionable contexts) */
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
  /** @deprecated Use `contentAccentForeground` instead */
  accentForegroundColor?: string;
  /** @deprecated Use `contentAccentForeground` instead */
  accentForeground?: string;
  /** @deprecated Use `containerCardBackground` instead */
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

  /**
   * Base URL transformations for specific API path segments.
   *
   * Use this to transform the base URL for different API endpoints.
   * The key is the first path segment of the API endpoint (e.g., 'clients', 'recipients'),
   * and the value is a function that receives the current base URL and returns the transformed URL.
   *
   * @example
   * ```tsx
   * // For apiBaseUrl="https://api.example.com/v1"
   * // API call to '/clients/123' uses base URL 'https://api.example.com/do/v1'
   * // API call to '/recipients' uses the original base URL
   * <EBComponentsProvider
   *   apiBaseUrl="https://api.example.com/v1"
   *   apiBaseUrlTransforms={{
   *     clients: (baseUrl) => baseUrl.replace(/\/v1$/, '/do/v1'),
   *   }}
   * />
   * ```
   */
  apiBaseUrlTransforms?: Record<string, (baseUrl: string) => string>;

  /**
   * @deprecated Use `apiPathPrefixes` instead. Will be removed in next major version.
   *
   * This prop provided separate base URLs per path segment, but the more common
   * use case is adding path prefixes while keeping the same base URL.
   *
   * Migration:
   * - If you were using different domains, you'll need to configure a reverse proxy
   * - If you were using different paths on the same domain, use `apiPathPrefixes`
   */
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
