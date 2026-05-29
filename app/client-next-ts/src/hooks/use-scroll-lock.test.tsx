import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useScrollLock } from './use-scroll-lock';

describe('useScrollLock', () => {
  beforeEach(() => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    document.body.style.overflow = '';
    vi.restoreAllMocks();
  });

  it('locks body scroll when isLocked is true and restores on unmount', () => {
    window.scrollTo(0, 120);
    const { unmount } = renderHook(
      ({ locked }: { locked: boolean }) => useScrollLock(locked),
      { initialProps: { locked: true } }
    );
    expect(document.body.style.position).toBe('fixed');
    unmount();
    expect(document.body.style.position).toBe('');
  });

  it('does not lock when isLocked is false', () => {
    renderHook(() => useScrollLock(false));
    expect(document.body.style.position).not.toBe('fixed');
  });
});
