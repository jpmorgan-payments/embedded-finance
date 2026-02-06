'use client';

import React, { useCallback, useEffect, useState } from 'react';
import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';
import {
  AlertTriangle,
  Brush,
  Check,
  ChevronDown,
  ChevronUp,
  Clipboard,
  Copy,
  Download,
  Info,
  Layout,
  Palette,
  RotateCcw,
  Share2,
  Sparkles,
  Type,
  X,
} from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { runA11yChecks } from '@/lib/a11y-checks';
import { calculateContrast } from '@/lib/color-contrast';

import { AiPromptDialog } from './ai-prompt-dialog';
import { ContrastChecker } from './contrast-checker';
import { getValidColorPairs } from './theme-color-pairs';
import type { ThemeOption } from './use-sellsense-themes';
import { useSellSenseThemes } from './use-sellsense-themes';

interface ThemeCustomizationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeOption;
  onThemeChange: (
    theme: ThemeOption,
    customVariables?: EBThemeVariables
  ) => void;
  customThemeData?: any; // Full custom theme data with baseTheme
}

interface CustomThemeData {
  baseTheme: ThemeOption;
  variables: EBThemeVariables;
}

// Popular font families for typography controls
const FONT_FAMILIES = [
  { value: 'Inter', label: 'Inter', preview: 'Inter' },
  { value: 'Geist', label: 'Geist', preview: 'Geist' },
  { value: 'Open Sans', label: 'Open Sans', preview: 'Open Sans' },
  { value: 'Amplitude', label: 'Amplitude', preview: 'Amplitude' },
  { value: 'Manrope', label: 'Manrope', preview: 'Manrope' },
  { value: 'Roboto', label: 'Roboto', preview: 'Roboto' },
  { value: 'Arial', label: 'Arial', preview: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica', preview: 'Helvetica' },
  { value: 'Georgia', label: 'Georgia', preview: 'Georgia' },
  {
    value: 'Times New Roman',
    label: 'Times New Roman',
    preview: 'Times New Roman',
  },
  { value: 'Courier New', label: 'Courier New', preview: 'Courier New' },
  { value: 'Verdana', label: 'Verdana', preview: 'Verdana' },
  { value: 'Trebuchet MS', label: 'Trebuchet MS', preview: 'Trebuchet MS' },
  { value: 'Impact', label: 'Impact', preview: 'Impact' },
  { value: 'Comic Sans MS', label: 'Comic Sans MS', preview: 'Comic Sans MS' },
];

// Semantic token labels (Salt-inspired) for display
const TOKEN_LABELS: Record<string, string> = {
  contentFontFamily: 'Content Font Family',
  contentPrimaryForeground: 'Content Foreground',
  textHeadingFontFamily: 'Header Font Family',
  actionableFontFamily: 'Actionable Font Family',
  actionableFontWeight: 'Actionable Font Weight',
  actionableFontSize: 'Actionable Font Size',
  actionableLineHeight: 'Actionable Line Height',
  actionableTextTransform: 'Actionable Text Transform',
  actionableLetterSpacing: 'Actionable Letter Spacing',
  actionableAccentedBoldFontWeight: 'Accented Bold Font Weight',
  actionableSubtleFontWeight: 'Subtle Font Weight',

  containerPrimaryBackground: 'Page Background',
  containerCardBackground: 'Card Background',
  containerPrimaryForeground: 'Card Foreground',
  containerSecondaryBackground: 'Muted Background',
  containerSecondaryForeground: 'Muted Foreground',
  overlayableBackground: 'Overlay Background',
  overlayableForeground: 'Overlay Foreground',
  overlayableZIndex: 'Overlay Z-Index',
  accentBackground: 'Accent Background',
  contentAccentForeground: 'Accent Foreground',

  actionableAccentedBoldBackground: 'Accented Bold Background',
  actionableAccentedBoldBackgroundHover: 'Accented Bold Background Hover',
  actionableAccentedBoldBackgroundActive: 'Accented Bold Background Active',
  actionableAccentedBoldForeground: 'Accented Bold Foreground',
  actionableAccentedBoldForegroundHover: 'Accented Bold Foreground Hover',
  actionableAccentedBoldForegroundActive: 'Accented Bold Foreground Active',
  actionableAccentedBoldBorderWidth: 'Accented Bold Border Width',
  actionableBorderRadius: 'Action Border Radius',
  actionableShiftOnActive: 'Shift On Active',

  actionableSubtleBackground: 'Subtle Background',
  actionableSubtleBackgroundHover: 'Subtle Background Hover',
  actionableSubtleBackgroundActive: 'Subtle Background Active',
  actionableSubtleForeground: 'Subtle Foreground',
  actionableSubtleForegroundHover: 'Subtle Foreground Hover',
  actionableSubtleForegroundActive: 'Subtle Foreground Active',
  actionableSubtleBorderWidth: 'Subtle Border Width',

  editableBackground: 'Input Background',
  editableBorderColor: 'Input Border Color',
  editableBorderRadius: 'Input Border Radius',
  editableLabelFontSize: 'Label Font Size',
  editableLabelFontWeight: 'Label Font Weight',
  editableLabelLineHeight: 'Label Line Height',
  editableLabelForeground: 'Label Foreground',

  separableBorderColor: 'Border Color',
  separableBorderRadius: 'Border Radius',
  spacingUnit: 'Spacing Unit',

  focusedRingColor: 'Focus Ring Color',

  actionableNegativeBoldBackground: 'Negative Bold Background',
  actionableNegativeBoldBackgroundHover: 'Negative Bold Background Hover',
  actionableNegativeBoldBackgroundActive: 'Negative Bold Background Active',
  actionableNegativeBoldForeground: 'Negative Bold Foreground',
  actionableNegativeBoldForegroundHover: 'Negative Bold Foreground Hover',
  actionableNegativeBoldForegroundActive: 'Negative Bold Foreground Active',

  sentimentNegativeAccentBackground: 'Negative Accent Background (Alerts)',
  sentimentCautionForeground: 'Caution Foreground',
  sentimentCautionAccentBackground: 'Caution Accent Background',
  sentimentPositiveForeground: 'Positive Foreground',
  sentimentPositiveAccentBackground: 'Positive Accent Background',
  statusInfoForeground: 'Info Foreground',
  statusInfoAccentBackground: 'Info Accent Background',
  statusErrorForegroundInformative: 'Error Foreground (Informative)',
  statusErrorBackground: 'Error Background',
  statusSuccessForeground: 'Success Foreground',
  statusSuccessAccentBackground: 'Success Accent Background',
  statusWarningForeground: 'Warning Foreground',
  statusWarningAccentBackground: 'Warning Accent Background',
  navigableBackground: 'Navigable Background',
  navigableForeground: 'Navigable Foreground',
  navigableAccentBackground: 'Navigable Accent Background',
  navigableAccentForeground: 'Navigable Accent Foreground',
  actionableNegativeBoldBorderWidth: 'Negative Bold Border Width',
  actionableNegativeBoldFontWeight: 'Negative Bold Font Weight',
  accentMetricBackground: 'Metric Accent Background',
};

// Plain-English tooltips for each design token (what the token changes in the UI)
const TOKEN_TOOLTIPS: Record<string, string> = {
  contentFontFamily: 'Sets the primary font used for body text throughout the experience.',
  contentPrimaryForeground:
    'Controls the main body text color for readability on your background.',
  textHeadingFontFamily: 'Sets the font used for headings and titles (H1–H6).',
  actionableFontFamily: 'Sets the font used for all buttons and interactive controls.',
  actionableFontWeight: 'Controls how bold button text looks by default.',
  actionableFontSize: 'Adjusts the size of text inside buttons.',
  actionableLineHeight: 'Adjusts vertical spacing around button text for readability.',
  actionableTextTransform: 'Controls whether button labels appear in UPPERCASE, Capitalized, or normal case.',
  actionableLetterSpacing: 'Fine-tunes the spacing between letters in button labels.',
  actionableAccentedBoldFontWeight: 'Controls how bold the text is on primary call-to-action buttons.',
  actionableSubtleFontWeight: 'Controls how bold the text is on secondary buttons.',

  containerPrimaryBackground: 'Sets the main page background color across the experience.',
  containerCardBackground: 'Controls the background color of cards, panels, and content blocks.',
  containerPrimaryForeground: 'Sets the default text color on primary surfaces and cards.',
  containerSecondaryBackground: 'Background color for muted or secondary sections.',
  containerSecondaryForeground: 'Text color on muted or secondary surfaces.',
  overlayableBackground: 'Background color for overlays like dialogs, popovers, and flyouts.',
  overlayableForeground: 'Text color inside overlays and popovers.',
  overlayableZIndex: 'Controls how far overlays sit above other content (stacking order).',
  accentBackground: 'General accent background for highlighted chips, tags, or subtle accents.',
  contentAccentForeground: 'Text color for accent elements like links, highlights, or key figures.',

  actionableAccentedBoldBackground: 'Main background color for primary call-to-action buttons.',
  actionableAccentedBoldBackgroundHover: 'Background when hovering over primary buttons.',
  actionableAccentedBoldBackgroundActive: 'Background for primary buttons while pressed.',
  actionableAccentedBoldForeground: 'Text and icon color on primary call-to-action buttons.',
  actionableAccentedBoldForegroundHover: 'Text and icon color on primary buttons when hovered.',
  actionableAccentedBoldForegroundActive: 'Text and icon color on primary buttons while pressed.',
  actionableAccentedBoldBorderWidth: 'Border thickness for primary call-to-action buttons.',
  actionableBorderRadius: 'Rounds the corners of all buttons (from sharp to pill-shaped).',
  actionableShiftOnActive: 'How much buttons visually “press down” when clicked.',

  actionableSubtleBackground: 'Background color for secondary, low-emphasis buttons.',
  actionableSubtleBackgroundHover: 'Background for secondary buttons on hover.',
  actionableSubtleBackgroundActive: 'Background for secondary buttons while pressed.',
  actionableSubtleForeground: 'Text and icon color for secondary buttons.',
  actionableSubtleForegroundHover: 'Text and icon color for secondary buttons on hover.',
  actionableSubtleForegroundActive: 'Text and icon color for secondary buttons while pressed.',
  actionableSubtleBorderWidth: 'Border thickness for secondary buttons.',
  // Removed duplicate key: actionableSubtleFontWeight (already defined above)

  editableBackground: 'Background color for input fields and text areas.',
  editableBorderColor: 'Border color around inputs and form fields.',
  editableBorderRadius: 'Rounds the corners of input fields and text areas.',
  editableLabelFontSize: 'Size of form labels (e.g. field names).',
  editableLabelFontWeight: 'How bold form labels appear.',
  editableLabelLineHeight: 'Vertical spacing for multi-line form labels.',
  editableLabelForeground: 'Text color for form labels.',

  separableBorderColor: 'Default border color for cards, dividers, and outlined elements.',
  separableBorderRadius: 'Base corner radius applied to most components and surfaces.',
  spacingUnit: 'Base spacing unit that drives padding and gaps across the layout.',

  focusedRingColor: 'Color of the focus ring when tabbing to buttons, links, and inputs.',

  actionableNegativeBoldBackground: 'Background color for destructive or “danger” buttons (e.g. Delete).',
  actionableNegativeBoldBackgroundHover: 'Background for destructive buttons on hover.',
  actionableNegativeBoldBackgroundActive: 'Background for destructive buttons while pressed.',
  actionableNegativeBoldForeground: 'Text and icon color on destructive buttons.',
  actionableNegativeBoldForegroundHover: 'Text and icon color on destructive buttons when hovered.',
  actionableNegativeBoldForegroundActive: 'Text and icon color on destructive buttons while pressed.',
  actionableNegativeBoldBorderWidth: 'Border thickness for destructive buttons.',
  actionableNegativeBoldFontWeight: 'How bold the text appears on destructive buttons.',

  sentimentNegativeAccentBackground: 'Accent background for negative states (e.g. critical alerts).',
  sentimentCautionForeground: 'Text color for caution or warning messages.',
  sentimentCautionAccentBackground: 'Background accent for warning or “be careful” banners.',
  sentimentPositiveForeground: 'Text color for success messages and positive states.',
  sentimentPositiveAccentBackground: 'Accent background for success toasts, badges, or highlights.',
  statusInfoForeground: 'Text color for neutral “information” status messages.',
  statusInfoAccentBackground: 'Accent background for informational banners and callouts.',
  statusErrorForegroundInformative: 'Text color for error messages in informational components.',
  statusErrorBackground: 'Background color for error surfaces (e.g. error banners).',
  statusSuccessForeground: 'Text color for success status messages and confirmations.',
  statusSuccessAccentBackground: 'Accent background for success banners, badges, and confirmations.',
  statusWarningForeground: 'Text color for warning status messages.',
  statusWarningAccentBackground: 'Accent background for warning banners and inline warnings.',
  navigableBackground: 'Background color for navigation areas (e.g. sidebars, nav rails).',
  navigableForeground: 'Default text and icon color inside navigation areas.',
  navigableAccentBackground: 'Background for the active or highlighted navigation item.',
  navigableAccentForeground: 'Text and icon color for active or highlighted nav items.',
  accentMetricBackground: 'Accent background for key metrics and KPI tiles in dashboards.',
};

// Placeholders and optional hint text for simple input controls (format expectations)
const INPUT_FORMAT: Record<
  string,
  { placeholder: string; hint?: string }
> = {
  // Radius (pixels or number)
  actionableBorderRadius: {
    placeholder: 'e.g. 4 or 0.25rem',
    hint: 'Pixels (0–100) or CSS length (e.g. 0.25rem). Rounds button corners.',
  },
  editableBorderRadius: {
    placeholder: 'e.g. 4 or 0.25rem',
    hint: 'Pixels (0–100) or CSS length. Rounds input corners.',
  },
  separableBorderRadius: {
    placeholder: 'e.g. 4 or 0.25rem',
    hint: 'Pixels (0–100) or CSS length. Default corner radius for cards and surfaces.',
  },
  // Border width (pixels)
  actionableAccentedBoldBorderWidth: {
    placeholder: 'e.g. 1',
    hint: 'Pixels (0–100). Primary button border thickness.',
  },
  actionableSubtleBorderWidth: {
    placeholder: 'e.g. 1',
    hint: 'Pixels (0–100). Secondary button border thickness.',
  },
  actionableNegativeBoldBorderWidth: {
    placeholder: 'e.g. 1',
    hint: 'Pixels (0–100). Destructive button border thickness.',
  },
  // Spacing
  spacingUnit: {
    placeholder: 'e.g. 8',
    hint: 'Base unit (0–100). Multiplier for padding and gaps across the layout.',
  },
  // Z-index
  overlayableZIndex: {
    placeholder: 'e.g. 50',
    hint: 'Integer 0–9999. Higher values sit on top of other content.',
  },
  // Typography (rem)
  actionableFontSize: {
    placeholder: 'e.g. 0.875',
    hint: 'Rem (0.1–10). 0.875 ≈ 14px. Button text size.',
  },
  actionableLineHeight: {
    placeholder: 'e.g. 1.25',
    hint: 'Unitless or rem (0.1–10). Line height for button text.',
  },
  editableLabelFontSize: {
    placeholder: 'e.g. 0.875',
    hint: 'Rem (0.1–10). Form label text size.',
  },
  editableLabelLineHeight: {
    placeholder: 'e.g. 1.25',
    hint: 'Unitless or rem. Form label line height.',
  },
  // Text transform & letter spacing (string)
  actionableTextTransform: {
    placeholder: 'none | uppercase | lowercase | capitalize',
    hint: 'CSS text-transform. Use lowercase for the value.',
  },
  actionableLetterSpacing: {
    placeholder: 'e.g. 0 or 0.05em',
    hint: 'CSS letter-spacing. Number (em) or length (e.g. 0.5px).',
  },
};

// Derive placeholder/hint for tokens not in INPUT_FORMAT (by pattern)
function getInputFormat(token: string): {
  placeholder: string;
  hint?: string;
} {
  const exact = INPUT_FORMAT[token];
  if (exact) return exact;
  const lower = token.toLowerCase();
  if (lower.includes('radius'))
    return {
      placeholder: 'e.g. 4 or 0.25rem',
      hint: 'Pixels (0–100) or CSS length.',
    };
  if (lower.includes('width') && !lower.includes('borderwidth'))
    return { placeholder: 'e.g. 1', hint: 'Pixels (0–100).' };
  if (lower.includes('spacing'))
    return {
      placeholder: 'e.g. 8 or 8px',
      hint: 'Number (multiplier) or CSS length (px/rem).',
    };
  if (lower.includes('fontsize') || lower.includes('lineheight'))
    return {
      placeholder: 'e.g. 0.875',
      hint: 'Rem (0.1–10).',
    };
  if (lower.includes('zindex'))
    return { placeholder: 'e.g. 50', hint: 'Integer 0–9999.' };
  return { placeholder: 'Value', hint: undefined };
}

// Semantic token order following Salt Design System characteristics
// Order: Actionable, Category, Container, Content, Editable, Focused, Navigable, Overlayable, Selectable, Sentiment, Separable, Status, Target, Text
const SEMANTIC_TOKEN_ORDER = [
  // 1. Actionable
  'actionableFontFamily',
  'actionableFontWeight',
  'actionableFontSize',
  'actionableLineHeight',
  'actionableTextTransform',
  'actionableLetterSpacing',
  'actionableBorderRadius',
  'actionableShiftOnActive',
  'actionableAccentedBoldBackground',
  'actionableAccentedBoldBackgroundHover',
  'actionableAccentedBoldBackgroundActive',
  'actionableAccentedBoldForeground',
  'actionableAccentedBoldForegroundHover',
  'actionableAccentedBoldForegroundActive',
  'actionableAccentedBoldBorderWidth',
  'actionableAccentedBoldFontWeight',
  'actionableSubtleBackground',
  'actionableSubtleBackgroundHover',
  'actionableSubtleBackgroundActive',
  'actionableSubtleForeground',
  'actionableSubtleForegroundHover',
  'actionableSubtleForegroundActive',
  'actionableSubtleBorderWidth',
  'actionableSubtleFontWeight',
  'actionableNegativeBoldBackground',
  'actionableNegativeBoldBackgroundHover',
  'actionableNegativeBoldBackgroundActive',
  'actionableNegativeBoldForeground',
  'actionableNegativeBoldForegroundHover',
  'actionableNegativeBoldForegroundActive',
  'actionableNegativeBoldBorderWidth',
  'actionableNegativeBoldFontWeight',

  // 2. Container
  'containerPrimaryBackground',
  'containerCardBackground',
  'containerPrimaryForeground',
  'containerSecondaryBackground',
  'containerSecondaryForeground',

  // 3. Content
  'contentFontFamily',
  'contentPrimaryForeground',
  'contentAccentForeground',

  // 4. Editable
  'editableBackground',
  'editableBorderColor',
  'editableBorderRadius',
  'editableLabelFontSize',
  'editableLabelFontWeight',
  'editableLabelLineHeight',
  'editableLabelForeground',

  // 5. Focused
  'focusedRingColor',

  // 6. Navigable
  'navigableBackground',
  'navigableForeground',
  'navigableAccentBackground',
  'navigableAccentForeground',

  // 7. Overlayable
  'overlayableBackground',
  'overlayableForeground',
  'overlayableZIndex',

  // 8. Sentiment
  'sentimentNegativeAccentBackground',
  'sentimentCautionForeground',
  'sentimentCautionAccentBackground',
  'sentimentPositiveForeground',
  'sentimentPositiveAccentBackground',

  // 9. Separable
  'separableBorderColor',
  'separableBorderRadius',
  'spacingUnit',

  // 10. Status
  'statusInfoForeground',
  'statusInfoAccentBackground',
  'statusErrorForegroundInformative',
  'statusErrorBackground',
  'statusSuccessForeground',
  'statusSuccessAccentBackground',
  'statusWarningForeground',
  'statusWarningAccentBackground',

  // 11. Text
  'textHeadingFontFamily',

  // Extension tokens (not in Salt)
  'accentBackground',
  'accentMetricBackground',
] as const;

const TOKEN_GROUPS = {
  // 1. Actionable - Interactive elements (buttons, links)
  actionable: {
    title: 'Actionable',
    icon: Brush,
    tokens: [
      // Common actionable properties
      'actionableFontFamily',
      'actionableFontWeight',
      'actionableFontSize',
      'actionableLineHeight',
      'actionableTextTransform',
      'actionableLetterSpacing',
      'actionableBorderRadius',
      'actionableShiftOnActive',
      // Accented Bold variant
      'actionableAccentedBoldBackground',
      'actionableAccentedBoldBackgroundHover',
      'actionableAccentedBoldBackgroundActive',
      'actionableAccentedBoldForeground',
      'actionableAccentedBoldForegroundHover',
      'actionableAccentedBoldForegroundActive',
      'actionableAccentedBoldBorderWidth',
      'actionableAccentedBoldFontWeight',
      // Subtle variant
      'actionableSubtleBackground',
      'actionableSubtleBackgroundHover',
      'actionableSubtleBackgroundActive',
      'actionableSubtleForeground',
      'actionableSubtleForegroundHover',
      'actionableSubtleForegroundActive',
      'actionableSubtleBorderWidth',
      'actionableSubtleFontWeight',
      // Negative Bold variant
      'actionableNegativeBoldBackground',
      'actionableNegativeBoldBackgroundHover',
      'actionableNegativeBoldBackgroundActive',
      'actionableNegativeBoldForeground',
      'actionableNegativeBoldForegroundHover',
      'actionableNegativeBoldForegroundActive',
      'actionableNegativeBoldBorderWidth',
      'actionableNegativeBoldFontWeight',
    ],
  },
  // 2. Container - Surfaces and layout backgrounds
  container: {
    title: 'Container',
    icon: Layout,
    tokens: [
      'containerPrimaryBackground',
      'containerCardBackground',
      'containerPrimaryForeground',
      'containerSecondaryBackground',
      'containerSecondaryForeground',
    ],
  },
  // 3. Content - Typography and text properties
  content: {
    title: 'Content',
    icon: Type,
    tokens: [
      'contentFontFamily',
      'contentPrimaryForeground',
      'contentAccentForeground',
    ],
  },
  // 4. Editable - Form inputs and text fields
  editable: {
    title: 'Editable',
    icon: Layout,
    tokens: [
      'editableBackground',
      'editableBorderColor',
      'editableBorderRadius',
      'editableLabelFontSize',
      'editableLabelFontWeight',
      'editableLabelLineHeight',
      'editableLabelForeground',
    ],
  },
  // 5. Focused - Focus indicators
  focused: {
    title: 'Focused',
    icon: Info,
    tokens: ['focusedRingColor'],
  },
  // 6. Navigable - Sidebars and navigation elements
  navigable: {
    title: 'Navigable',
    icon: Layout,
    tokens: [
      'navigableBackground',
      'navigableForeground',
      'navigableAccentBackground',
      'navigableAccentForeground',
    ],
  },
  // 7. Overlayable - Popovers, dialogs, tooltips
  overlayable: {
    title: 'Overlayable',
    icon: Palette,
    tokens: [
      'overlayableBackground',
      'overlayableForeground',
      'overlayableZIndex',
    ],
  },
  // 8. Sentiment - Emotional states (negative, positive, caution)
  sentiment: {
    title: 'Sentiment',
    icon: Palette,
    tokens: [
      'sentimentNegativeAccentBackground',
      'sentimentCautionForeground',
      'sentimentCautionAccentBackground',
      'sentimentPositiveForeground',
      'sentimentPositiveAccentBackground',
    ],
  },
  // 9. Separable - Borders and dividers
  separable: {
    title: 'Separable',
    icon: Layout,
    tokens: ['separableBorderColor', 'separableBorderRadius', 'spacingUnit'],
  },
  // 10. Status - Informational states (info, error, success, warning)
  status: {
    title: 'Status',
    icon: Info,
    tokens: [
      'statusInfoForeground',
      'statusInfoAccentBackground',
      'statusErrorForegroundInformative',
      'statusErrorBackground',
      'statusSuccessForeground',
      'statusSuccessAccentBackground',
      'statusWarningForeground',
      'statusWarningAccentBackground',
    ],
  },
  // 11. Text - Typography (headings)
  text: {
    title: 'Text',
    icon: Type,
    tokens: ['textHeadingFontFamily'],
  },
  // Extension tokens (not in Salt)
  accent: {
    title: 'Accent (Extension)',
    icon: Palette,
    tokens: ['accentBackground', 'accentMetricBackground'],
  },
};

// Available themes for the dropdown
const AVAILABLE_THEMES: ThemeOption[] = [
  'Empty',
  'Default Blue',
  'Salt Theme',
  'Create Commerce',
  'SellSense',
  'PayFicient',
];

const SEMANTIC_KEYS = new Set<string>(
  SEMANTIC_TOKEN_ORDER as readonly string[]
);

const pickSemanticTokens = (
  variables: EBThemeVariables = {}
): EBThemeVariables =>
  Array.from(SEMANTIC_KEYS).reduce((acc, key) => {
    const typedKey = key as keyof EBThemeVariables;
    const value = variables[typedKey];
    if (value !== undefined) {
      (acc as any)[typedKey] = value;
    }
    return acc;
  }, {} as EBThemeVariables);

export function ThemeCustomizationDrawer({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange,
  customThemeData = {},
}: ThemeCustomizationDrawerProps) {
  const { getThemeVariables } = useSellSenseThemes();

  // Parse custom theme data from URL or create new structure
  const getCustomThemeData = (): CustomThemeData => {
    if (currentTheme === 'Custom' && Object.keys(customThemeData).length > 0) {
      // Check if the customThemeData contains our new structure
      if (customThemeData.baseTheme && customThemeData.variables) {
        // New structure with base theme information
        return {
          baseTheme: customThemeData.baseTheme,
          variables: customThemeData.variables,
        };
      } else {
        // Legacy structure - extract base theme from variables
        // For backward compatibility, try to determine base theme
        const baseTheme = customThemeData.baseTheme || 'SellSense';
        return {
          baseTheme,
          variables: customThemeData,
        };
      }
    }
    return {
      baseTheme: currentTheme,
      variables: {},
    };
  };

  const initialCustomData = getCustomThemeData();

  // State management - only customTheme, no selectedBaseTheme state
  const [customTheme, setCustomTheme] = useState<EBThemeVariables>(
    pickSemanticTokens(
      getThemeVariables('Custom', initialCustomData.variables || {})
    )
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isUrlCopied, setIsUrlCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportChangedOnly, setExportChangedOnly] = useState(false);
  const [isA11yExpanded, setIsA11yExpanded] = useState(false);
  const [contrastFilter, setContrastFilter] = useState<
    'all' | 'failing' | 'aa-only'
  >('all');
  const [isAiPromptDialogOpen, setIsAiPromptDialogOpen] = useState(false);
  const [isWarningDialogOpen, setIsWarningDialogOpen] = useState(false);

  // Helper function to determine min/max values based on token context
  const getNumberConstraints = (token: string) => {
    if (token.includes('fontWeight')) {
      return { min: 100, max: 900, step: 100 };
    }
    if (token.includes('zIndex')) {
      return { min: 0, max: 9999, step: 1 };
    }
    if (token.includes('fontSize') || token.includes('lineHeight')) {
      return { min: 0.1, max: 10, step: 0.1 };
    }
    if (
      token.includes('spacing') ||
      token.includes('radius') ||
      token.includes('width')
    ) {
      return { min: 0, max: 100, step: 1 };
    }
    return { min: 0, max: 100, step: 0.1 }; // Default constraints
  };

  // Get current base theme from URL or current theme
  const getCurrentBaseTheme = (): ThemeOption => {
    console.log('getCurrentBaseTheme called with:', {
      currentTheme,
      customThemeData,
      hasBaseTheme: customThemeData.baseTheme,
      customThemeDataKeys: Object.keys(customThemeData),
      customThemeDataString: JSON.stringify(customThemeData, null, 2),
    });

    if (currentTheme === 'Custom' && Object.keys(customThemeData).length > 0) {
      if (customThemeData.baseTheme) {
        const baseTheme = customThemeData.baseTheme;
        console.log('Returning base theme from customThemeData:', baseTheme);
        return baseTheme;
      }
      console.log('No baseTheme in customThemeData, defaulting to SellSense');
      return 'SellSense'; // Default for legacy
    }
    // If current theme is not 'Custom', use it directly
    // If no theme is defined in URL, default to 'SellSense'
    const result = currentTheme || 'SellSense';
    console.log('Returning current theme or default:', result);
    return result;
  };

  // Get changed variables only
  const getChangedVariables = useCallback((): EBThemeVariables => {
    const currentBaseTheme = getCurrentBaseTheme();
    const baseVariables = pickSemanticTokens(
      getThemeVariables(currentBaseTheme)
    );

    const changed: Record<string, string | number | boolean> = {};
    Object.keys(customTheme).forEach((key) => {
      const typedKey = key as keyof EBThemeVariables;
      const customValue = customTheme[typedKey];
      const baseValue = baseVariables[typedKey];
      if (customValue !== baseValue && customValue !== undefined) {
        changed[key] = customValue as string | number | boolean;
      }
    });

    return changed as EBThemeVariables;
  }, [customTheme, getCurrentBaseTheme, getThemeVariables]);

  // Download theme as JSON file
  const downloadThemeAsJson = useCallback(() => {
    try {
      const themeToExport = exportChangedOnly
        ? getChangedVariables()
        : pickSemanticTokens(customTheme);

      const themeJson = JSON.stringify(themeToExport, null, 2);
      const blob = new Blob([themeJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportChangedOnly
        ? 'theme-changes.json'
        : 'theme-complete.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download theme:', error);
    }
  }, [customTheme, exportChangedOnly, getChangedVariables]);

  // Initialize custom theme from current theme
  useEffect(() => {
    if (isOpen) {
      const customData = getCustomThemeData();
      setCustomTheme(
        pickSemanticTokens(
          getThemeVariables('Custom', customData.variables || {})
        )
      );
    }
  }, [isOpen, currentTheme, customThemeData, getThemeVariables]);

  // Handle base theme selection
  const handleBaseThemeChange = (theme: ThemeOption) => {
    console.log('handleBaseThemeChange called with theme:', theme);

    const currentBaseTheme = getCurrentBaseTheme();
    const currentBaseVariables = pickSemanticTokens(
      getThemeVariables(currentBaseTheme)
    );
    const newBaseVariables = pickSemanticTokens(getThemeVariables(theme));

    // Check if we have any custom changes BEFORE resetting
    // Compare current customTheme against current base to see if there are overrides
    const hasChanges = Object.keys(customTheme).some((key) => {
      const typedKey = key as keyof EBThemeVariables;
      const customValue = customTheme[typedKey];
      const baseValue = currentBaseVariables[typedKey];
      // Check if custom value differs from current base
      return customValue !== undefined && customValue !== baseValue;
    });

    // Reset to the new base theme
    setCustomTheme(newBaseVariables);

    if (hasChanges) {
      // We have custom changes, but we're switching base theme
      // Keep the custom overrides but with new base
      const mergedTheme = pickSemanticTokens({
        ...newBaseVariables,
        ...customTheme,
      });
      const customThemeData: CustomThemeData = {
        baseTheme: theme,
        variables: mergedTheme,
      };
      onThemeChange('Custom', customThemeData as any);
    } else {
      // No custom changes, just change the theme parameter
      // Pass empty object to clear custom variables
      onThemeChange(theme, {});
    }
  };

  // Handle individual token changes
  const handleTokenChange = (
    token: keyof EBThemeVariables,
    value: string | number | boolean
  ) => {
    // Get the current base theme variables
    const currentBaseTheme = getCurrentBaseTheme();
    const baseVariables = pickSemanticTokens(
      getThemeVariables(currentBaseTheme)
    );

    console.log('handleTokenChange called with:', {
      token,
      value,
      currentBaseTheme,
      baseVariables: Object.keys(baseVariables).length,
    });

    // Create updated theme by merging base variables with custom changes
    const updatedTheme = pickSemanticTokens({
      ...baseVariables,
      ...customTheme,
      [token]: value as EBThemeVariables[keyof EBThemeVariables],
    });

    setCustomTheme(updatedTheme);

    // Check if this change makes the theme different from base
    const hasChanges = Object.keys(updatedTheme).some((key) => {
      const typedKey = key as keyof EBThemeVariables;
      return updatedTheme[typedKey] !== baseVariables[typedKey];
    });

    if (hasChanges) {
      // Create custom theme data with base theme information
      const customThemeData: CustomThemeData = {
        baseTheme: currentBaseTheme,
        variables: updatedTheme,
      };
      console.log('Saving custom theme with base theme:', currentBaseTheme);
      onThemeChange('Custom', customThemeData as any);
    } else {
      // No changes, revert to base theme
      console.log('No changes, reverting to base theme:', currentBaseTheme);
      onThemeChange(currentBaseTheme, {});
    }
  };

  // Copy theme to clipboard
  const copyThemeToClipboard = useCallback(async () => {
    try {
      const themeToExport = exportChangedOnly
        ? getChangedVariables()
        : pickSemanticTokens(customTheme);

      const themeJson = JSON.stringify(themeToExport, null, 2);
      await navigator.clipboard.writeText(themeJson);

      // Show success feedback
      setIsCopied(true);

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy theme:', error);
    }
  }, [customTheme, exportChangedOnly, getChangedVariables]);

  // Share theme as URL
  const shareThemeAsUrl = useCallback(() => {
    try {
      // Copy the current page URL (with all params) as-is
      navigator.clipboard.writeText(window.location.href);

      // Show success feedback
      setIsUrlCopied(true);

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsUrlCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to share theme URL:', error);
    }
  }, []);

  // Import theme from clipboard
  const importThemeFromClipboard = useCallback(async () => {
    setIsImporting(true);

    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        throw new Error('Clipboard API not available');
      }

      // Read from clipboard
      const clipboardText = await navigator.clipboard.readText();

      if (!clipboardText.trim()) {
        throw new Error('Clipboard is empty');
      }

      // Parse JSON
      const parsedData = JSON.parse(clipboardText);

      // Validate structure - support both { variables: {...} } and direct variables object
      let variables: EBThemeVariables;
      if (parsedData.variables && typeof parsedData.variables === 'object') {
        variables = parsedData.variables;
      } else if (typeof parsedData === 'object') {
        // Direct variables object
        variables = parsedData;
      } else {
        throw new Error(
          'Invalid theme data structure. Expected { variables: { ... } } or direct variables object'
        );
      }

      // Validate that we have some valid properties
      const validProperties = Object.keys(variables).filter(
        (key) =>
          variables[key as keyof EBThemeVariables] !== undefined &&
          variables[key as keyof EBThemeVariables] !== null
      );

      if (validProperties.length === 0) {
        throw new Error('No valid theme properties found in clipboard data');
      }

      // Normalize imported variables to semantic tokens (don't merge with existing)
      // The imported theme should replace the current theme, not merge with it
      const importedTheme = pickSemanticTokens(variables);
      setCustomTheme(importedTheme);

      // Determine base theme - use current base theme or default to SellSense
      const currentBaseTheme = getCurrentBaseTheme();

      // Always apply the imported theme as Custom theme
      // The imported variables are what the user wants, so apply them directly
      const customThemeData: CustomThemeData = {
        baseTheme: currentBaseTheme,
        variables: importedTheme,
      };

      // Apply the theme immediately
      onThemeChange('Custom', customThemeData as any);

      // Show success feedback
      console.log('Theme imported successfully from clipboard');
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to import from clipboard';
      console.error('Import error:', errorMessage);
      // You can replace this with your preferred error notification system
      alert(`Import failed: ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  }, [customTheme, getThemeVariables, getCurrentBaseTheme, onThemeChange]);

  // Reset to base theme
  const resetToBaseTheme = () => {
    const baseVariables = pickSemanticTokens(
      getThemeVariables(getCurrentBaseTheme())
    );
    setCustomTheme(baseVariables);

    // Just change to the base theme, no custom mode
    onThemeChange(getCurrentBaseTheme(), {});
  };

  // Handle backdrop click to close drawer
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking the backdrop itself, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key to close drawer
  React.useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      // Restore body scroll when drawer closes
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const isColorToken = (token: string) => {
    const normalized = token.toLowerCase();
    return (
      normalized.includes('color') ||
      normalized.includes('background') ||
      normalized.includes('foreground') ||
      normalized.includes('accent')
    );
  };

  // Render form control based on token type
  const renderTokenControl = (token: keyof EBThemeVariables, value: any) => {
    const isColor = isColorToken(token as string);
    const isBoolean = typeof value === 'boolean';
    const isNumber = typeof value === 'number';
    const isSpacing =
      token.includes('spacing') ||
      token.includes('radius') ||
      token.includes('width');
    const isFontWeight = token.toLowerCase().includes('fontweight');
    const isFontSize =
      token.toLowerCase().includes('fontsize') ||
      token.toLowerCase().includes('lineheight');
    const isFontFamily = token.toLowerCase().includes('fontfamily');

    if (isBoolean) {
      return (
        <Switch
          checked={value}
          onCheckedChange={(checked) => handleTokenChange(token, checked)}
        />
      );
    }

    if (isColor) {
      // Check if this color is part of a contrast pair
      const colorPairs = getValidColorPairs(customTheme);
      const relevantPairs = colorPairs.filter(
        (p) => p.foreground === token || p.background === token
      );

      // Find the best contrast result for this color
      let contrastBadge: React.ReactNode = null;
      if (relevantPairs.length > 0) {
        const pair = relevantPairs[0];
        const fgValue =
          pair.foreground === token
            ? String(value || '')
            : String(customTheme[pair.foreground] || '');
        const bgValue =
          pair.background === token
            ? String(value || '')
            : String(customTheme[pair.background] || '');

        if (fgValue && bgValue) {
          const contrastResult = calculateContrast(fgValue, bgValue);
          if (contrastResult) {
            const standard = pair.textSize === 'large' ? 'large' : 'normal';
            const passesAA = contrastResult.passes.AA[standard];
            const passesAAA = contrastResult.passes.AAA[standard];

            contrastBadge = (
              <div className="flex items-center gap-1">
                {passesAAA ? (
                  <Badge className="border-0 bg-green-100 px-1.5 py-0 text-xs text-green-800">
                    ✓ {contrastResult.ratio.toFixed(1)}:1
                  </Badge>
                ) : passesAA ? (
                  <Badge className="border-0 bg-amber-100 px-1.5 py-0 text-xs text-amber-800">
                    ⚠ {contrastResult.ratio.toFixed(1)}:1
                  </Badge>
                ) : (
                  <Badge className="border-0 bg-red-100 px-1.5 py-0 text-xs text-red-800">
                    ✗ {contrastResult.ratio.toFixed(1)}:1
                  </Badge>
                )}
              </div>
            );
          }
        }
      }

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleTokenChange(token, e.target.value)}
              className="h-8 w-12 rounded border border-gray-300 bg-white p-1"
            />
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => handleTokenChange(token, e.target.value)}
              placeholder="e.g. #3b82f6 or rgb(59, 130, 246)"
              className="flex-1 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
            />
            {contrastBadge}
          </div>
          {(contrastBadge && relevantPairs.length > 0) && (
            <div className="ml-14 text-xs text-gray-500">
              {relevantPairs[0].label}
            </div>
          )}
          {!(contrastBadge && relevantPairs.length > 0) && (
            <p className="ml-14 text-xs text-gray-500">
              Hex, rgb(), or any valid CSS color.
            </p>
          )}
        </div>
      );
    }

    if (isFontFamily) {
      return (
        <Select
          value={value || 'Inter'}
          onValueChange={(val) => handleTokenChange(token, val)}
        >
          <SelectTrigger className="w-full border-gray-300 bg-white text-gray-900">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (isNumber) {
      const constraints = getNumberConstraints(token);
      const { placeholder, hint } = getInputFormat(token as string);
      return (
        <div className="space-y-1">
          <Input
            type="number"
            value={value ?? ''}
            onChange={(e) =>
              handleTokenChange(token, Number(e.target.value) || 0)
            }
            min={constraints.min}
            max={constraints.max}
            step={constraints.step}
            placeholder={placeholder}
            className="w-32 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
            aria-describedby={hint ? `${token}-hint` : undefined}
          />
          {hint && (
            <p className="text-xs text-gray-500" id={`${token}-hint`}>
              {hint}
            </p>
          )}
        </div>
      );
    }

    if (isSpacing) {
      const { placeholder, hint } = getInputFormat(token as string);
      // For spacing tokens that are numeric, use number input
      if (typeof value === 'number' || !isNaN(Number(value))) {
        const constraints = getNumberConstraints(token);
        return (
          <div className="space-y-1">
            <Input
              type="number"
              value={value ?? ''}
              onChange={(e) => handleTokenChange(token, e.target.value)}
              min={constraints.min}
              max={constraints.max}
              step={constraints.step}
              placeholder={placeholder}
              className="w-32 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
              aria-describedby={hint ? `${token}-hint` : undefined}
            />
            {hint && (
              <p className="text-xs text-gray-500" id={`${token}-hint`}>
                {hint}
              </p>
            )}
          </div>
        );
      }
      // For string-based spacing (like CSS units), use text input
      return (
        <div className="space-y-1">
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleTokenChange(token, e.target.value)}
            placeholder={placeholder}
            className="flex-1 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
            aria-describedby={hint ? `${token}-hint` : undefined}
          />
          {hint && (
            <p className="text-xs text-gray-500" id={`${token}-hint`}>
              {hint}
            </p>
          )}
        </div>
      );
    }

    if (isFontWeight) {
      return (
        <Select
          value={value?.toString() || '400'}
          onValueChange={(val) => handleTokenChange(token, val)}
        >
          <SelectTrigger className="w-32 border-gray-300 bg-white text-gray-900">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="100">100 (Thin)</SelectItem>
            <SelectItem value="200">200 (Extra Light)</SelectItem>
            <SelectItem value="300">300 (Light)</SelectItem>
            <SelectItem value="400">400 (Normal)</SelectItem>
            <SelectItem value="500">500 (Medium)</SelectItem>
            <SelectItem value="600">600 (Semi Bold)</SelectItem>
            <SelectItem value="700">700 (Bold)</SelectItem>
            <SelectItem value="800">800 (Extra Bold)</SelectItem>
            <SelectItem value="900">900 (Black)</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (isFontSize) {
      const constraints = getNumberConstraints(token);
      const { placeholder, hint } = getInputFormat(token as string);
      return (
        <div className="space-y-1">
          <Input
            type="number"
            value={value ?? ''}
            onChange={(e) => handleTokenChange(token, e.target.value)}
            min={constraints.min}
            max={constraints.max}
            step={constraints.step}
            placeholder={placeholder}
            className="w-32 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
            aria-describedby={hint ? `${token}-hint` : undefined}
          />
          {hint && (
            <p className="text-xs text-gray-500" id={`${token}-hint`}>
              {hint}
            </p>
          )}
        </div>
      );
    }

    // Default text input (e.g. text transform, letter spacing)
    const { placeholder, hint } = getInputFormat(token as string);
    return (
      <div className="space-y-1">
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => handleTokenChange(token, e.target.value)}
          placeholder={placeholder}
          className="flex-1 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
          aria-describedby={hint ? `${token}-hint` : undefined}
        />
        {hint && (
          <p className="text-xs text-gray-500" id={`${token}-hint`}>
            {hint}
          </p>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex w-[32rem] transform flex-col border-l border-gray-200 bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center gap-2">
            <Brush className="h-4 w-4 text-gray-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Customize Theme
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Info Alert */}
          <div className="flex-shrink-0 border-b border-gray-200 px-4">
            <div className="flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2">
              <Info className="mt-0.5 h-3 w-3 flex-shrink-0 text-gray-600" />
              <div className="flex-1 text-xs text-gray-700">
                <p className="text-xs">
                  Customize design tokens to create your own theme. Changes are
                  applied in real-time.
                </p>
                <div className="mt-1.5 flex items-center gap-3">
                  <a
                    href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/README.md#theme-design-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap text-xs text-gray-600 underline hover:text-gray-800"
                  >
                    View design tokens docs →
                  </a>
                  <button
                    onClick={() => setIsAiPromptDialogOpen(true)}
                    className="flex items-center gap-1 text-xs text-gray-500 underline hover:text-gray-700"
                    type="button"
                  >
                    <Sparkles className="h-3 w-3" />
                    Extract tokens with AI
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Base Theme Selection */}
          <div className="flex-shrink-0 space-y-4 border-b border-gray-200 p-4">
            <div className="space-y-3">
              <div>
                <h3 className="mb-1 text-sm font-medium text-gray-700">
                  Start from a theme
                </h3>
                <p className="mb-3 text-xs text-gray-500">
                  Choose a base theme to customize
                </p>
              </div>
              <div className="flex w-full gap-2">
                <div className="flex-1">
                  <Select
                    value={getCurrentBaseTheme()}
                    onValueChange={(value) => {
                      console.log(
                        'Dropdown onValueChange called with value:',
                        value
                      );
                      handleBaseThemeChange(value as ThemeOption);
                    }}
                  >
                    <SelectTrigger className="w-full border-gray-300 bg-white text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_THEMES.map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          {theme}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={resetToBaseTheme}
                  title="Reset to base theme"
                  className="h-9 w-9 flex-shrink-0 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Export Options */}
            <div className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 p-2">
              <Switch
                checked={exportChangedOnly}
                onCheckedChange={setExportChangedOnly}
                id="export-changed-only"
              />
              <Label
                htmlFor="export-changed-only"
                className="cursor-pointer text-xs text-gray-700"
              >
                Export only changed variables
              </Label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant={isCopied ? 'default' : 'outline'}
                size="sm"
                onClick={copyThemeToClipboard}
                className={`flex flex-1 items-center gap-2 transition-all duration-200 ${
                  isCopied
                    ? ''
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                disabled={isCopied}
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {isCopied
                  ? 'Copied!'
                  : exportChangedOnly
                    ? 'Copy Changed JSON'
                    : 'Copy Theme JSON'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadThemeAsJson}
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                title="Download theme as JSON file"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant={isUrlCopied ? 'default' : 'outline'}
                size="sm"
                onClick={shareThemeAsUrl}
                className={`flex flex-1 items-center gap-2 transition-all duration-200 ${
                  isUrlCopied
                    ? ''
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                disabled={isUrlCopied}
              >
                {isUrlCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {isUrlCopied ? 'Copied!' : 'Share URL'}
              </Button>
            </div>

            {/* Import Button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={importThemeFromClipboard}
                className="flex w-full items-center gap-2 border-gray-300 text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-gray-900"
                disabled={isImporting}
              >
                {isImporting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
                {isImporting ? 'Importing...' : 'Import from Clipboard'}
              </Button>
            </div>
          </div>

          {/* Theme Groups */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="px-6 pb-12">
                {/* Accessibility Check Section - Moved to Top */}
                <div className="mb-6 border-b border-gray-200 pb-6">
                  {(() => {
                    // Get merged theme (base + custom) for accurate checks
                    const currentBaseTheme = getCurrentBaseTheme();
                    const baseVariables = pickSemanticTokens(
                      getThemeVariables(currentBaseTheme)
                    );
                    const mergedTheme = pickSemanticTokens({
                      ...baseVariables,
                      ...customTheme,
                    });

                    // Calculate summary stats for collapsed view
                    const colorPairs = getValidColorPairs(mergedTheme);
                    const contrastResults = colorPairs.map((pair) => ({
                      ...pair,
                      result: calculateContrast(
                        pair.foregroundValue,
                        pair.backgroundValue
                      ),
                    }));
                    const failingContrast = contrastResults.filter(
                      (p) => !p.result || p.result.level === 'Fail'
                    ).length;
                    const a11ySummary = runA11yChecks(mergedTheme);
                    const totalIssues = failingContrast + a11ySummary.failing;
                    const hasIssues = totalIssues > 0;

                    return (
                      <button
                        type="button"
                        onClick={() => setIsA11yExpanded(!isA11yExpanded)}
                        className={`flex w-full items-center justify-between rounded-lg p-2.5 transition-colors ${
                          hasIssues
                            ? 'border border-red-200 bg-red-50 hover:bg-red-100'
                            : 'border border-gray-200 bg-gray-50 hover:bg-gray-100'
                        }`}
                        aria-expanded={isA11yExpanded}
                        aria-controls="a11y-check-details"
                      >
                        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsWarningDialogOpen(true);
                            }}
                            className="flex items-center gap-1.5 text-xs font-medium text-amber-600 transition-colors hover:text-amber-700"
                            title="View warning about using generated theme JSON"
                            aria-label="View warning about using generated theme JSON"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Warning: Use at Your Own Risk</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">
                              Experimental:
                            </span>
                            <span className="text-xs font-normal text-gray-900">
                              Accessibility Check
                            </span>
                          </div>
                          {!isA11yExpanded && (
                            <span
                              className={`text-xs ${
                                hasIssues
                                  ? 'font-medium text-red-700'
                                  : 'text-gray-600'
                              }`}
                            >
                              {hasIssues
                                ? `⚠ ${totalIssues} issue${totalIssues !== 1 ? 's' : ''} found`
                                : '✓ All checks passing'}
                            </span>
                          )}
                        </div>
                        <div className="ml-2 flex flex-shrink-0 items-center gap-2">
                          {!isA11yExpanded && hasIssues && (
                            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              {totalIssues}
                            </span>
                          )}
                          {isA11yExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-600" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                      </button>
                    );
                  })()}

                  {isA11yExpanded && (
                    <div id="a11y-check-details" className="mt-4 space-y-4">
                      {/* A11y Checks Summary */}
                      {(() => {
                        // Get merged theme (base + custom) for accurate checks
                        const currentBaseTheme = getCurrentBaseTheme();
                        const baseVariables = pickSemanticTokens(
                          getThemeVariables(currentBaseTheme)
                        );
                        const mergedTheme = pickSemanticTokens({
                          ...baseVariables,
                          ...customTheme,
                        });
                        const a11ySummary = runA11yChecks(mergedTheme);
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                              <div className="flex items-center gap-4">
                                <div className="text-sm">
                                  <span className="font-medium text-gray-900">
                                    Overall Status:
                                  </span>{' '}
                                  {a11ySummary.failing > 0 ? (
                                    <span className="text-red-600">
                                      ⚠ {a11ySummary.failing} issues
                                    </span>
                                  ) : a11ySummary.warnings > 0 ? (
                                    <span className="text-amber-600">
                                      ⚠ {a11ySummary.warnings} warnings
                                    </span>
                                  ) : (
                                    <span className="text-green-600">
                                      ✓ All checks passing
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                {a11ySummary.passing} pass,{' '}
                                {a11ySummary.warnings} warnings,{' '}
                                {a11ySummary.failing} fail
                              </div>
                            </div>

                            {/* A11y Check Results */}
                            <div className="space-y-2">
                              {a11ySummary.checks.map((check) => (
                                <div
                                  key={check.id}
                                  className={`rounded-lg border p-3 ${
                                    check.status === 'pass'
                                      ? 'border-green-200 bg-green-50'
                                      : check.status === 'warning'
                                        ? 'border-amber-200 bg-amber-50'
                                        : 'border-red-200 bg-red-50'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    {check.status === 'pass' ? (
                                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                                    ) : check.status === 'warning' ? (
                                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
                                    ) : (
                                      <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                      <div className="text-sm font-medium text-gray-900">
                                        {check.label}
                                      </div>
                                      <div className="mt-1 text-xs text-gray-700">
                                        {check.message}
                                      </div>
                                      {check.recommendation && (
                                        <div className="mt-2 text-xs italic text-gray-600">
                                          💡 {check.recommendation}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Contrast Checker */}
                      {(() => {
                        // Get merged theme (base + custom) for accurate checks
                        const currentBaseTheme = getCurrentBaseTheme();
                        const baseVariables = pickSemanticTokens(
                          getThemeVariables(currentBaseTheme)
                        );
                        const mergedTheme = pickSemanticTokens({
                          ...baseVariables,
                          ...customTheme,
                        });
                        const colorPairs = getValidColorPairs(mergedTheme);
                        const contrastResults = colorPairs.map((pair) => {
                          return {
                            ...pair,
                            result: calculateContrast(
                              pair.foregroundValue,
                              pair.backgroundValue
                            ),
                          };
                        });

                        const failingPairs = contrastResults.filter(
                          (p) => !p.result || p.result.level === 'Fail'
                        );
                        const aaOnlyPairs = contrastResults.filter(
                          (p) =>
                            p.result &&
                            p.result.level === 'AA' &&
                            p.result.passes.AAA.normal === false
                        );

                        const filteredPairs =
                          contrastFilter === 'failing'
                            ? failingPairs
                            : contrastFilter === 'aa-only'
                              ? aaOnlyPairs
                              : contrastResults;

                        const aaPassing = contrastResults.filter(
                          (p) => p.result && p.result.passes.AA.normal
                        ).length;
                        const aaaPassing = contrastResults.filter(
                          (p) => p.result && p.result.passes.AAA.normal
                        ).length;

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  Color Contrast
                                </h4>
                                <p className="mt-1 text-xs text-gray-600">
                                  WCAG 2.1 Level AA (4.5:1) and AAA (7:1)
                                  compliance
                                </p>
                              </div>
                              <div className="text-xs text-gray-600">
                                {aaPassing}/{colorPairs.length} pass AA,{' '}
                                {aaaPassing}/{colorPairs.length} pass AAA
                              </div>
                            </div>

                            {/* Filter Buttons */}
                            <div className="flex gap-2">
                              <Button
                                variant={
                                  contrastFilter === 'all'
                                    ? 'default'
                                    : 'outline'
                                }
                                size="sm"
                                onClick={() => setContrastFilter('all')}
                                className="text-xs"
                              >
                                All ({colorPairs.length})
                              </Button>
                              <Button
                                variant={
                                  contrastFilter === 'failing'
                                    ? 'default'
                                    : 'outline'
                                }
                                size="sm"
                                onClick={() => setContrastFilter('failing')}
                                className="text-xs"
                              >
                                Failing ({failingPairs.length})
                              </Button>
                              <Button
                                variant={
                                  contrastFilter === 'aa-only'
                                    ? 'default'
                                    : 'outline'
                                }
                                size="sm"
                                onClick={() => setContrastFilter('aa-only')}
                                className="text-xs"
                              >
                                AA Only ({aaOnlyPairs.length})
                              </Button>
                            </div>

                            {/* Contrast Results */}
                            <div className="max-h-96 space-y-3 overflow-y-auto">
                              {filteredPairs.length === 0 ? (
                                <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
                                  No color pairs found matching the filter
                                </div>
                              ) : (
                                filteredPairs.map((pair) => (
                                  <ContrastChecker
                                    key={`${pair.background}-${pair.foreground}`}
                                    foreground={pair.foregroundValue}
                                    background={pair.backgroundValue}
                                    label={pair.label}
                                    textSize={pair.textSize}
                                    showRatio={true}
                                  />
                                ))
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {Object.entries(TOKEN_GROUPS).map(([groupKey, group]) => {
                    const Icon = group.icon;
                    return (
                      <AccordionItem key={groupKey} value={groupKey}>
                        <AccordionTrigger className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          <Icon className="h-4 w-4 text-gray-700" />
                          {group.title}
                          <span className="ml-auto text-xs text-gray-500">
                            ({group.tokens.length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            {group.tokens.map((token) => {
                              // Get the current value from the merged theme (base + custom)
                              const baseVariables = pickSemanticTokens(
                                getThemeVariables(getCurrentBaseTheme())
                              );
                              const value =
                                customTheme[token as keyof EBThemeVariables] !==
                                undefined
                                  ? customTheme[token as keyof EBThemeVariables]
                                  : baseVariables[
                                      token as keyof EBThemeVariables
                                    ];

                              const tooltipText = TOKEN_TOOLTIPS[token];
                              return (
                                <div key={token} className="space-y-2">
                                  <div className="flex items-center gap-1.5">
                                    <Label
                                      htmlFor={token}
                                      className="text-xs font-medium text-gray-900"
                                    >
                                      {TOKEN_LABELS[token] || token}
                                    </Label>
                                    {tooltipText && (
                                      <span className="group relative inline-flex flex-shrink-0">
                                        <button
                                          type="button"
                                          className="rounded p-0.5 text-gray-400 outline-none hover:text-gray-600 focus:text-gray-600 focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
                                          aria-label={`What does ${TOKEN_LABELS[token] || token} change?`}
                                        >
                                          <Info className="h-3.5 w-3.5" />
                                        </button>
                                        <span
                                          className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden min-w-[18rem] max-w-[28rem] whitespace-normal rounded-md border border-gray-200 bg-gray-900 px-3 py-2.5 text-left text-sm font-normal leading-snug text-white shadow-lg group-hover:block group-focus-within:block"
                                          role="tooltip"
                                        >
                                          {tooltipText}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                  {renderTokenControl(
                                    token as keyof EBThemeVariables,
                                    value
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* AI Prompt Dialog */}
      <AiPromptDialog
        isOpen={isAiPromptDialogOpen}
        onClose={() => setIsAiPromptDialogOpen(false)}
      />

      {/* Warning Dialog */}
      <Dialog open={isWarningDialogOpen} onOpenChange={setIsWarningDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              ⚠️ Warning: Use Generated Theme JSON at Your Own Risk
            </DialogTitle>
            <DialogDescription>
              Important information about using theme data generated from this
              tool
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="mb-3">
                The theme JSON and instructions provided in this tool (including
                AI-generated, manually customized, or imported themes) are
                intended for reference and experimentation purposes only. The
                maintainers of this tool do not assume any responsibility for
                any issues, damages, or losses that may arise from the use of
                generated theme data.
              </p>
              <p className="mb-2 font-medium">
                By using this tool, you acknowledge that:
              </p>
              <ul className="mb-3 ml-2 list-inside list-disc space-y-2">
                <li>
                  Generated theme JSON (whether AI-generated, manually created,
                  or imported) may contain errors, inaccuracies, or incomplete
                  design tokens
                </li>
                <li>
                  The extracted or customized tokens may not accurately
                  represent the intended design system or may not be suitable
                  for your specific use case
                </li>
                <li>
                  There are no guarantees regarding the accuracy, completeness,
                  or suitability of any generated theme JSON for any particular
                  purpose
                </li>
                <li>
                  You should validate and test all imported or generated theme
                  data before using it in production
                </li>
                <li>
                  You are solely responsible for reviewing, validating, and any
                  consequences resulting from the use of generated theme JSON in
                  your projects
                </li>
              </ul>
              <p className="font-medium">
                Please proceed with caution and ensure you understand the
                implications of using generated theme data. Always validate the
                results and test thoroughly before deploying to production.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
