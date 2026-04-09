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
});
