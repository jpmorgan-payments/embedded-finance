import { useState, useEffect } from 'react';
import { useLocalStorage } from '@mantine/hooks';

export interface ThemeConfig {
  id: string;
  name: string;
  borderRadius?: string;
  buttonBorderRadius?: string;
  borderColor?: string;
  inputColor?: string;
  fontFamily?: string;
  colorScheme?: 'light' | 'dark';
  primaryColor?: string;
  primaryColorHover?: string;
  secondaryColor?: string;
  spacingUnit?: string;
}

const STORAGE_KEY = 'embedded-banking-themes';

export const useThemes = () => {
  const [themes, setThemes] = useLocalStorage<ThemeConfig[]>({
    key: STORAGE_KEY,
    defaultValue: [],
  });

  // TODO: Replace with Amplify DataStore query
  const listThemes = () => [
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
    ...themes,
  ];

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
