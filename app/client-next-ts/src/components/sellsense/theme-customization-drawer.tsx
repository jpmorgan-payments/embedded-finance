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

// Group tokens logically for better organization
const TOKEN_GROUPS = {
  typography: {
    title: 'Typography',
    icon: Type,
    tokens: [
      'fontFamily',
      'headerFontFamily',
      'buttonFontFamily',
      'buttonFontWeight',
      'buttonFontSize',
      'buttonLineHeight',
      'buttonTextTransform',
      'buttonLetterSpacing',
      'primaryButtonFontWeight',
      'secondaryButtonFontWeight',
      'destructiveButtonFontWeight',
      'formLabelFontSize',
      'formLabelFontWeight',
      'formLabelLineHeight',
      'formLabelForegroundColor',
    ],
  },
  colors: {
    title: 'Colors',
    icon: Palette,
    tokens: [
      'backgroundColor',
      'foregroundColor',
      'cardColor',
      'cardForegroundColor',
      'popoverColor',
      'popoverForegroundColor',
      'mutedColor',
      'mutedForegroundColor',
      'accentColor',
      'accentForegroundColor',
      'borderColor',
      'inputColor',
      'inputBorderColor',
      'ringColor',
    ],
  },
  primary: {
    title: 'Primary Colors',
    icon: Palette,
    tokens: [
      'primaryColor',
      'primaryHoverColor',
      'primaryActiveColor',
      'primaryForegroundColor',
      'primaryForegroundHoverColor',
      'primaryForegroundActiveColor',
    ],
  },
  secondary: {
    title: 'Secondary Colors',
    icon: Palette,
    tokens: [
      'secondaryColor',
      'secondaryHoverColor',
      'secondaryActiveColor',
      'secondaryForegroundColor',
      'secondaryForegroundHoverColor',
      'secondaryForegroundActiveColor',
      'secondaryBorderWidth',
    ],
  },
  destructive: {
    title: 'Destructive Colors',
    icon: Palette,
    tokens: [
      'destructiveColor',
      'destructiveHoverColor',
      'destructiveActiveColor',
      'destructiveForegroundColor',
      'destructiveForegroundHoverColor',
      'destructiveForegroundActiveColor',
      'destructiveBorderWidth',
    ],
  },
  alerts: {
    title: 'Alert Colors',
    icon: Palette,
    tokens: [
      'alertColor',
      'alertForegroundColor',
      'informativeColor',
      'informativeAccentColor',
      'warningColor',
      'warningAccentColor',
      'successColor',
      'successAccentColor',
    ],
  },
  layout: {
    title: 'Layout & Spacing',
    icon: Layout,
    tokens: [
      'borderRadius',
      'inputBorderRadius',
      'buttonBorderRadius',
      'primaryBorderWidth',
      'spacingUnit',
      'zIndexOverlay',
      'shiftButtonOnActive',
    ],
  },
};

// Available themes for the dropdown
const AVAILABLE_THEMES: ThemeOption[] = [
  'Empty',
  'Default Blue',
  'S&P Theme',
  'Create Commerce',
  'SellSense',
  'PayFicient',
];

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
    initialCustomData.variables,
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isUrlCopied, setIsUrlCopied] = useState(false);

  // Helper function to determine step value based on token context
  const getStepValue = (token: string): number => {
    if (token.includes('zIndex')) return 1;
    if (token.includes('fontWeight')) return 100;
    if (token.includes('fontSize') || token.includes('lineHeight')) return 0.1;
    if (
      token.includes('spacing') ||
      token.includes('radius') ||
      token.includes('width')
    )
      return 1;
    return 0.1; // Default step
  };

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
      setCustomTheme(customData.variables);
    }
  }, [isOpen, currentTheme, customThemeData]);

  // Handle base theme selection
  const handleBaseThemeChange = (theme: ThemeOption) => {
    console.log('handleBaseThemeChange called with theme:', theme);

    const baseVariables = getThemeVariables(theme);

    // Reset to the new base theme (don't merge with existing custom changes)
    setCustomTheme(baseVariables);

    // Check if we have any custom changes
    const hasChanges = Object.keys(customTheme).some(
      (key) =>
        customTheme[key as keyof EBThemeVariables] !==
        baseVariables[key as keyof EBThemeVariables],
    );

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
    const baseVariables = getThemeVariables(currentBaseTheme);

    console.log('handleTokenChange called with:', {
      token,
      value,
      currentBaseTheme,
      baseVariables: Object.keys(baseVariables).length,
    });

    // Create updated theme by merging base variables with custom changes
    const updatedTheme = {
      ...baseVariables,
      ...customTheme,
      [token]: value,
    };

    setCustomTheme(updatedTheme);

    // Check if this change makes the theme different from base
    const hasChanges = Object.keys(updatedTheme).some(
      (key) =>
        updatedTheme[key as keyof EBThemeVariables] !==
        baseVariables[key as keyof EBThemeVariables],
    );

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
      const themeJson = JSON.stringify(customTheme, null, 2);
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

  // Reset to base theme
  const resetToBaseTheme = () => {
    const baseVariables = getThemeVariables(getCurrentBaseTheme());
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

  // Render form control based on token type
  const renderTokenControl = (token: keyof EBThemeVariables, value: any) => {
    const isColor = token.toLowerCase().includes('color');
    const isBoolean = typeof value === 'boolean';
    const isNumber = typeof value === 'number';
    const isSpacing =
      token.includes('spacing') ||
      token.includes('radius') ||
      token.includes('width');
    const isFontWeight = token.includes('fontweight');
    const isFontSize =
      token.includes('fontsize') || token.includes('lineheight');
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
            className="w-12 h-8 p-1 border rounded"
          />
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleTokenChange(token, e.target.value)}
            placeholder="Color value"
            className="flex-1"
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
          <SelectTrigger className="w-full">
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
          className="w-32"
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
            className="w-32"
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
          className="flex-1"
        />
      );
    }

    if (isFontWeight) {
      return (
        <Select
          value={value?.toString() || '400'}
          onValueChange={(val) => handleTokenChange(token, val)}
        >
          <SelectTrigger className="w-32">
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
          className="w-32"
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
        className="flex-1"
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
            className="h-7 w-7"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Info Alert */}
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <Info className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-0.5">Theme Customization</p>
                <p className="text-xs">
                  Customize design tokens to create your own theme. Changes are
                  applied in real-time.
                </p>
                <a
                  href="https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/README.md#theme-design-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-xs whitespace-nowrap"
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
                    <SelectTrigger className="w-full">
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
                  className="h-9 w-9 flex-shrink-0"
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
                className="flex items-center gap-2 flex-1 transition-all duration-200"
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
                className="flex items-center gap-2 flex-1 transition-all duration-200"
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
          </div>

          {/* Theme Groups */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(TOKEN_GROUPS).map(([groupKey, group]) => {
                  const Icon = group.icon;
                  return (
                    <AccordionItem key={groupKey} value={groupKey}>
                      <AccordionTrigger className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="h-4 w-4" />
                        {group.title}
                        <span className="text-xs text-gray-500 ml-auto">
                          ({group.tokens.length})
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          {group.tokens.map((token) => {
                            // Get the current value from the merged theme (base + custom)
                            const baseVariables = getThemeVariables(
                              getCurrentBaseTheme(),
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
                                  className="text-xs text-gray-600"
                                >
                                  {token}
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
