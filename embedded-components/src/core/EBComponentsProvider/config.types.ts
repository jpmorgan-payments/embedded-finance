import { defaultResources } from '@/i18n/config';
import { DefaultOptions } from '@tanstack/react-query';
import { DeepPartial } from 'react-hook-form';

export type EBColorScheme = 'dark' | 'light' | 'system';

export type EBThemeVariables = {
  fontFamily?: string;
  headerFontFamily?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  borderRadius?: string;
  inputBorderRadius?: string;
  buttonBorderRadius?: string;
  buttonFontWeight?: string;
  buttonFontSize?: string;
  buttonLineHeight?: string;
  primaryButtonFontWeight?: string;
  secondaryButtonFontWeight?: string;
  destructiveButtonFontWeight?: string;
  primaryColor?: string;
  primaryHoverColor?: string;
  primaryActiveColor?: string;
  primaryForegroundColor?: string;
  secondaryColor?: string;
  secondaryHoverColor?: string;
  secondaryActiveColor?: string;
  secondaryForegroundColor?: string;
  destructiveColor?: string;
  destructiveHoverColor?: string;
  destructiveActiveColor?: string;
  destructiveForegroundColor?: string;
  mutedColor?: string;
  mutedForegroundColor?: string;
  accentColor?: string;
  accentForegroundColor?: string;
  cardColor?: string;
  cardForegroundColor?: string;
  popoverColor?: string;
  popoverForegroundColor?: string;
  spacingUnit?: string;
  borderColor?: string;
  inputColor?: string;
  ringColor?: string;
  zIndexOverlay?: number;
};

export type EBTheme = {
  colorScheme?: EBColorScheme;
  variables?: EBThemeVariables;
  light?: EBThemeVariables;
  dark?: EBThemeVariables;
};

export type EBConfig = {
  apiBaseUrl: string;
  theme?: EBTheme;
  headers?: Record<string, string>;
  reactQueryDefaultOptions?: DefaultOptions;
  contentTokens?: {
    name?: keyof typeof defaultResources;
    tokens?: DeepPartial<(typeof defaultResources)['enUS']>;
  };
  queryParams?: Record<string, string>;
};
