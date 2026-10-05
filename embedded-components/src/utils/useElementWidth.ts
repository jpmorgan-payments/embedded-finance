import { useCallback, useRef, useState } from 'react';

/**
 * React hook to observe and return the width of a DOM element.
 * @returns [ref, width] - Attach ref to the element you want to measure.
 * @example
 *   const [ref, width] = useElementWidth<HTMLDivElement>();
 *   <div ref={ref}>{width}</div>
 */
export function useElementWidth<T extends HTMLElement>(): [
  React.RefCallback<T>,
  number,
] {
  const observerRef = useRef<ResizeObserver>();
  const [width, setWidth] = useState(0);

  // Callback ref so the observer still attaches when the measured node mounts
  // on a later render, e.g. after a loading state resolves.
  const ref = useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = undefined;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(node);
    observerRef.current = observer;
    setWidth(node.offsetWidth);
  }, []);

  return [ref, width];
}
