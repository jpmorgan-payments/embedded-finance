import { HttpHandler, HttpResponse } from 'msw';

const HEALTH_PATH = '/__eb_msw_health__';
const HEALTH_HEADER = 'x-eb-msw-health';

/** Answers the probe without logging, so polling stays out of the console. */
class SilentHttpHandler extends HttpHandler {
  async log() {}
}

/**
 * Only MSW answers this route. Any other response means requests are reaching
 * the network, so pass it as an initial handler to survive per-story resets.
 */
export const mswHealthHandler = new SilentHttpHandler('GET', HEALTH_PATH, () =>
  HttpResponse.json({ ok: true }, { headers: { [HEALTH_HEADER]: 'alive' } })
);

export type MswHealth = 'checking' | 'active' | 'recovered' | 'stale';

export async function probeMsw(fetchImpl: typeof fetch = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetchImpl(`${HEALTH_PATH}?t=${Date.now()}`, {
      cache: 'no-store',
      signal: controller.signal,
    });
    return response.headers.get(HEALTH_HEADER) === 'alive';
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Browsers stop idle service workers, and MSW's worker keeps the pages it mocks
 * for in memory, so after a restart it passes every request to the network.
 * Announcing this page again restores mocking without a reload.
 */
export function reactivateMsw(
  container: ServiceWorkerContainer = navigator.serviceWorker,
  timeoutMs = 3000
): Promise<boolean> {
  const worker = container.controller;
  // An uncontrolled page (e.g. after a hard reload) can't be mocked until it reloads.
  if (!worker) return Promise.resolve(false);
  return new Promise((resolve) => {
    const finish = (enabled: boolean) => {
      clearTimeout(timeout);
      container.removeEventListener('message', onMessage);
      resolve(enabled);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.source === worker && event.data?.type === 'MOCKING_ENABLED') {
        finish(true);
      }
    };
    const timeout = setTimeout(() => finish(false), timeoutMs);
    container.addEventListener('message', onMessage);
    worker.postMessage('MOCK_ACTIVATE');
  });
}

export async function checkMswHealth({
  probe = () => probeMsw(),
  reactivate = () => reactivateMsw(),
}: {
  probe?: () => Promise<boolean>;
  reactivate?: () => Promise<boolean>;
} = {}): Promise<Exclude<MswHealth, 'checking'>> {
  if (await probe()) return 'active';
  if ((await reactivate()) && (await probe())) return 'recovered';
  return 'stale';
}

const CHECK_INTERVAL_MS = 15_000;
const RECOVERED_NOTICE_MS = 8_000;

let health: MswHealth = 'checking';
const listeners = new Set<() => void>();
const setHealth = (next: MswHealth) => {
  health = next;
  listeners.forEach((listener) => listener());
};

export const getMswHealth = () => health;

export const subscribeToMswHealth = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Checks MSW while the preview is visible: on an interval, and whenever the tab
 * comes back, since a hidden tab's keep-alive pings are throttled long enough
 * for the browser to stop the worker. Call once per preview.
 */
export function startMswHealthMonitor(ready: Promise<unknown>) {
  let isRunning = false;
  let recoveredTimeout: ReturnType<typeof setTimeout> | undefined;

  const run = async () => {
    if (isRunning || document.visibilityState !== 'visible') return;
    isRunning = true;
    try {
      await ready;
      const result = await checkMswHealth();
      // A recovery notice stays up for a moment instead of flipping straight back.
      if (result === 'active' && health === 'recovered') return;
      setHealth(result);
      if (result === 'recovered') {
        clearTimeout(recoveredTimeout);
        recoveredTimeout = setTimeout(
          () => setHealth('active'),
          RECOVERED_NOTICE_MS
        );
      }
    } finally {
      isRunning = false;
    }
  };

  setInterval(() => void run(), CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => void run());
  window.addEventListener('focus', () => void run());
  navigator.serviceWorker.addEventListener(
    'controllerchange',
    () => void run()
  );
  void run();
}
