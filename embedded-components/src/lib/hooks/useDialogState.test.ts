import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useDialogState } from './useDialogState';

describe('useDialogState', () => {
  it('defaults to closed', () => {
    const { result } = renderHook(() => useDialogState());
    expect(result.current.isOpen).toBe(false);
  });

  it('can be initialized as open', () => {
    const { result } = renderHook(() => useDialogState(true));
    expect(result.current.isOpen).toBe(true);
  });

  it('open() sets isOpen to true', () => {
    const { result } = renderHook(() => useDialogState());
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
  });

  it('close() sets isOpen to false', () => {
    const { result } = renderHook(() => useDialogState(true));
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it('toggle() flips isOpen', () => {
    const { result } = renderHook(() => useDialogState());
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });

  it('setIsOpen sets value directly', () => {
    const { result } = renderHook(() => useDialogState());
    act(() => result.current.setIsOpen(true));
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.setIsOpen(false));
    expect(result.current.isOpen).toBe(false);
  });
});
