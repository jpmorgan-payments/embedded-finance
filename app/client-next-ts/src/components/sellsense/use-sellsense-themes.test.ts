import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSellSenseThemes } from './use-sellsense-themes';

describe('useSellSenseThemes hook', () => {
  it('should return theme functions', () => {
    const { result } = renderHook(() => useSellSenseThemes());

    expect(result.current).toHaveProperty('getThemeVariables');
    expect(result.current).toHaveProperty('mapThemeOption');
    expect(result.current).toHaveProperty('mapCustomTheme');

    expect(typeof result.current.getThemeVariables).toBe('function');
    expect(typeof result.current.mapThemeOption).toBe('function');
    expect(typeof result.current.mapCustomTheme).toBe('function');
  });

  it('should return theme variables for SellSense theme', () => {
    const { result } = renderHook(() => useSellSenseThemes());

    const themeVars = result.current.getThemeVariables('SellSense');
    expect(themeVars).toBeDefined();
    expect(typeof themeVars).toBe('object');
  });

  it('should return theme variables for S&P Theme', () => {
    const { result } = renderHook(() => useSellSenseThemes());

    const themeVars = result.current.getThemeVariables('S&P Theme');
    expect(themeVars).toBeDefined();
    expect(typeof themeVars).toBe('object');
  });

  it('should return theme variables for Create Commerce theme', () => {
    const { result } = renderHook(() => useSellSenseThemes());

    const themeVars = result.current.getThemeVariables('Create Commerce');
    expect(themeVars).toBeDefined();
    expect(typeof themeVars).toBe('object');
  });

  it('should return theme variables for PayFicient theme', () => {
    const { result } = renderHook(() => useSellSenseThemes());

    const themeVars = result.current.getThemeVariables('PayFicient');
    expect(themeVars).toBeDefined();
    expect(typeof themeVars).toBe('object');
  });

  it('should return empty object for Empty theme', () => {
    const { result } = renderHook(() => useSellSenseThemes());

    const themeVars = result.current.getThemeVariables('Empty');
    expect(themeVars).toEqual({});
  });

  it('should map theme options correctly', () => {
    const { result } = renderHook(() => useSellSenseThemes());

    const mappedTheme = result.current.mapThemeOption('SellSense');
    expect(mappedTheme).toBeDefined();
    expect(typeof mappedTheme).toBe('object');
  });

  it('should handle unknown theme gracefully', () => {
    const { result } = renderHook(() => useSellSenseThemes());

    const themeVars = result.current.getThemeVariables('Unknown Theme' as any);
    expect(themeVars).toBeDefined();
    expect(typeof themeVars).toBe('object');
  });

  it('should return consistent theme variables for same theme', () => {
    const { result: result1 } = renderHook(() => useSellSenseThemes());
    const { result: result2 } = renderHook(() => useSellSenseThemes());

    const theme1 = result1.current.getThemeVariables('SellSense');
    const theme2 = result2.current.getThemeVariables('SellSense');
    expect(theme1).toEqual(theme2);
  });

  it('should return different theme variables for different themes', () => {
    const { result } = renderHook(() => useSellSenseThemes());

    const defaultTheme = result.current.getThemeVariables('Default Blue');
    const sellSenseTheme = result.current.getThemeVariables('SellSense');

    expect(defaultTheme).not.toEqual(sellSenseTheme);
  });
});
