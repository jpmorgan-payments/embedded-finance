import { setupWorker } from 'msw/browser';
import { API_URL } from '../data/constants';
// @ts-expect-error - handlers.js is a JavaScript file without type definitions
import { createHandlers } from './handlers.js';

// Log MSW setup for debugging
console.log('🔧 MSW Browser setup - API_URL:', API_URL);
console.log(
  '🔧 MSW Browser setup - Current origin:',
  typeof window !== 'undefined' ? window.location.origin : 'server',
);

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...createHandlers(API_URL));

// Simple logging when worker is ready
console.log('✅ MSW Worker configured and ready to start');
