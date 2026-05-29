import { describe, expect, it } from 'vitest';

import {
  calculateContrast,
  clearContrastCache,
  getCachedContrast,
} from './color-contrast';

describe('color-contrast', () => {
  it('calculateContrast returns AAA for black on white', () => {
    const r = calculateContrast('#000000', '#ffffff');
    expect(r?.level).toBe('AAA');
    expect(r?.passes.AA.normal).toBe(true);
  });

  it('parses hex 3-digit and 6-digit', () => {
    expect(calculateContrast('#fff', '#000')?.ratio).toBeGreaterThan(10);
    expect(calculateContrast('#ffffff', '#000000')?.level).toBe('AAA');
  });

  it('parses rgb and hsl', () => {
    expect(calculateContrast('rgb(0,0,0)', 'rgb(255,255,255)')?.level).toBe(
      'AAA'
    );
    expect(
      calculateContrast('hsl(0, 0%, 0%)', 'hsl(0, 0%, 100%)')?.ratio
    ).toBeGreaterThan(10);
  });

  it('parses named colors', () => {
    expect(calculateContrast('black', 'white')?.level).toBe('AAA');
  });

  it('getCachedContrast dedupes and clearContrastCache resets', () => {
    clearContrastCache();
    const a = getCachedContrast('#111', '#eee');
    const b = getCachedContrast('#111', '#eee');
    expect(a?.ratio).toBe(b?.ratio);
    clearContrastCache();
  });
});
