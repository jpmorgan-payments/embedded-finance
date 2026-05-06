import { setupWorker } from 'msw/browser';

import { API_URL } from '../data/constants';
import { createHandlers } from './handlers.ts';

export async function startShowcaseMocks(): Promise<void> {
  const worker = setupWorker(...createHandlers(API_URL));
  await worker.start({ onUnhandledRequest: 'bypass' });
}
