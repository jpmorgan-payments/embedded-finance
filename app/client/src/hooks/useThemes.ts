import { useState, useEffect } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';

export interface ThemeConfig extends EBThemeVariables {
  id: string;
  name: string;
}

const STORAGE_KEY = 'embedded-banking-themes';

export const useThemes = () => {
  const [themes, setThemes] = useLocalStorage<ThemeConfig[]>({
    key: STORAGE_KEY,
    defaultValue: [],
  });

  const listThemes = () =>
    [
      {
        id: 'BLUE',
        name: 'Default Blue',
        fontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
        primaryColor: '#0060f0',
        primaryColorHover: '#0a4386',
        buttonBorderRadius: '.313em',
      },
      {
        id: 'CUSTOM2',
        name: 'S&P Theme',
        fontFamily: 'Open Sans',
        headerFontFamily: 'Amplitude',
        buttonFontFamily: 'Amplitude',
        buttonTextTransform: 'uppercase',
        buttonLetterSpacing: '0.6px',
        primaryColor: '#1B7F9E',
        buttonBorderRadius: '8px',
        secondaryColor: 'white',
        secondaryForegroundColor: '#1B7F9E',
        secondaryBorderWidth: '1px',
      },
      {
        id: 'CUSTOM3  ',
        name: 'Create Commerce',
        // TODO: Add Create Commerce theme following embedded-components\src\core\EBComponentsProvider\convert-theme-to-css-variables.ts
      },
      {
        id: 'CUSTOM4',
        name: 'SellSense',
        // TODO: Add SellSense theme following embedded-components\src\core\EBComponentsProvider\convert-theme-to-css-variables.ts
      },
      {
        id: 'CUSTOM5',
        name: 'PayFicient',
        // TODO: Add PayFicient theme following embedded-components\src\core\EBComponentsProvider\convert-theme-to-css-variables.ts
      },
      ...themes,
    ] as ThemeConfig[];

  // TODO: Replace with Amplify DataStore save
  const saveTheme = (theme: ThemeConfig) => {
    const newThemes = themes.map((t) => (t.id === theme.id ? theme : t));
    setThemes(newThemes);
  };

  // TODO: Replace with Amplify DataStore create
  const createTheme = (theme: Omit<ThemeConfig, 'id'>) => {
    const newTheme = { ...theme, id: Date.now().toString() };
    const newThemes = [...themes, newTheme];
    setThemes(newThemes);
    return newTheme;
  };

  return { themes, listThemes, saveTheme, createTheme };
};
