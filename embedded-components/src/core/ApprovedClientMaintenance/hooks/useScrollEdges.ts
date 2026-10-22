import { useEffect, useState } from 'react';

/** Whether a scroll container has content hidden above or below its viewport. */
export function useScrollEdges<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [edges, setEdges] = useState({ above: false, below: false });

  useEffect(() => {
    if (!element) return undefined;
    const update = () => {
      const above = element.scrollTop > 1;
      const below =
        element.scrollTop + element.clientHeight < element.scrollHeight - 1;
      setEdges((previous) =>
        previous.above === above && previous.below === below
          ? previous
          : { above, below }
      );
    };
    const resizeObserver =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(update);
    // Content swaps on navigation without the container resizing, so watch its children too.
    const observeContent = () => {
      resizeObserver?.disconnect();
      resizeObserver?.observe(element);
      Array.from(element.children).forEach((child) =>
        resizeObserver?.observe(child)
      );
      update();
    };
    const mutationObserver = new MutationObserver(observeContent);
    mutationObserver.observe(element, { childList: true });
    element.addEventListener('scroll', update, { passive: true });
    observeContent();
    return () => {
      element.removeEventListener('scroll', update);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, [element]);

  return [setElement, edges] as const;
}
