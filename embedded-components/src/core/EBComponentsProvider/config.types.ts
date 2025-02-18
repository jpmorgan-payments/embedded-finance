import { defaultResources } from '@/i18n/config';
import { DefaultOptions } from '@tanstack/react-query';
import { DeepPartial } from 'react-hook-form';

export type EBColorScheme = 'dark' | 'light' | 'system';

export type EBThemeVariables = {
  fontFamily?: string;
  backgroundColor?: string;
  foregroundColor?: string;
  primaryColor?: string;
  primaryColorHover?: string;
  primaryForegroundColor?: string;
  secondaryColor?: string;
  secondaryForegroundColor?: string;
  destructiveColor?: string;
  destructiveForegroundColor?: string;
  mutedColor?: string;
  mutedForegroundColor?: string;
  accentColor?: string;
  accentForegroundColor?: string;
  cardColor?: string;
  cardForegroundColor?: string;
  popoverColor?: string;
  popoverForegroundColor?: string;
  borderRadius?: string;
  buttonBorderRadius?: string;
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
