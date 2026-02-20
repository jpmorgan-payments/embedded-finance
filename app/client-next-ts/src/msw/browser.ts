import { setupWorker } from 'msw/browser';

import { API_URL } from '../data/constants';
import { createHandlers } from './handlers.ts';

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...createHandlers(API_URL));
