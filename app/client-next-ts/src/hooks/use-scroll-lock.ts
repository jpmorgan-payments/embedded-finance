import { useEffect } from 'react';

/**
 * Hook to prevent body scroll while maintaining scroll position
 * Useful for modals, overlays, and loading states
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    // Save current scroll position
    const scrollY = window.scrollY;

    // Lock scroll
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      // Restore scroll position
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
