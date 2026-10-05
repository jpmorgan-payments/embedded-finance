import { useState } from 'react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@test-utils';

import { useElementWidth } from './useElementWidth';

function WidthProbe() {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="probe">
      <span data-testid="width">{width}</span>
    </div>
  );
}

function DeferredWidthProbe() {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [isReady, setIsReady] = useState(false);
  if (!isReady) {
    return (
      <button type="button" onClick={() => setIsReady(true)}>
        Load
      </button>
    );
  }
  return (
    <div ref={ref} data-testid="probe">
      <span data-testid="width">{width}</span>
    </div>
  );
}

describe('useElementWidth', () => {
  afterEach(() => {
    const desc = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      'offsetWidth'
    );
    if (desc?.configurable) {
      delete (HTMLElement.prototype as { offsetWidth?: number }).offsetWidth;
    }
  });

  it('sets width from offsetWidth after mount', async () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return 128;
      },
    });

    render(<WidthProbe />);

    await waitFor(() => {
      expect(screen.getByTestId('width')).toHaveTextContent('128');
    });
  });

  it('measures a node that mounts after the first render', async () => {
    const user = userEvent.setup();
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get() {
        return 1024;
      },
    });

    render(<DeferredWidthProbe />);
    await user.click(screen.getByRole('button', { name: 'Load' }));

    await waitFor(() => {
      expect(screen.getByTestId('width')).toHaveTextContent('1024');
    });
  });
});
