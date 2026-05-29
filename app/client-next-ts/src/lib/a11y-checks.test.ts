import { describe, expect, it } from 'vitest';

import { runA11yChecks } from './a11y-checks';

describe('runA11yChecks', () => {
  it('returns summary with checks for theme variables', () => {
    const summary = runA11yChecks({
      actionableFontSize: '1rem',
      editableLabelFontSize: '0.875rem',
      focusedRingColor: '#0060f0',
      spacingUnit: '0.5rem',
      actionableBorderRadius: '0.25rem',
    });
    expect(summary.total).toBeGreaterThan(0);
    expect(summary.passing + summary.warnings + summary.failing).toBe(
      summary.total
    );
    expect(summary.checks.some((c) => c.id === 'font-size-actionable')).toBe(
      true
    );
  });

  it('flags small actionable font as fail', () => {
    const summary = runA11yChecks({ actionableFontSize: '0.5rem' });
    const font = summary.checks.find((c) => c.id === 'font-size-actionable');
    expect(font?.status).toBe('fail');
  });

  it('flags missing focus ring', () => {
    const summary = runA11yChecks({});
    expect(summary.checks.some((c) => c.id === 'focus-ring-missing')).toBe(
      true
    );
  });

  it('warns on tight spacing unit', () => {
    const summary = runA11yChecks({
      focusedRingColor: '#000',
      spacingUnit: '0.25rem',
    });
    const touch = summary.checks.find((c) => c.id === 'touch-target-spacing');
    expect(touch?.status).toBe('warning');
  });

  it('warns on very large border radius', () => {
    const summary = runA11yChecks({
      focusedRingColor: '#000',
      actionableBorderRadius: '999px',
    });
    const br = summary.checks.find((c) => c.id === 'border-radius-large');
    expect(br?.status).toBe('warning');
  });
});
