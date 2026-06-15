import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { FlowContextProvider } from '../FlowContainer/FlowContext';
import type {
  AccountResponse,
  Payee,
  PaymentMethod,
} from '../PaymentFlow.types';
import { ReviewPanel } from './ReviewPanel';

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'ACH',
    name: 'ACH Transfer',
    description: '1-3 business days',
    estimatedDelivery: '1-3 business days',
    fee: 0,
  },
  {
    id: 'WIRE',
    name: 'Wire Transfer',
    description: 'Same day',
    estimatedDelivery: 'Same day',
    fee: 25,
  },
];

const mockPayees: Payee[] = [
  {
    id: 'payee-1',
    type: 'RECIPIENT',
    name: 'John Doe',
    accountNumber: '123456789',
    routingNumber: '021000021',
    enabledPaymentMethods: ['ACH', 'WIRE'],
    recipientType: 'INDIVIDUAL',
  },
  {
    id: 'payee-2',
    type: 'LINKED_ACCOUNT',
    name: 'Business Corp',
    accountNumber: '987654321',
    routingNumber: '021000089',
    enabledPaymentMethods: ['ACH'],
    recipientType: 'BUSINESS',
  },
];

const mockAccounts = {
  metadata: { page: 0, limit: 25, total_items: 1 },
  items: [
    {
      id: 'acct-001',
      label: 'Operating Account',
      state: 'OPEN',
      category: 'DDA',
      createdAt: '2024-01-01T00:00:00Z',
      paymentRoutingInformation: {
        accountNumber: '112233445',
        routingNumber: '021000021',
      },
      balance: {
        available: 5000,
        currency: 'USD',
        isLoading: false,
        hasError: false,
      },
    },
  ] as unknown as AccountResponse[],
};

function renderReviewPanel(
  props?: Partial<React.ComponentProps<typeof ReviewPanel>>,
  initialData?: Record<string, unknown>
) {
  const defaultProps = {
    accounts: mockAccounts,
    payees: mockPayees,
    paymentMethods: mockPaymentMethods,
    onSubmit: vi.fn(),
    isSubmitting: false,
  };

  return render(
    <FlowContextProvider initialData={initialData as any}>
      <ReviewPanel {...defaultProps} {...props} />
    </FlowContextProvider>
  );
}

describe('ReviewPanel', () => {
  it('renders payment summary header', () => {
    renderReviewPanel();
    expect(screen.getByText('Payment Summary')).toBeInTheDocument();
  });

  it('shows From placeholder when no account selected', () => {
    renderReviewPanel();
    expect(screen.getByText('From')).toBeInTheDocument();
  });

  it('shows selected account info', () => {
    renderReviewPanel({}, { fromAccountId: 'acct-001' });
    expect(screen.getByText(/Operating Account/)).toBeInTheDocument();
  });

  it('shows selected payee info', () => {
    renderReviewPanel({}, { payeeId: 'payee-1', fromAccountId: 'acct-001' });
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });

  it('shows "Select recipient" placeholder when no payee selected', () => {
    renderReviewPanel({}, { fromAccountId: 'acct-001' });
    expect(screen.getByText(/Select recipient/)).toBeInTheDocument();
  });

  it('shows amount when provided', () => {
    renderReviewPanel(
      {},
      {
        fromAccountId: 'acct-001',
        payeeId: 'payee-1',
        paymentMethod: 'ACH',
        amount: '150.00',
      }
    );
    expect(screen.getByText(/150/)).toBeInTheDocument();
  });

  it('shows submit button', () => {
    renderReviewPanel();
    expect(
      screen.getByRole('button', { name: /confirm payment/i })
    ).toBeInTheDocument();
  });

  it('disables submit button when submitting', () => {
    renderReviewPanel({ isSubmitting: true });
    const button = screen.getByRole('button', { name: /processing|confirm/i });
    expect(button).toBeDisabled();
  });

  it('calls onSubmit with form data when form is complete', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderReviewPanel(
      { onSubmit },
      {
        fromAccountId: 'acct-001',
        payeeId: 'payee-1',
        paymentMethod: 'ACH',
        amount: '100.00',
      }
    );

    const submitButton = screen.getByRole('button', {
      name: /confirm payment/i,
    });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalled();
  });

  it('calls onValidationFail when form is incomplete', async () => {
    const user = userEvent.setup();
    const onValidationFail = vi.fn();

    renderReviewPanel({ onValidationFail }, {});

    const submitButton = screen.getByRole('button', {
      name: /confirm payment/i,
    });
    await user.click(submitButton);

    expect(onValidationFail).toHaveBeenCalled();
  });

  it('shows validation message for missing fields', async () => {
    const user = userEvent.setup();

    renderReviewPanel({}, {});

    const submitButton = screen.getByRole('button', {
      name: /confirm payment/i,
    });
    await user.click(submitButton);

    // After clicking submit without filling, validation message should appear
    expect(screen.getByText(/Please select/)).toBeInTheDocument();
  });

  it('shows fee when showFees is true and method has fee', () => {
    renderReviewPanel(
      { showFees: true },
      {
        fromAccountId: 'acct-001',
        payeeId: 'payee-1',
        paymentMethod: 'WIRE',
        amount: '100.00',
      }
    );

    // Wire has $25 fee - formatCurrency renders as $25.00
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });

  it('shows loading indicator when isLoading', () => {
    renderReviewPanel({ isLoading: true }, { fromAccountId: 'acct-001' });
    // Should show skeleton for the account that is loading
    expect(document.querySelector('.eb-animate-pulse')).toBeTruthy();
  });

  it('shows transaction error when provided', () => {
    const mockError = {
      title: 'Payment Failed',
      message: 'An unexpected error occurred.',
    };

    renderReviewPanel(
      { transactionError: mockError as any },
      {
        fromAccountId: 'acct-001',
        payeeId: 'payee-1',
        paymentMethod: 'ACH',
        amount: '100.00',
      }
    );

    // Should show the error title and message
    expect(screen.getByText('Payment Failed')).toBeInTheDocument();
    expect(
      screen.getByText('An unexpected error occurred.')
    ).toBeInTheDocument();
  });

  it('shows balance info for selected account', () => {
    renderReviewPanel({}, { fromAccountId: 'acct-001', amount: '100.00' });
    // Balance should show as $5,000.00 available and remaining balance
    expect(screen.getByText(/\$5,000\.00/)).toBeInTheDocument();
  });

  it('shows negative remaining balance when amount exceeds balance', () => {
    renderReviewPanel(
      {},
      {
        fromAccountId: 'acct-001',
        payeeId: 'payee-1',
        paymentMethod: 'ACH',
        amount: '10000.00',
      }
    );

    // Remaining balance should be negative ($5000 - $10000 = -$5000)
    expect(screen.getByText(/-\$5,000\.00/)).toBeInTheDocument();
  });

  it('shows unsaved recipient display', () => {
    renderReviewPanel(
      {},
      {
        fromAccountId: 'acct-001',
        unsavedRecipient: {
          displayName: 'Quick Pay User',
          accountNumber: '5555666677',
          routingNumber: '021000089',
          enabledPaymentMethods: ['ACH'],
          transactionRecipient: {},
        },
        paymentMethod: 'ACH',
        amount: '50.00',
      }
    );

    expect(screen.getByText(/Quick Pay User/)).toBeInTheDocument();
  });
});
