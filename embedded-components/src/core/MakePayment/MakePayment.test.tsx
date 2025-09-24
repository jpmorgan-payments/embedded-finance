import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { userEvent } from '@test-utils';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { MakePayment } from './MakePayment';

// Setup QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock data
const mockAccounts = {
  items: [
    {
      id: 'account-1',
      label: 'Checking Account',
      category: 'DDA',
    },
    {
      id: 'account-2',
      label: 'Savings Account',
      category: 'SAV',
    },
  ],
};

const mockRecipients = {
  recipients: [
    {
      id: 'recipient-1',
      type: 'RECIPIENT',
      status: 'ACTIVE',
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName: 'John',
        lastName: 'Doe',
      },
      account: {
        number: '1234567890',
        routingNumber: '123456789',
        type: 'Checking',
        routingInformation: [
          { transactionType: 'ACH' },
          { transactionType: 'RTP' },
        ],
      },
      bank: {
        name: 'Test Bank',
      },
    },
  ],
};

const mockAccountBalance = {
  balanceTypes: [
    {
      typeCode: 'ITAV',
      amount: 1000.0,
    },
  ],
  currency: 'USD',
};

// Component rendering helper
const renderComponent = () => {
  // Reset MSW handlers before each render
  server.resetHandlers();

  // Setup explicit API mock handlers
  server.use(
    http.get('/api/accounts', () => {
      return HttpResponse.json(mockAccounts);
    }),
    http.get('/api/recipients', () => {
      return HttpResponse.json(mockRecipients);
    }),
    http.get('/api/accounts/:id/balance', () => {
      return HttpResponse.json(mockAccountBalance);
    }),
    http.post('/api/transactions', () => {
      return HttpResponse.json({ success: true });
    })
  );

  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{
        name: 'enUS',
      }}
    >
      <QueryClientProvider client={queryClient}>
        <MakePayment />
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};

describe('MakePayment (Refactored)', () => {
  test('renders correctly with refactored components', async () => {
    renderComponent();

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText(/make payment/i)).toBeInTheDocument();
    });

    // Click the make payment button to open the dialog
    await userEvent.click(screen.getByText(/make payment/i));

    // Wait for the dialog to open and check for form elements
    await waitFor(() => {
      expect(screen.getByText(/from account/i)).toBeInTheDocument();
      expect(screen.getByText(/recipient/i)).toBeInTheDocument();
      expect(screen.getByText(/amount/i)).toBeInTheDocument();
      expect(screen.getByText(/payment method/i)).toBeInTheDocument();
    });
  });

  test('form validation works with refactored components', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText(/make payment/i));

    await waitFor(() => {
      expect(screen.getByText(/from account/i)).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', {
      name: /confirm payment/i,
    });
    expect(submitButton).toBeDisabled();
  });

  test('account selection works with refactored AccountSelector', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText(/make payment/i));

    await waitFor(() => {
      expect(screen.getByText(/from account/i)).toBeInTheDocument();
    });

    // Click on account selector
    const accountSelector = screen.getByRole('combobox', {
      name: /from account/i,
    });
    await userEvent.click(accountSelector);

    // Check if accounts are loaded
    await waitFor(() => {
      expect(screen.getByText('Checking Account (DDA)')).toBeInTheDocument();
      expect(screen.getByText('Savings Account (SAV)')).toBeInTheDocument();
    });
  });

  test('recipient selection works with refactored RecipientSelector', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText(/make payment/i));

    await waitFor(() => {
      expect(screen.getByText(/from account/i)).toBeInTheDocument();
    });

    // Select an account first
    const accountSelector = screen.getByRole('combobox', {
      name: /from account/i,
    });
    await userEvent.click(accountSelector);

    await waitFor(() => {
      expect(screen.getByText('Checking Account (DDA)')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText('Checking Account (DDA)'));

    // Now check if recipient selector is enabled
    await waitFor(() => {
      const recipientSelector = screen.getByRole('combobox', {
        name: /recipient/i,
      });
      expect(recipientSelector).not.toBeDisabled();
    });
  });

  test('amount input works with refactored AmountInput', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText(/make payment/i));

    await waitFor(() => {
      expect(screen.getByText(/amount/i)).toBeInTheDocument();
    });

    // Find and interact with amount input
    const amountInput = screen.getByPlaceholderText(/enter amount/i);
    await userEvent.type(amountInput, '100.50');

    expect(amountInput).toHaveValue('100.50');
  });

  test('payment method selection works with refactored PaymentMethodSelector', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText(/make payment/i));

    await waitFor(() => {
      expect(screen.getByText(/payment method/i)).toBeInTheDocument();
    });

    // Check if payment method options are rendered
    await waitFor(() => {
      expect(screen.getByText(/ACH/i)).toBeInTheDocument();
      expect(screen.getByText(/RTP/i)).toBeInTheDocument();
      expect(screen.getByText(/WIRE/i)).toBeInTheDocument();
    });
  });

  test('review panel shows correct information', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText(/make payment/i));

    await waitFor(() => {
      expect(screen.getByText(/review payment/i)).toBeInTheDocument();
    });

    // Check if review panel is rendered
    expect(screen.getByText(/review payment/i)).toBeInTheDocument();
  });
});
