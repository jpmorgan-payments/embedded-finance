import { useEffect, useRef } from 'react';

/**
 * Makes an element and everything in it unclickable, unfocusable, and hidden
 * from assistive technology while `isInert` holds.
 */
export function useInert<T extends HTMLElement>(isInert: boolean) {
  const ref = useRef<T>(null);
  // No dependency list: the element may mount after the flag is already set.
  useEffect(() => {
    ref.current?.toggleAttribute('inert', isInert);
  });
  return ref;
}
