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
        id: 'CUSTOM3',
        name: 'Create Commerce',
        primaryColor: '#FD8172',
        secondaryColor: '#EDEFF7',
        buttonTextTransform: 'uppercase',
        secondaryActiveColor: '#2CB9AC',
        fontFamily: 'Open Sans',
        headerFontFamily: 'Open Sans',
        backgroundColor: '#3D5C6B',
        borderColor: '#0000004D',
        borderRadius: '8px',
        inputBorderRadius: '4px',
        buttonBorderRadius: '8px',
        buttonFontFamily: 'Open Sans',
        buttonLetterSpacing: '0.6px',
        secondaryBorderWidth: '1px',
        cardColor: '#3D5C6B',
        foregroundColor: '#EDEFF7',
        primaryForegroundColor: '#3D5C6B',
        secondaryForegroundColor: '#3D5C6B',
        accentColor: '#38474E',
        mutedForegroundColor: '#98A2CD',
        cardForegroundColor: '#EDEFF7',
        alertForegroundColor: '#0F171F', //'hsl(240 10% 3.9%)', // text
        formLabelForegroundColor: '#EDEFF7', // text in the forms
        inputColor: '#38474E', // input bg color
        popoverColor: '#38474E', // dropdown bg color
        popoverForegroundColor: '#EDEFF7', // dropdown text color
        primaryForegroundHoverColor: '#EDEFF7',
        accentForegroundColor: '#EDEFF7',
        secondaryForegroundHoverColor: '#EDEFF7',
        // informativeColor: '3D5C6B', border icon
        // informativeAccentColor: '3D5C6B' background info / warning / error
        //
      },
      {
        id: 'CUSTOM3',
        name: 'Create Commerce',
        primaryColor: '#FD8172',
        secondaryColor: '#EDEFF7',
        buttonTextTransform: 'uppercase',
        secondaryActiveColor: '#2CB9AC',
        fontFamily: 'Open Sans',
        headerFontFamily: 'Open Sans',
        backgroundColor: '#3D5C6B',
        borderColor: '#0000004D',
        borderRadius: '8px',
        inputBorderRadius: '4px',
        buttonBorderRadius: '8px',
        buttonFontFamily: 'Open Sans',
        buttonLetterSpacing: '0.6px',
        secondaryBorderWidth: '1px',
        cardColor: '#3D5C6B',
        foregroundColor: '#EDEFF7',
        primaryForegroundColor: '#3D5C6B',
        secondaryForegroundColor: '#3D5C6B',
        accentColor: '#38474E',
        mutedForegroundColor: '#98A2CD',
        cardForegroundColor: '#EDEFF7',
        alertForegroundColor: '#0F171F', //'hsl(240 10% 3.9%)', // text
        formLabelForegroundColor: '#EDEFF7', // text in the forms
        inputColor: '#38474E', // input bg color
        popoverColor: '#38474E', // dropdown bg color
        popoverForegroundColor: '#EDEFF7', // dropdown text color
        primaryForegroundHoverColor: '#EDEFF7',
        accentForegroundColor: '#EDEFF7',
        secondaryForegroundHoverColor: '#EDEFF7',
        // informativeColor: '3D5C6B', border icon
        // informativeAccentColor: '3D5C6B' background info / warning / error
        //
      },
      {
        id: 'CUSTOM4',
        name: 'SellSense',
        primaryColor: '#f55727',
        buttonTextTransform: 'uppercase',
        secondaryActiveColor: '#2CB9AC',
        fontFamily: 'Inter',
        headerFontFamily: 'Inter',
        backgroundColor: '#FAF9F7',
        borderColor: '#0000004D',
        borderRadius: '8px',
        inputBorderRadius: '4px',
        buttonBorderRadius: '8px',
        buttonFontFamily: 'Inter',
        buttonLetterSpacing: '0.6px',
        cardColor: '#F7F3F0',
        secondaryBorderWidth: '1px',
        secondaryColor: '#FDF7F0',
        secondaryForegroundColor: '#f55727',
        secondaryHoverColor: 'hsla(240, 4.8%, 95.9%, 0.5)',
      },
      {
        id: 'CUSTOM5',
        name: 'PayFicient',
        fontFamily: 'Manrope',
        headerFontFamily: 'Manrope',
        backgroundColor: '#FFFCF6',
        borderColor: '#0000004D',
        borderRadius: '5px',
        inputBorderRadius: '4px',
        buttonBorderRadius: '8px',
        buttonFontFamily: 'Manrope',
        buttonTextTransform: 'uppercase',
        buttonLetterSpacing: '0.6px',
        primaryColor: '#177556',
        secondaryColor: '#FFFCF6',
        secondaryForegroundColor: '#177556',
        secondaryBorderWidth: '1px',
        cardColor: '#F7F3F0',
        secondaryHoverColor: 'hsla(240, 4.8%, 95.9%, 0.5)',
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
