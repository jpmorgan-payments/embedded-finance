/**
 * localStorage persistence for SellSense mock API overrides.
 * Key: sellsense-mock-overrides
 * Value: JSON object mapping override key (e.g. "GET /ef/do/v1/accounts") to response JSON.
 */

const STORAGE_KEY = 'sellsense-mock-overrides';

/**
 * Override keys that were previously supported but have since been removed from the
 * editor config. Any entry under these keys is silently purged on first read so stale
 * localStorage data can never corrupt the MSW DB (e.g. wiping all recipients).
 */
const DEPRECATED_OVERRIDE_KEYS: readonly string[] = [
  'GET /ef/do/v1/payment-recipients',
];

export type MockOverridesMap = Record<string, unknown>;

function safeParse(s: string): MockOverridesMap {
  try {
    const parsed = JSON.parse(s) as unknown;
    return typeof parsed === 'object' &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as MockOverridesMap)
      : {};
  } catch {
    return {};
  }
}

export function getOverrides(): MockOverridesMap {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const map = raw ? safeParse(raw) : {};

  // Purge any deprecated keys so stale entries can never corrupt the DB.
  const staleKeys = DEPRECATED_OVERRIDE_KEYS.filter((k) => k in map);
  if (staleKeys.length > 0) {
    staleKeys.forEach((k) => delete map[k]);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  return map;
}

export function setOverride(overrideKey: string, value: unknown): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const map = getOverrides();
  map[overrideKey] = value;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function removeOverride(overrideKey: string): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  const map = getOverrides();
  delete map[overrideKey];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function clearOverrides(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getOverrideKeys(): string[] {
  return Object.keys(getOverrides());
}

/**
 * Get a single override by key.
 */
export function getOverride(overrideKey: string): unknown | undefined {
  return getOverrides()[overrideKey];
}

/**
 * Re-initialize the MSW DB for the given scenario and apply all current localStorage
 * overrides atomically — a single POST to _reset so there is no race condition between
 * "sync overrides" and "seed DB" calls.
 *
 * @param dbScenario  The MSW DB scenario key (e.g. "active", "empty").  When omitted
 *                    the handler falls back to DEFAULT_SCENARIO.
 */
export async function reinitWithOverrides(dbScenario?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const body: Record<string, unknown> = { overrides: getOverrides() };
    if (dbScenario) body.scenario = dbScenario;
    const res = await fetch('/ef/do/v1/_reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn('[Mock API Editor] reinitWithOverrides failed:', res.status);
    }
  } catch (e) {
    console.warn('[Mock API Editor] reinitWithOverrides failed:', e);
  }
}
