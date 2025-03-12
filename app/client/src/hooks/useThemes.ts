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

  // TODO: Replace with Amplify DataStore query
  const listThemes = () =>
    [
      {
        id: 'CUSTOM1',
        name: 'Custom theme',
        primaryColor: 'rgb(27, 127, 158)',
        primaryColorHover: 'rgb(18, 100, 126)',
        borderRadius: '1px',
        buttonBorderRadius: '1px',
        borderColor: 'rgb(27, 127, 158)',
        spacingUnit: '5px',
      },
      {
        id: 'BLUE',
        name: 'Default Blue',
        fontFamily: 'Open Sans, Helvetica Neue, helvetica, arial, sans-serif',
        primaryColor: '#0060f0',
        primaryColorHover: '#0a4386',
        buttonBorderRadius: '.313em',
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
