import { useState, useEffect } from 'react';

export interface ThemeConfig {
  id: string;
  name: string;
  borderRadius?: string;
  buttonBorderRadius?: string;
  borderColor?: string;
  inputColor?: string;
  fontFamily?: string;
}

// TODO: Replace with AWS Amplify DataStore
const STORAGE_KEY = 'embedded-banking-themes';

export const useThemes = () => {
  const [themes, setThemes] = useState<ThemeConfig[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setThemes(stored ? JSON.parse(stored) : []);
  }, []);

  // TODO: Replace with Amplify DataStore query
  const listThemes = () => themes;

  // TODO: Replace with Amplify DataStore save
  const saveTheme = (theme: ThemeConfig) => {
    const newThemes = themes.map((t) => (t.id === theme.id ? theme : t));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newThemes));
    setThemes(newThemes);
  };

  // TODO: Replace with Amplify DataStore create
  const createTheme = (theme: Omit<ThemeConfig, 'id'>) => {
    const newTheme = { ...theme, id: Date.now().toString() };
    const newThemes = [...themes, newTheme];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newThemes));
    setThemes(newThemes);
    return newTheme;
  };

  return { themes, listThemes, saveTheme, createTheme };
};
