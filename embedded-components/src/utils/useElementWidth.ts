import { useEffect, useRef, useState } from 'react';

/**
 * React hook to observe and return the width of a DOM element.
 * @returns [ref, width] - Attach ref to the element you want to measure.
 * @example
 *   const [ref, width] = useElementWidth<HTMLDivElement>();
 *   <div ref={ref}>{width}</div>
 */
export function useElementWidth<T extends HTMLElement>(): [
  React.RefObject<T>,
  number,
] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    };
    const observer = new ResizeObserver(handleResize);
    observer.observe(ref.current);
    // Set initial width
    setWidth(ref.current.offsetWidth);
    // eslint-disable-next-line consistent-return
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
