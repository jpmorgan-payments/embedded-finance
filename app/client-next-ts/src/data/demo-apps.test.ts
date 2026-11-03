import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { DEMO_APPS } from './demo-apps';

describe('DEMO_APPS', () => {
  it('lists SellSense, Prosperity Bay, and Fintech Fortress', () => {
    expect(DEMO_APPS.map((demo) => demo.id)).toEqual([
      'sellsense',
      'prosperity-bay',
      'fintech-fortress',
    ]);
  });

  it('has a thumbnail in public/ for every demo', () => {
    for (const demo of DEMO_APPS) {
      expect(existsSync(join(process.cwd(), 'public', demo.image))).toBe(true);
    }
  });
});
