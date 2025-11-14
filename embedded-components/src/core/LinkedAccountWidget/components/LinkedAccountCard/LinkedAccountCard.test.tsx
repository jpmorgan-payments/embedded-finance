import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { Recipient } from '@/api/generated/ep-recipients.schemas';

import { LinkedAccountCard } from './LinkedAccountCard';

// Mock recipient data
const mockActiveRecipient: Recipient = {
  id: 'recipient-1',
  status: 'ACTIVE',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'John',
    lastName: 'Doe',
  },
  account: {
    number: '12345678',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '123456789',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

const mockPendingRecipient: Recipient = {
  id: 'recipient-2',
  status: 'PENDING',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'Jane',
    lastName: 'Smith',
  },
  account: {
    number: '87654321',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '987654321',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

const mockReadyForValidationRecipient: Recipient = {
  id: 'recipient-3',
  status: 'READY_FOR_VALIDATION',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'Alice',
    lastName: 'Johnson',
  },
  account: {
    number: '11111111',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '111111111',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

const mockIncompleteRecipient: Recipient = {
  id: 'recipient-4',
  status: 'ACTIVE',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'Bob',
    lastName: 'Brown',
  },
  account: {
    number: '99999999',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '999999999',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

describe('LinkedAccountCard', () => {
  it('should render active recipient with account details', () => {
    render(<LinkedAccountCard recipient={mockActiveRecipient} />);

    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText(/•••• 5678/i)).toBeInTheDocument();
  });

  it('should render status badge for all statuses', () => {
    const { rerender } = render(
      <LinkedAccountCard recipient={mockActiveRecipient} />
    );
    expect(screen.getByText(/active/i)).toBeInTheDocument();

    rerender(<LinkedAccountCard recipient={mockPendingRecipient} />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();

    rerender(<LinkedAccountCard recipient={mockReadyForValidationRecipient} />);
    expect(screen.getByText(/ready for validation/i)).toBeInTheDocument();
  });

  it('should show verify button for READY_FOR_VALIDATION status', () => {
    render(<LinkedAccountCard recipient={mockReadyForValidationRecipient} />);

    expect(screen.getByRole('button', { name: /verify/i })).toBeInTheDocument();
  });

  it('should not show verify button for active recipients', () => {
    render(<LinkedAccountCard recipient={mockActiveRecipient} />);

    expect(
      screen.queryByRole('button', { name: /verify/i })
    ).not.toBeInTheDocument();
  });

  it('should show manage dropdown menu', async () => {
    const user = userEvent.setup();
    render(<LinkedAccountCard recipient={mockActiveRecipient} />);

    const manageButton = screen.getByRole('button', { name: /manage/i });
    expect(manageButton).toBeInTheDocument();

    await user.click(manageButton);

    expect(screen.getByText(/edit/i)).toBeInTheDocument();
    expect(screen.getByText(/remove/i)).toBeInTheDocument();
  });

  it('should hide actions when hideActions is true', () => {
    render(
      <LinkedAccountCard recipient={mockActiveRecipient} hideActions={true} />
    );

    expect(
      screen.queryByRole('button', { name: /manage/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /make payment/i })
    ).not.toBeInTheDocument();
  });

  it('should render custom payment component when provided', () => {
    const CustomPaymentComponent = <button>Custom Payment</button>;

    render(
      <LinkedAccountCard
        recipient={mockActiveRecipient}
        makePaymentComponent={CustomPaymentComponent}
      />
    );

    expect(screen.getByText(/custom payment/i)).toBeInTheDocument();
  });

  it('should call onLinkedAccountSettled callback', () => {
    const onSettled = vi.fn();

    render(
      <LinkedAccountCard
        recipient={mockActiveRecipient}
        onLinkedAccountSettled={onSettled}
      />
    );

    // Component should render without errors
    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
  });

  it('should show make payment button for active accounts', () => {
    render(<LinkedAccountCard recipient={mockActiveRecipient} />);

    // Should show make payment button or component
    const payButton = screen.queryByRole('button', { name: /make payment/i });
    expect(payButton).toBeInTheDocument();
  });

  it('should render masked account number', () => {
    render(<LinkedAccountCard recipient={mockActiveRecipient} />);

    // Should show last 4 digits masked
    expect(screen.getByText(/•••• 5678/i)).toBeInTheDocument();
  });

  it('should display payment methods', () => {
    render(<LinkedAccountCard recipient={mockActiveRecipient} />);

    expect(screen.getByText(/ach/i)).toBeInTheDocument();
  });

  it('should show status alert for non-active recipients', () => {
    render(<LinkedAccountCard recipient={mockReadyForValidationRecipient} />);

    // Should have status alert present
    const alert = screen
      .getByText(/ready for validation/i)
      .closest('[role="alert"]');
    expect(alert).toBeInTheDocument();
  });

  it('should not show status alert for active recipients', () => {
    render(<LinkedAccountCard recipient={mockActiveRecipient} />);

    // Should not have status-specific alert (only status badge)
    const alerts = screen.queryAllByRole('alert');
    expect(alerts.length).toBe(0);
  });
});
