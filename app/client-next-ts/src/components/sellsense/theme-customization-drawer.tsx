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
} from 'lucide-react';
import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';
import type { ThemeOption } from './use-sellsense-themes';
import { useSellSenseThemes } from './use-sellsense-themes';
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
  contentHeaderFontFamily: 'Header Font Family',
  actionableFontFamily: 'Actionable Font Family',
  actionableFontWeight: 'Actionable Font Weight',
  actionableFontSize: 'Actionable Font Size',
  actionableLineHeight: 'Actionable Line Height',
  actionableTextTransform: 'Actionable Text Transform',
  actionableLetterSpacing: 'Actionable Letter Spacing',
  actionablePrimaryFontWeight: 'Primary Action Font Weight',
  actionableSecondaryFontWeight: 'Secondary Action Font Weight',

  containerBackground: 'Page Background',
  containerPrimaryBackground: 'Card Background',
  containerPrimaryForeground: 'Card Foreground',
  containerSecondaryBackground: 'Muted Background',
  containerSecondaryForeground: 'Muted Foreground',
  overlayableBackground: 'Overlay Background',
  overlayableForeground: 'Overlay Foreground',
  overlayableZIndex: 'Overlay Z-Index',
  accentBackground: 'Accent Background',
  accentForeground: 'Accent Foreground',

  actionablePrimaryBackground: 'Primary Background',
  actionablePrimaryBackgroundHover: 'Primary Background Hover',
  actionablePrimaryBackgroundActive: 'Primary Background Active',
  actionablePrimaryForeground: 'Primary Foreground',
  actionablePrimaryForegroundHover: 'Primary Foreground Hover',
  actionablePrimaryForegroundActive: 'Primary Foreground Active',
  actionablePrimaryBorderWidth: 'Primary Border Width',
  actionableBorderRadius: 'Action Border Radius',
  actionableShiftOnActive: 'Shift On Active',

  actionableSecondaryBackground: 'Secondary Background',
  actionableSecondaryBackgroundHover: 'Secondary Background Hover',
  actionableSecondaryBackgroundActive: 'Secondary Background Active',
  actionableSecondaryForeground: 'Secondary Foreground',
  actionableSecondaryForegroundHover: 'Secondary Foreground Hover',
  actionableSecondaryForegroundActive: 'Secondary Foreground Active',
  actionableSecondaryBorderWidth: 'Secondary Border Width',

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

  sentimentNegativeBackground: 'Negative Background',
  sentimentNegativeBackgroundHover: 'Negative Background Hover',
  sentimentNegativeBackgroundActive: 'Negative Background Active',
  sentimentNegativeForeground: 'Negative Foreground',
  sentimentNegativeForegroundHover: 'Negative Foreground Hover',
  sentimentNegativeForegroundActive: 'Negative Foreground Active',

  sentimentCautionForeground: 'Caution Foreground',
  sentimentCautionAccentBackground: 'Caution Accent Background',
  sentimentPositiveForeground: 'Positive Foreground',
  sentimentPositiveAccentBackground: 'Positive Accent Background',
  statusInfoForeground: 'Info Foreground',
  statusInfoAccentBackground: 'Info Accent Background',
};

// Semantic token order (Salt-inspired characteristics)
const SEMANTIC_TOKEN_ORDER = [
  'contentFontFamily',
  'contentHeaderFontFamily',
  'actionableFontFamily',
  'actionableFontWeight',
  'actionableFontSize',
  'actionableLineHeight',
  'actionableTextTransform',
  'actionableLetterSpacing',
  'actionablePrimaryFontWeight',
  'actionableSecondaryFontWeight',

  'containerBackground',
  'containerPrimaryBackground',
  'containerPrimaryForeground',
  'containerSecondaryBackground',
  'containerSecondaryForeground',
  'overlayableBackground',
  'overlayableForeground',
  'overlayableZIndex',
  'accentBackground',
  'accentForeground',

  'actionablePrimaryBackground',
  'actionablePrimaryBackgroundHover',
  'actionablePrimaryBackgroundActive',
  'actionablePrimaryForeground',
  'actionablePrimaryForegroundHover',
  'actionablePrimaryForegroundActive',
  'actionablePrimaryBorderWidth',
  'actionableBorderRadius',
  'actionableShiftOnActive',

  'actionableSecondaryBackground',
  'actionableSecondaryBackgroundHover',
  'actionableSecondaryBackgroundActive',
  'actionableSecondaryForeground',
  'actionableSecondaryForegroundHover',
  'actionableSecondaryForegroundActive',
  'actionableSecondaryBorderWidth',

  'editableBackground',
  'editableBorderColor',
  'editableBorderRadius',
  'editableLabelFontSize',
  'editableLabelFontWeight',
  'editableLabelLineHeight',
  'editableLabelForeground',

  'separableBorderColor',
  'separableBorderRadius',
  'spacingUnit',

  'focusedRingColor',

  'sentimentNegativeBackground',
  'sentimentNegativeBackgroundHover',
  'sentimentNegativeBackgroundActive',
  'sentimentNegativeForeground',
  'sentimentNegativeForegroundHover',
  'sentimentNegativeForegroundActive',

  'sentimentCautionForeground',
  'sentimentCautionAccentBackground',
  'sentimentPositiveForeground',
  'sentimentPositiveAccentBackground',
  'statusInfoForeground',
  'statusInfoAccentBackground',
] as const;

const TOKEN_GROUPS = {
  typography: {
    title: 'Content & Action Typography',
    icon: Type,
    tokens: [
      'contentFontFamily',
      'contentHeaderFontFamily',
      'actionableFontFamily',
      'actionableFontWeight',
      'actionableFontSize',
      'actionableLineHeight',
      'actionableTextTransform',
      'actionableLetterSpacing',
      'actionablePrimaryFontWeight',
      'actionableSecondaryFontWeight',
    ],
  },
  surfaces: {
    title: 'Surfaces & Overlay',
    icon: Palette,
    tokens: [
      'containerBackground',
      'containerPrimaryBackground',
      'containerPrimaryForeground',
      'containerSecondaryBackground',
      'containerSecondaryForeground',
      'overlayableBackground',
      'overlayableForeground',
      'overlayableZIndex',
      'accentBackground',
      'accentForeground',
    ],
  },
  primaryActions: {
    title: 'Primary Actionable',
    icon: Brush,
    tokens: [
      'actionablePrimaryBackground',
      'actionablePrimaryBackgroundHover',
      'actionablePrimaryBackgroundActive',
      'actionablePrimaryForeground',
      'actionablePrimaryForegroundHover',
      'actionablePrimaryForegroundActive',
      'actionablePrimaryBorderWidth',
      'actionableBorderRadius',
      'actionableShiftOnActive',
    ],
  },
  secondaryActions: {
    title: 'Secondary Actionable',
    icon: Brush,
    tokens: [
      'actionableSecondaryBackground',
      'actionableSecondaryBackgroundHover',
      'actionableSecondaryBackgroundActive',
      'actionableSecondaryForeground',
      'actionableSecondaryForegroundHover',
      'actionableSecondaryForegroundActive',
      'actionableSecondaryBorderWidth',
    ],
  },
  editable: {
    title: 'Editable / Inputs',
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
  separable: {
    title: 'Borders & Spacing',
    icon: Layout,
    tokens: ['separableBorderColor', 'separableBorderRadius', 'spacingUnit'],
  },
  focused: {
    title: 'Focus',
    icon: Info,
    tokens: ['focusedRingColor'],
  },
  sentiment: {
    title: 'Sentiment & Status',
    icon: Palette,
    tokens: [
      'sentimentNegativeBackground',
      'sentimentNegativeBackgroundHover',
      'sentimentNegativeBackgroundActive',
      'sentimentNegativeForeground',
      'sentimentNegativeForegroundHover',
      'sentimentNegativeForegroundActive',
      'sentimentCautionForeground',
      'sentimentCautionAccentBackground',
      'sentimentPositiveForeground',
      'sentimentPositiveAccentBackground',
      'statusInfoForeground',
      'statusInfoAccentBackground',
    ],
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

    const baseVariables = pickSemanticTokens(getThemeVariables(theme));

    // Reset to the new base theme (don't merge with existing custom changes)
    setCustomTheme(baseVariables);

    // Check if we have any custom changes
    const hasChanges = Object.keys(customTheme).some((key) => {
      const typedKey = key as keyof EBThemeVariables;
      return customTheme[typedKey] !== baseVariables[typedKey];
    });

    if (hasChanges) {
      // We have custom changes, keep them in custom mode
      const customThemeData: CustomThemeData = {
        baseTheme: theme,
        variables: customTheme,
      };
      onThemeChange('Custom', customThemeData as any);
    } else {
      // No custom changes, just change the theme parameter
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
      const themeJson = JSON.stringify(
        pickSemanticTokens(customTheme),
        null,
        2,
      );
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
  }, [customTheme]);

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

      // Merge with existing custom theme and normalize to semantic tokens
      const mergedTheme = pickSemanticTokens({ ...customTheme, ...variables });
      setCustomTheme(mergedTheme);

      // Update the theme with merged values
      const currentBaseTheme = getCurrentBaseTheme();
      const baseVariables = getThemeVariables(currentBaseTheme);

      // Check if this makes the theme different from base
      const hasChanges = Object.keys(mergedTheme).some(
        (key) =>
          mergedTheme[key as keyof EBThemeVariables] !==
          baseVariables[key as keyof EBThemeVariables],
      );

      if (hasChanges) {
        const customThemeData: CustomThemeData = {
          baseTheme: currentBaseTheme,
          variables: mergedTheme,
        };
        onThemeChange('Custom', customThemeData as any);
      } else {
        onThemeChange(currentBaseTheme, {});
      }

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
      return (
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
        className={`fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col ${
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
              <div className="text-xs text-gray-700">
                <p className="text-xs">
                  Customize design tokens to create your own theme. Changes are
                  applied in real-time.
                </p>
                <a
                  href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/README.md#theme-design-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-800 underline text-xs whitespace-nowrap"
                >
                  View design tokens docs →
                </a>
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
                {isCopied ? 'Copied!' : 'Copy Theme JSON'}
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
            <ScrollArea className="h-full px-6">
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
            </ScrollArea>
          </div>
        </div>
      </div>
    </>
  );
}
