// =============================================================================
// BusyBar — visible "something is happening" feedback for async waits
// The mock API takes 0.8–2s, which reads as a frozen screen without this.
// =============================================================================

import { useEffect, useState } from 'react';

const FRAMES = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'];
const TICK_MS = 100;

interface BusyBarProps {
  label: string;
  /** Renders as a single terminal line instead of a panel. */
  inline?: boolean;
}

export function BusyBar({ label, inline = false }: BusyBarProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const spinner = FRAMES[tick % FRAMES.length];
  const elapsed = ((tick * TICK_MS) / 1000).toFixed(1);

  if (inline) {
    return (
      <div className="busy-inline">
        <span className="busy-spinner">{spinner}</span>
        <span>{label}</span>
        <span className="busy-elapsed">{elapsed}s</span>
      </div>
    );
  }

  return (
    <div className="busy-bar" role="status" aria-live="polite">
      <div className="busy-row">
        <span className="busy-spinner">{spinner}</span>
        <span className="busy-label">{label}</span>
        <span className="busy-elapsed">{elapsed}s</span>
      </div>
      <div className="busy-track">
        <div className="busy-fill" />
      </div>
    </div>
  );
}
