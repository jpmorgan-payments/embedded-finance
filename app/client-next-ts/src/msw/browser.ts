import { setupWorker } from 'msw/browser';
import { API_URL } from '../data/constants';

// eslint-disable-next-line @typescript-eslint/no-var-requires
// @ts-expect-error - handlers.js is a JavaScript file without type definitions
const { createHandlers } = require('./handlers');

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...createHandlers(API_URL));
