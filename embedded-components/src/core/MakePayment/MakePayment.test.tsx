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
      createdAt: '2024-01-01T00:00:00Z',
      state: 'ACTIVE',
    },
    {
      id: 'account-2',
      label: 'Savings Account',
      category: 'SAV',
      createdAt: '2024-01-01T00:00:00Z',
      state: 'ACTIVE',
    },
  ],
  metadata: {
    page: 0,
    limit: 25,
    total_items: 2,
  },
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
        type: 'CHECKING',
        countryCode: 'US',
        routingInformation: [
          {
            transactionType: 'ACH',
            routingCodeType: 'USABA',
            routingNumber: '123456789',
          },
          {
            transactionType: 'RTP',
            routingCodeType: 'USABA',
            routingNumber: '123456789',
          },
        ],
      },
    },
  ],
  metadata: {
    page: 0,
    limit: 25,
    total_items: 1,
  },
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
    http.get('/accounts', () => {
      return HttpResponse.json(mockAccounts);
    }),
    http.get('/recipients', () => {
      return HttpResponse.json(mockRecipients);
    }),
    http.get('/accounts/:id/balances', () => {
      return HttpResponse.json(mockAccountBalance);
    }),
    http.post('/transactions', () => {
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
      expect(screen.getByText('Make a payment')).toBeInTheDocument();
    });

    // Click the make payment button to open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    // Wait for the dialog to open and check for form elements
    await waitFor(() => {
      expect(screen.getByText('1. Who are you paying?')).toBeInTheDocument();
      expect(
        screen.getByText('2. Which account are you paying from?')
      ).toBeInTheDocument();
      expect(
        screen.getByText('3. How much are you paying?')
      ).toBeInTheDocument();
      expect(
        screen.getByText('4. How do you want to pay?')
      ).toBeInTheDocument();
    });
  });

  test('form validation works with refactored components', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(
        screen.getByText('2. Which account are you paying from?')
      ).toBeInTheDocument();
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
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(
        screen.getByText('2. Which account are you paying from?')
      ).toBeInTheDocument();
    });

    // Click on account selector
    const accountSelector = screen.getByRole('combobox', {
      name: /which account are you paying from/i,
    });
    await userEvent.click(accountSelector);

    // Check if accounts are loaded
    await waitFor(() => {
      expect(screen.getAllByText('Checking Account (DDA)')).toHaveLength(2); // Option and span
      expect(screen.getAllByText('Savings Account (SAV)')).toHaveLength(2); // Option and span
    });
  });

  test('recipient selection works with refactored RecipientSelector', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(
        screen.getByText('2. Which account are you paying from?')
      ).toBeInTheDocument();
    });

    // Select an account first
    const accountSelector = screen.getByRole('combobox', {
      name: /which account are you paying from/i,
    });
    await userEvent.click(accountSelector);

    await waitFor(() => {
      expect(screen.getAllByText('Checking Account (DDA)')).toHaveLength(2); // Option and span
    });

    // Select the account by clicking on the option element directly
    const accountOption = screen.getByRole('option', {
      name: 'Checking Account (DDA)',
    });
    await userEvent.click(accountOption);

    // Now check if recipient selector is enabled
    await waitFor(() => {
      const recipientSelector = screen.getByRole('combobox', {
        name: /who are you paying/i,
      });
      expect(recipientSelector).not.toBeDisabled();
    });
  });

  test('amount input works with refactored AmountInput', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(
        screen.getByText('3. How much are you paying?')
      ).toBeInTheDocument();
    });

    // Find and interact with amount input
    const amountInput = screen.getByPlaceholderText('0.00');
    await userEvent.type(amountInput, '100.50');

    expect(amountInput).toHaveValue('100.50');
  });

  test('payment method selection works with refactored PaymentMethodSelector', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(
        screen.getByText('4. How do you want to pay?')
      ).toBeInTheDocument();
    });

    // Check if payment method options are rendered
    // Note: Only ACH and RTP are available based on the recipient's routing information
    await waitFor(() => {
      expect(screen.getByText(/ACH/i)).toBeInTheDocument();
      expect(screen.getByText(/RTP/i)).toBeInTheDocument();
      // WIRE is not available because the recipient doesn't support it
    });
  });

  test('review panel shows correct information', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(screen.getByText('Review payment')).toBeInTheDocument();
    });

    // Check if review panel is rendered
    expect(screen.getByText('Review payment')).toBeInTheDocument();
  });

  test('payment success screen displays correctly after successful payment', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(screen.getByText('1. Who are you paying?')).toBeInTheDocument();
    });

    // Fill out the form
    // Select recipient
    const recipientSelect = screen.getByRole('combobox', {
      name: /select or type recipient/i,
    });
    await userEvent.click(recipientSelect);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('John Doe'));

    // Select account
    const accountSelect = screen.getByRole('combobox', { name: /pay from/i });
    await userEvent.click(accountSelect);
    await waitFor(() => {
      expect(screen.getByText('Checking Account')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Checking Account'));

    // Enter amount
    const amountInput = screen.getByPlaceholderText('0.00');
    await userEvent.type(amountInput, '100.00');

    // Select payment method
    await waitFor(() => {
      expect(screen.getByText(/ACH/i)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText(/ACH/i));

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: /confirm payment/i,
    });
    await userEvent.click(submitButton);

    // Wait for success screen
    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    });

    // Check that payment details are displayed
    expect(screen.getByText('$100.00 USD')).toBeInTheDocument();
    expect(screen.getByText(/ACH to John Doe/)).toBeInTheDocument();
    expect(screen.getByText('Payment Details')).toBeInTheDocument();
    expect(screen.getByText('Make Another Payment')).toBeInTheDocument();
  });

  test('make another payment button works correctly', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(screen.getByText('1. Who are you paying?')).toBeInTheDocument();
    });

    // Fill out and submit form (simplified version)
    const recipientSelect = screen.getByRole('combobox', {
      name: /select or type recipient/i,
    });
    await userEvent.click(recipientSelect);
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('John Doe'));

    const accountSelect = screen.getByRole('combobox', { name: /pay from/i });
    await userEvent.click(accountSelect);
    await waitFor(() => {
      expect(screen.getByText('Checking Account')).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText('Checking Account'));

    const amountInput = screen.getByPlaceholderText('0.00');
    await userEvent.type(amountInput, '100.00');

    await waitFor(() => {
      expect(screen.getByText(/ACH/i)).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText(/ACH/i));

    const submitButton = screen.getByRole('button', {
      name: /confirm payment/i,
    });
    await userEvent.click(submitButton);

    // Wait for success screen
    await waitFor(() => {
      expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    });

    // Click make another payment button
    const makeAnotherButton = screen.getByText('Make Another Payment');
    await userEvent.click(makeAnotherButton);

    // Should return to the form
    await waitFor(() => {
      expect(screen.getByText('1. Who are you paying?')).toBeInTheDocument();
    });

    // Form should be reset
    expect(
      screen.getByRole('combobox', { name: /select or type recipient/i })
    ).toHaveValue('');
  });
});
