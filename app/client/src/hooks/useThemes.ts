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
  const listThemes = () => themes;

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
