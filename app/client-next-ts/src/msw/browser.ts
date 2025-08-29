import { setupWorker } from 'msw/browser';
import { API_URL } from '../data/constants';
// @ts-expect-error - handlers.js is a JavaScript file without type definitions
import { createHandlers } from './handlers.js';

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...createHandlers(API_URL));

