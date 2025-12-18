'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Palette,
  Type,
  Layout,
  Copy,
  Share2,
  RotateCcw,
  Brush,
  X,
  Check,
  Info,
  Clipboard,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AiPromptDialog } from './ai-prompt-dialog';
import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';
import type { ThemeOption } from './use-sellsense-themes';
import { useSellSenseThemes } from './use-sellsense-themes';
import { ContrastChecker } from './contrast-checker';
import { getValidColorPairs } from './theme-color-pairs';
import { runA11yChecks } from '@/lib/a11y-checks';
import { calculateContrast } from '@/lib/color-contrast';
import { Badge } from '@/components/ui/badge';
import React from 'react';

interface ThemeCustomizationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeOption;
  onThemeChange: (
    theme: ThemeOption,
    customVariables?: EBThemeVariables,
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
  SEMANTIC_TOKEN_ORDER as readonly string[],
);

const pickSemanticTokens = (
  variables: EBThemeVariables = {},
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
      getThemeVariables('Custom', initialCustomData.variables || {}),
    ),
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
      getThemeVariables(currentBaseTheme),
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
          getThemeVariables('Custom', customData.variables || {}),
        ),
      );
    }
  }, [isOpen, currentTheme, customThemeData, getThemeVariables]);

  // Handle base theme selection
  const handleBaseThemeChange = (theme: ThemeOption) => {
    console.log('handleBaseThemeChange called with theme:', theme);

    const currentBaseTheme = getCurrentBaseTheme();
    const currentBaseVariables = pickSemanticTokens(
      getThemeVariables(currentBaseTheme),
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
    value: string | number | boolean,
  ) => {
    // Get the current base theme variables
    const currentBaseTheme = getCurrentBaseTheme();
    const baseVariables = pickSemanticTokens(
      getThemeVariables(currentBaseTheme),
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
          'Invalid theme data structure. Expected { variables: { ... } } or direct variables object',
        );
      }

      // Validate that we have some valid properties
      const validProperties = Object.keys(variables).filter(
        (key) =>
          variables[key as keyof EBThemeVariables] !== undefined &&
          variables[key as keyof EBThemeVariables] !== null,
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
      getThemeVariables(getCurrentBaseTheme()),
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
        (p) => p.foreground === token || p.background === token,
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
                  <Badge className="bg-green-100 text-green-800 border-0 text-xs px-1.5 py-0">
                    ✓ {contrastResult.ratio.toFixed(1)}:1
                  </Badge>
                ) : passesAA ? (
                  <Badge className="bg-amber-100 text-amber-800 border-0 text-xs px-1.5 py-0">
                    ⚠ {contrastResult.ratio.toFixed(1)}:1
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 border-0 text-xs px-1.5 py-0">
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
              className="w-12 h-8 p-1 border border-gray-300 rounded bg-white"
            />
            <Input
              type="text"
              value={value || ''}
              onChange={(e) => handleTokenChange(token, e.target.value)}
              placeholder="Color value"
              className="flex-1 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
            />
            {contrastBadge}
          </div>
          {contrastBadge && relevantPairs.length > 0 && (
            <div className="text-xs text-gray-500 ml-14">
              {relevantPairs[0].label}
            </div>
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
      return (
        <Input
          type="number"
          value={value || 0}
          onChange={(e) => handleTokenChange(token, Number(e.target.value))}
          min={constraints.min}
          max={constraints.max}
          step={constraints.step}
          className="w-32 border-gray-300 bg-white text-gray-900"
        />
      );
    }

    if (isSpacing) {
      // For spacing tokens that are numeric, use number input
      if (typeof value === 'number' || !isNaN(Number(value))) {
        const constraints = getNumberConstraints(token);
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleTokenChange(token, e.target.value)}
            min={constraints.min}
            max={constraints.max}
            step={constraints.step}
            placeholder="e.g., 8"
            className="w-32 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
          />
        );
      }
      // For string-based spacing (like CSS units), use text input
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => handleTokenChange(token, e.target.value)}
          placeholder="e.g., 8px, 0.5rem"
          className="flex-1 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
        />
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
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => handleTokenChange(token, e.target.value)}
          min={constraints.min}
          max={constraints.max}
          step={constraints.step}
          placeholder="e.g., 0.875"
          className="w-32 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
        />
      );
    }

    // Default text input
    return (
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => handleTokenChange(token, e.target.value)}
        placeholder="Value"
        className="flex-1 border-gray-300 bg-white text-gray-900 placeholder-gray-500"
      />
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-[32rem] bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
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
            className="h-7 w-7 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Info Alert */}
          <div className="px-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-start gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
              <Info className="h-3 w-3 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-700 flex-1">
                <p className="text-xs">
                  Customize design tokens to create your own theme. Changes are
                  applied in real-time.
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                  <a
                    href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/README.md#theme-design-tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:text-gray-800 underline text-xs whitespace-nowrap"
                  >
                    View design tokens docs →
                  </a>
                  <button
                    onClick={() => setIsAiPromptDialogOpen(true)}
                    className="text-gray-500 hover:text-gray-700 underline text-xs flex items-center gap-1"
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
          <div className="p-4 space-y-4 border-b border-gray-200 flex-shrink-0">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">
                  Start from a theme
                </h3>
                <p className="text-xs text-gray-500 mb-3">
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
                        value,
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
                  className="h-9 w-9 flex-shrink-0 border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Export Options */}
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
              <Switch
                checked={exportChangedOnly}
                onCheckedChange={setExportChangedOnly}
                id="export-changed-only"
              />
              <Label
                htmlFor="export-changed-only"
                className="text-xs text-gray-700 cursor-pointer"
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
                className={`flex items-center gap-2 flex-1 transition-all duration-200 ${
                  isCopied
                    ? ''
                    : 'border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50'
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
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                title="Download theme as JSON file"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant={isUrlCopied ? 'default' : 'outline'}
                size="sm"
                onClick={shareThemeAsUrl}
                className={`flex items-center gap-2 flex-1 transition-all duration-200 ${
                  isUrlCopied
                    ? ''
                    : 'border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50'
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
                className="flex items-center gap-2 w-full transition-all duration-200 border-gray-300 text-gray-700 hover:text-gray-900 hover:bg-gray-50"
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
                      getThemeVariables(currentBaseTheme),
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
                        pair.backgroundValue,
                      ),
                    }));
                    const failingContrast = contrastResults.filter(
                      (p) => !p.result || p.result.level === 'Fail',
                    ).length;
                    const a11ySummary = runA11yChecks(mergedTheme);
                    const totalIssues = failingContrast + a11ySummary.failing;
                    const hasIssues = totalIssues > 0;

                    return (
                      <button
                        type="button"
                        onClick={() => setIsA11yExpanded(!isA11yExpanded)}
                        className={`flex items-center justify-between w-full p-2.5 rounded-lg transition-colors ${
                          hasIssues
                            ? 'bg-red-50 hover:bg-red-100 border border-red-200'
                            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                        }`}
                        aria-expanded={isA11yExpanded}
                        aria-controls="a11y-check-details"
                      >
                        <div className="flex flex-col items-start flex-1 min-w-0 gap-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsWarningDialogOpen(true);
                            }}
                            className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 transition-colors text-xs font-medium"
                            title="View warning about using generated theme JSON"
                            aria-label="View warning about using generated theme JSON"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>Warning: Use at Your Own Risk</span>
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 font-bold">
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
                                  ? 'text-red-700 font-medium'
                                  : 'text-gray-600'
                              }`}
                            >
                              {hasIssues
                                ? `⚠ ${totalIssues} issue${totalIssues !== 1 ? 's' : ''} found`
                                : '✓ All checks passing'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {!isA11yExpanded && hasIssues && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
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
                          getThemeVariables(currentBaseTheme),
                        );
                        const mergedTheme = pickSemanticTokens({
                          ...baseVariables,
                          ...customTheme,
                        });
                        const a11ySummary = runA11yChecks(mergedTheme);
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
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
                                  className={`p-3 rounded-lg border ${
                                    check.status === 'pass'
                                      ? 'bg-green-50 border-green-200'
                                      : check.status === 'warning'
                                        ? 'bg-amber-50 border-amber-200'
                                        : 'bg-red-50 border-red-200'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    {check.status === 'pass' ? (
                                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                    ) : check.status === 'warning' ? (
                                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    ) : (
                                      <X className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900">
                                        {check.label}
                                      </div>
                                      <div className="text-xs text-gray-700 mt-1">
                                        {check.message}
                                      </div>
                                      {check.recommendation && (
                                        <div className="text-xs text-gray-600 mt-2 italic">
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
                          getThemeVariables(currentBaseTheme),
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
                              pair.backgroundValue,
                            ),
                          };
                        });

                        const failingPairs = contrastResults.filter(
                          (p) => !p.result || p.result.level === 'Fail',
                        );
                        const aaOnlyPairs = contrastResults.filter(
                          (p) =>
                            p.result &&
                            p.result.level === 'AA' &&
                            p.result.passes.AAA.normal === false,
                        );

                        const filteredPairs =
                          contrastFilter === 'failing'
                            ? failingPairs
                            : contrastFilter === 'aa-only'
                              ? aaOnlyPairs
                              : contrastResults;

                        const aaPassing = contrastResults.filter(
                          (p) => p.result && p.result.passes.AA.normal,
                        ).length;
                        const aaaPassing = contrastResults.filter(
                          (p) => p.result && p.result.passes.AAA.normal,
                        ).length;

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900">
                                  Color Contrast
                                </h4>
                                <p className="text-xs text-gray-600 mt-1">
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
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {filteredPairs.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 rounded-lg">
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
                          <span className="text-xs text-gray-500 ml-auto">
                            ({group.tokens.length})
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            {group.tokens.map((token) => {
                              // Get the current value from the merged theme (base + custom)
                              const baseVariables = pickSemanticTokens(
                                getThemeVariables(getCurrentBaseTheme()),
                              );
                              const value =
                                customTheme[token as keyof EBThemeVariables] !==
                                undefined
                                  ? customTheme[token as keyof EBThemeVariables]
                                  : baseVariables[
                                      token as keyof EBThemeVariables
                                    ];

                              return (
                                <div key={token} className="space-y-2">
                                  <Label
                                    htmlFor={token}
                                    className="text-xs text-gray-900 font-medium"
                                  >
                                    {TOKEN_LABELS[token] || token}
                                  </Label>
                                  {renderTokenControl(
                                    token as keyof EBThemeVariables,
                                    value,
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
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
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
              <ul className="list-disc list-inside space-y-2 ml-2 mb-3">
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
