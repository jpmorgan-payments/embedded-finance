import '@testing-library/jest-dom/vitest';

import { server } from '@/msw/server';
import { vi } from 'vitest';

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

window.dtrum = {
  enterAction: vi.fn(),
  leaveAction: vi.fn(),
};

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
