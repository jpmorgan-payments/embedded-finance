import { useState, useEffect } from 'react';

interface Theme {
  id: string;
  name: string;
  popoverColor?: string;
  popoverForegroundColor?: string;
  borderRadius?: string;
  buttonBorderRadius?: string;
  borderColor?: string;
  inputColor?: string;
}

// TODO: Replace with AWS Amplify DataStore
const STORAGE_KEY = 'embedded-banking-themes';

export const useThemes = () => {
  const [themes, setThemes] = useState<Theme[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setThemes(stored ? JSON.parse(stored) : []);
  }, []);

  // TODO: Replace with Amplify DataStore query
  const listThemes = () => themes;

  // TODO: Replace with Amplify DataStore save
  const saveTheme = (theme: Theme) => {
    const newThemes = themes.map(t => t.id === theme.id ? theme : t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newThemes));
    setThemes(newThemes);
  };

  // TODO: Replace with Amplify DataStore create
  const createTheme = (theme: Omit<Theme, 'id'>) => {
    const newTheme = { ...theme, id: Date.now().toString() };
    const newThemes = [...themes, newTheme];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newThemes));
    setThemes(newThemes);
    return newTheme;
  };

  return { themes, listThemes, saveTheme, createTheme };
};
