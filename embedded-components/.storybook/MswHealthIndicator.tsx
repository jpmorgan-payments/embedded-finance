import { useSyncExternalStore, type CSSProperties } from 'react';

import { getMswHealth, subscribeToMswHealth } from './mswHealth';

const BASE_STYLE: CSSProperties = {
  position: 'fixed',
  top: '8px',
  left: '8px',
  zIndex: 2147483647,
  padding: '6px 10px',
  fontSize: '11px',
  fontFamily: 'system-ui, sans-serif',
  fontWeight: 500,
  borderRadius: '6px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  pointerEvents: 'auto',
};

const TONES = {
  stale: {
    color: '#b91c1c',
    background: '#fef2f2',
    border: '#fecaca',
    dot: '#dc2626',
  },
  recovered: {
    color: '#1d4ed8',
    background: '#eff6ff',
    border: '#bfdbfe',
    dot: '#2563eb',
  },
};

/**
 * Shows only when MSW needed help: a brief notice after it was re-activated,
 * or a persistent one when requests are reaching the network. Click to reload.
 */
export function MswHealthIndicator() {
  const health = useSyncExternalStore(subscribeToMswHealth, getMswHealth);
  if (health !== 'stale' && health !== 'recovered') return null;

  const tone = TONES[health];
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      style={{
        ...BASE_STYLE,
        color: tone.color,
        backgroundColor: tone.background,
        border: `1px solid ${tone.border}`,
      }}
      title={
        health === 'stale'
          ? 'Requests are reaching the network instead of MSW mocks, and re-activating the worker did not help. Click to reload.'
          : 'The browser restarted the MSW service worker and mocking was re-activated. Requests made in the meantime may have failed; click to reload.'
      }
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: tone.dot,
        }}
      />
      {health === 'stale'
        ? 'MSW stopped mocking - click to reload'
        : 'MSW reconnected - reload if data looks wrong'}
    </button>
  );
}
