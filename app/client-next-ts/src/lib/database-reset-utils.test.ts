import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DatabaseResetUtils } from './database-reset-utils';

vi.mock('./mock-overrides-storage', () => ({
  getOverrides: vi.fn(() => ({ 'GET /ef/do/v1/example': { ok: true } })),
}));

describe('DatabaseResetUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: async () => ({ status: 'ok' }),
    });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('resetDatabaseForScenario POSTs scenario and overrides then clears loading', async () => {
    const setIsLoading = vi.fn();
    await DatabaseResetUtils.resetDatabaseForScenario(
      'Linked Bank Account',
      setIsLoading
    );

    expect(setIsLoading).toHaveBeenCalledWith(true);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/ef/do/v1/_reset',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          scenario: 'Linked Bank Account',
          overrides: { 'GET /ef/do/v1/example': { ok: true } },
        }),
      })
    );

    await vi.advanceTimersByTimeAsync(500);
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it('resetDatabaseForScenario sets loading false when fetch fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network'));
    const setIsLoading = vi.fn();
    await DatabaseResetUtils.resetDatabaseForScenario(
      'Linked Bank Account',
      setIsLoading
    );
    expect(setIsLoading).toHaveBeenCalledWith(true);
    expect(setIsLoading).toHaveBeenCalledWith(false);
  });

  it('emulateTabSwitch toggles visibility and dispatches events', () => {
    const dispatch = vi.spyOn(window, 'dispatchEvent');
    DatabaseResetUtils.emulateTabSwitch();
    expect(dispatch).toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(dispatch.mock.calls.length).toBeGreaterThan(1);
  });
});
