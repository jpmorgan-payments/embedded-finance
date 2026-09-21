import { useEffect, useRef } from 'react';

import { mountProsperityBay } from './app';

import './prosperity-bay.css';

export type ProsperityBayOptions = {
  chapter?: number;
  t?: number;
  pause?: boolean;
};

export function ProsperityBayApp({ chapter, t, pause }: ProsperityBayOptions) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const previousTitle = document.title;
    document.title = 'Prosperity Bay — Grow a thriving marketplace';
    document.documentElement.classList.add('prosperity-bay-active');

    const destroy = mountProsperityBay(root, { chapter, t, pause });

    return () => {
      destroy();
      document.documentElement.classList.remove('prosperity-bay-active');
      document.title = previousTitle;
    };
  }, [chapter, t, pause]);

  return (
    <div
      ref={rootRef}
      className="prosperity-bay-root sg-root"
      data-theme="sunny-bay"
    />
  );
}
