import { setupWorker } from 'msw/browser';

import { API_URL } from '../data/constants';
import { createHandlers } from './handlers.ts';
import { mswHealthHandler, startMswHealthMonitor } from './health';

export async function startShowcaseMocks(): Promise<void> {
  const worker = setupWorker(mswHealthHandler, ...createHandlers(API_URL));
  await worker.start({ onUnhandledRequest: 'bypass' });
  startMswHealthMonitor();
}
