import '@testing-library/jest-dom/vitest';

import { server } from '@/msw/server';
import { vi } from 'vitest';

// Suppress non-actionable React 18 act() warnings from third-party libraries
// (e.g. react-dropzone async FileReader callbacks). Vitest 4's pre-bundled
// module isolation prevents IS_REACT_ACT_ENVIRONMENT from reaching react-dom's
// runtime scope, so we filter these known-benign warnings instead.
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes(
      'The current testing environment is not configured to support act'
    )
  ) {
    return;
  }
  originalConsoleError(...args);
};

const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollIntoView - missing implementation causing "e.scrollIntoView is not a function" error
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();

// ResizeObserver mock that properly handles cleanup to prevent memory leaks
// in parallel test runs. Tracks observed elements for proper cleanup.
class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.observedElements = new WeakSet();
  }

  observe(element) {
    if (element) {
      this.observedElements.add(element);
    }
  }

  unobserve(element) {
    // WeakSet automatically handles cleanup when element is garbage collected
    // No explicit delete needed
  }

  disconnect() {
    // Clear reference to callback to prevent memory leaks
    this.callback = null;
    // WeakSet will automatically clean up when elements are removed
  }
}

window.ResizeObserver = ResizeObserver;

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
