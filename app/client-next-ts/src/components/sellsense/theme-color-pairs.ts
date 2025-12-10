import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';

export interface ColorPair {
  background: keyof EBThemeVariables;
  foreground: keyof EBThemeVariables;
  label: string;
  context: 'text' | 'button' | 'input' | 'status' | 'navigation';
  textSize?: 'normal' | 'large';
}

/**
 * Map design tokens to their foreground/background relationships
 * for contrast checking
 */
export const COLOR_PAIRS: ColorPair[] = [
  // Primary buttons
  {
    background: 'actionableAccentedBoldBackground',
    foreground: 'actionableAccentedBoldForeground',
    label: 'Primary Button',
    context: 'button',
  },
  {
    background: 'actionableAccentedBoldBackgroundHover',
    foreground: 'actionableAccentedBoldForegroundHover',
    label: 'Primary Button (Hover)',
    context: 'button',
  },
  {
    background: 'actionableAccentedBoldBackgroundActive',
    foreground: 'actionableAccentedBoldForegroundActive',
    label: 'Primary Button (Active)',
    context: 'button',
  },

  // Secondary buttons
  {
    background: 'actionableSubtleBackground',
    foreground: 'actionableSubtleForeground',
    label: 'Secondary Button',
    context: 'button',
  },
  {
    background: 'actionableSubtleBackgroundHover',
    foreground: 'actionableSubtleForegroundHover',
    label: 'Secondary Button (Hover)',
    context: 'button',
  },
  {
    background: 'actionableSubtleBackgroundActive',
    foreground: 'actionableSubtleForegroundActive',
    label: 'Secondary Button (Active)',
    context: 'button',
  },

  // Negative/Destructive buttons
  {
    background: 'actionableNegativeBoldBackground',
    foreground: 'actionableNegativeBoldForeground',
    label: 'Destructive Button',
    context: 'button',
  },
  {
    background: 'actionableNegativeBoldBackgroundHover',
    foreground: 'actionableNegativeBoldForegroundHover',
    label: 'Destructive Button (Hover)',
    context: 'button',
  },
  {
    background: 'actionableNegativeBoldBackgroundActive',
    foreground: 'actionableNegativeBoldForegroundActive',
    label: 'Destructive Button (Active)',
    context: 'button',
  },

  // Container text
  {
    background: 'containerPrimaryBackground',
    foreground: 'contentPrimaryForeground',
    label: 'Body Text',
    context: 'text',
    textSize: 'normal',
  },
  {
    background: 'containerCardBackground',
    foreground: 'containerPrimaryForeground',
    label: 'Card Text',
    context: 'text',
    textSize: 'normal',
  },
  {
    background: 'containerSecondaryBackground',
    foreground: 'containerSecondaryForeground',
    label: 'Muted Text',
    context: 'text',
    textSize: 'normal',
  },

  // Form inputs
  {
    background: 'editableBackground',
    foreground: 'containerPrimaryForeground',
    label: 'Input Field Text',
    context: 'input',
    textSize: 'normal',
  },
  {
    background: 'containerPrimaryBackground',
    foreground: 'editableLabelForeground',
    label: 'Form Label',
    context: 'text',
    textSize: 'normal',
  },

  // Status colors
  {
    background: 'sentimentPositiveAccentBackground',
    foreground: 'sentimentPositiveForeground',
    label: 'Success Message',
    context: 'status',
  },
  {
    background: 'statusSuccessAccentBackground',
    foreground: 'statusSuccessForeground',
    label: 'Success Status',
    context: 'status',
  },
  {
    background: 'sentimentNegativeAccentBackground',
    foreground: 'actionableNegativeBoldForeground',
    label: 'Error Message',
    context: 'status',
  },
  {
    background: 'statusErrorBackground',
    foreground: 'statusErrorForegroundInformative',
    label: 'Error Status',
    context: 'status',
  },
  {
    background: 'sentimentCautionAccentBackground',
    foreground: 'sentimentCautionForeground',
    label: 'Warning Message',
    context: 'status',
  },
  {
    background: 'statusWarningAccentBackground',
    foreground: 'statusWarningForeground',
    label: 'Warning Status',
    context: 'status',
  },
  {
    background: 'statusInfoAccentBackground',
    foreground: 'statusInfoForeground',
    label: 'Info Status',
    context: 'status',
  },

  // Navigation
  {
    background: 'navigableBackground',
    foreground: 'navigableForeground',
    label: 'Sidebar Text',
    context: 'navigation',
    textSize: 'normal',
  },
  {
    background: 'navigableAccentBackground',
    foreground: 'navigableAccentForeground',
    label: 'Sidebar Active',
    context: 'navigation',
    textSize: 'normal',
  },

  // Overlays
  {
    background: 'overlayableBackground',
    foreground: 'overlayableForeground',
    label: 'Dialog/Popover',
    context: 'text',
    textSize: 'normal',
  },

  // Accent colors
  {
    background: 'accentBackground',
    foreground: 'contentAccentForeground',
    label: 'Accent Text',
    context: 'text',
    textSize: 'normal',
  },
];

/**
 * Get color pairs that are valid for the given theme variables
 */
export function getValidColorPairs(
  variables: EBThemeVariables,
): Array<ColorPair & { foregroundValue: string; backgroundValue: string }> {
  return COLOR_PAIRS.filter((pair) => {
    const fg = variables[pair.foreground];
    const bg = variables[pair.background];
    return (
      fg !== undefined &&
      fg !== null &&
      fg !== '' &&
      bg !== undefined &&
      bg !== null &&
      bg !== ''
    );
  }).map((pair) => ({
    ...pair,
    foregroundValue: String(variables[pair.foreground] || ''),
    backgroundValue: String(variables[pair.background] || ''),
  }));
}


