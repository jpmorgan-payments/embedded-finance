import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearOverrides,
  getOverride,
  getOverrideKeys,
  getOverrides,
  reinitWithOverrides,
  removeOverride,
  replaceOverrides,
  setOverride,
} from './mock-overrides-storage';

const STORAGE_KEY = 'sellsense-mock-overrides';

describe('mock-overrides-storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('getOverrides returns empty object when storage is empty', () => {
    expect(getOverrides()).toEqual({});
  });

  it('setOverride persists and getOverride reads back', () => {
    setOverride('GET /ef/do/v1/accounts', { items: [{ id: 'a1' }] });
    expect(getOverride('GET /ef/do/v1/accounts')).toEqual({
      items: [{ id: 'a1' }],
    });
    expect(getOverrideKeys()).toContain('GET /ef/do/v1/accounts');
  });

  it('removeOverride deletes a key', () => {
    setOverride('k1', { x: 1 });
    setOverride('k2', { y: 2 });
    removeOverride('k1');
    expect(getOverride('k1')).toBeUndefined();
    expect(getOverride('k2')).toEqual({ y: 2 });
  });

  it('clearOverrides removes storage', () => {
    setOverride('k', 1);
    clearOverrides();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(getOverrides()).toEqual({});
  });

  it('purges deprecated payment-recipients key on read', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        'GET /ef/do/v1/payment-recipients': [],
        'GET /ef/do/v1/accounts': { items: [{ id: 'x' }] },
      })
    );
    const map = getOverrides();
    expect(map['GET /ef/do/v1/payment-recipients']).toBeUndefined();
    expect(map['GET /ef/do/v1/accounts']).toBeDefined();
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(stored['GET /ef/do/v1/payment-recipients']).toBeUndefined();
  });

  it('replaceOverrides replaces entire map and strips deprecated keys', () => {
    setOverride('GET /ef/do/v1/payment-recipients', { bad: true });
    replaceOverrides({
      'GET /ef/do/v1/foo': { ok: true },
      'GET /ef/do/v1/payment-recipients': { stale: true },
    });
    const map = getOverrides();
    expect(map['GET /ef/do/v1/foo']).toEqual({ ok: true });
    expect(map['GET /ef/do/v1/payment-recipients']).toBeUndefined();
  });

  it('replaceOverrides clears storage for non-object input', () => {
    setOverride('k', 1);
    replaceOverrides(null as unknown as Record<string, unknown>);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('reinitWithOverrides POSTs overrides and optional scenario', async () => {
    setOverride('GET /x', { a: 1 });
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
    await reinitWithOverrides('empty');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/ef/do/v1/_reset',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"scenario":"empty"'),
      })
    );
  });

  it('reinitWithOverrides warns when response not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await reinitWithOverrides();
    expect(console.warn).toHaveBeenCalled();
  });

  it('reinitWithOverrides warns on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('fail'));
    await reinitWithOverrides();
    expect(console.warn).toHaveBeenCalled();
  });
});
