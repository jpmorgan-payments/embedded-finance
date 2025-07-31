import { vi } from 'vitest';
import { render, screen } from '@test-utils';

import { LinkedAccountWidget } from './LinkedAccountWidget';

describe('LinkedAccountWidget component', () => {
  it('renders without error', () => {
    render(<LinkedAccountWidget />);
  });

  it('accepts onLinkedAccountSettled callback prop', () => {
    const mockCallback = vi.fn();

    render(<LinkedAccountWidget onLinkedAccountSettled={mockCallback} />);

    // Verify the component renders with the callback prop
    expect(screen.getByText('Linked Accounts')).toBeInTheDocument();
  });

  it('renders with all optional props', () => {
    const mockCallback = vi.fn();
    const mockMakePaymentComponent = (
      <div data-testid="make-payment">Make Payment</div>
    );

    render(
      <LinkedAccountWidget
        variant="singleAccount"
        showCreateButton={false}
        makePaymentComponent={mockMakePaymentComponent}
        onLinkedAccountSettled={mockCallback}
      />
    );

    // Verify the component renders with all props
    expect(screen.getByText('Linked Accounts')).toBeInTheDocument();
  });
});
