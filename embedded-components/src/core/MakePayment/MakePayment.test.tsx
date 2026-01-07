import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { userEvent } from '@test-utils';

import { ListAccountsResponse } from '@/api/generated/ep-accounts.schemas';
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
const mockAccounts: ListAccountsResponse = {
  items: [
    {
      id: 'account-1',
      label: 'Checking Account',
      category: 'LIMITED_DDA_PAYMENTS',
      createdAt: '2024-01-01T00:00:00Z',
      state: 'OPEN',
      clientId: 'client-123',
      paymentRoutingInformation: {
        accountNumber: '1234567890',
        country: 'US',
        routingInformation: [
          {
            type: 'ABA',
            value: '123456789',
          },
        ],
      },
    },
    {
      id: 'account-2',
      label: 'Savings Account',
      category: 'LIMITED_DDA',
      createdAt: '2024-01-01T00:00:00Z',
      state: 'OPEN',
      clientId: 'client-123',
      paymentRoutingInformation: {
        accountNumber: '0987654321',
        country: 'US',
        routingInformation: [
          {
            type: 'ABA',
            value: '987654321',
          },
        ],
      },
    },
    {
      id: 'account-3',
      label: 'Savings Account',
      category: 'PROCESSING',
      createdAt: '2024-01-01T00:00:00Z',
      state: 'OPEN',
      clientId: 'client-123',
      paymentRoutingInformation: {
        accountNumber: '1122334455',
        country: 'US',
        routingInformation: [
          {
            type: 'ABA',
            value: '112233445',
          },
        ],
      },
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

// Default payment methods for testing
const defaultPaymentMethods = [
  { id: 'ACH', name: 'ACH', fee: 2.5 },
  { id: 'RTP', name: 'RTP', fee: 1 },
  { id: 'WIRE', name: 'WIRE', fee: 25 },
];

// Component rendering helper
const renderComponent = (props?: {
  paymentMethods?: typeof defaultPaymentMethods;
}) => {
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
    }),
    http.post('/recipients', () => {
      return HttpResponse.json({
        id: 'recipient-new',
        type: 'EXTERNAL_ACCOUNT',
        status: 'ACTIVE',
      });
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
        <MakePayment
          paymentMethods={props?.paymentMethods || defaultPaymentMethods}
        />
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
      expect(screen.getByText('Who are you paying?')).toBeInTheDocument();
      expect(
        screen.getByText('Which account are you paying from?')
      ).toBeInTheDocument();
      expect(screen.getByText('How much are you paying?')).toBeInTheDocument();
      expect(screen.getByText('How do you want to pay?')).toBeInTheDocument();
      // Check for recipient mode toggle
      expect(screen.getByText('Select existing')).toBeInTheDocument();
      expect(screen.getByText('Enter details')).toBeInTheDocument();
    });
  });

  test('form validation works with refactored components', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(
        screen.getByText('Which account are you paying from?')
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
        screen.getByText('Which account are you paying from?')
      ).toBeInTheDocument();
    });

    // Click on account selector
    const accountSelector = screen.getByRole('combobox', {
      name: /which account are you paying from/i,
    });
    await userEvent.click(accountSelector);

    // Check if accounts are loaded
    await waitFor(() => {
      expect(
        screen.getAllByText('Checking Account (LIMITED_DDA_PAYMENTS)')
      ).toHaveLength(2); // Option and span
      expect(screen.getAllByText('Savings Account (LIMITED_DDA)')).toHaveLength(
        2
      ); // Option and span
    });
  });

  test('recipient selection works with refactored RecipientSelector', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(
        screen.getByText('Which account are you paying from?')
      ).toBeInTheDocument();
    });

    // Select an account first
    const accountSelector = screen.getByRole('combobox', {
      name: /which account are you paying from/i,
    });
    await userEvent.click(accountSelector);

    await waitFor(() => {
      expect(
        screen.getAllByText('Checking Account (LIMITED_DDA_PAYMENTS)')
      ).toHaveLength(2); // Option and span
    });

    // Select the account by clicking on the option element directly
    const accountOption = screen.getByRole('option', {
      name: 'Checking Account (LIMITED_DDA_PAYMENTS)',
    });
    await userEvent.click(accountOption);

    // Since there's only one recipient, it should be displayed as text, not a select
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  test('amount input works with refactored AmountInput', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    // Wait for amount input section to appear
    await screen.findByText('How much are you paying?');

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
      expect(screen.getByText('How do you want to pay?')).toBeInTheDocument();
    });

    // Check if payment method options are rendered
    // Note: Only ACH and RTP are available based on the recipient's routing information
    // Payment methods now show with labels and fees
    await waitFor(() => {
      // Look for payment method names or fee text
      const achFee = screen.queryByText(/\$2\.50 fee/i);
      const rtpFee = screen.queryByText(/\$1\.00 fee/i);
      // At least one should be present
      expect(achFee || rtpFee).toBeTruthy();
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

  test.skip('payment success screen displays correctly after successful payment', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(screen.getByText('Who are you paying?')).toBeInTheDocument();
    });

    // Fill out the form
    // Since there's only one recipient, it should be displayed as text, not a select
    // The auto-selection hook should set the recipient value automatically
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Wait a bit for auto-selection to complete
    await waitFor(() => {
      // Payment methods should appear once recipient is selected
      // But we need to select account first
    });

    // Select account - find combobox (skip currency selector)
    const accountSelectors = screen.getAllByRole('combobox');
    const accountSelect = accountSelectors.find(
      (el) => !el.className.includes('eb-w-24')
    );
    if (accountSelect) {
      await userEvent.click(accountSelect);
    } else {
      await userEvent.click(accountSelectors[0]);
    }
    await waitFor(() => {
      expect(
        screen.getByRole('option', {
          name: 'Checking Account (LIMITED_DDA_PAYMENTS)',
        })
      ).toBeInTheDocument();
    });
    await userEvent.click(
      screen.getByRole('option', {
        name: 'Checking Account (LIMITED_DDA_PAYMENTS)',
      })
    );

    // Enter amount
    const amountInput = screen.getByPlaceholderText('0.00');
    await userEvent.type(amountInput, '100.00');

    // Payment methods should appear after recipient is selected
    // Since there's only one recipient, it should be auto-selected
    // Wait for payment method section to appear (only shown when recipientMode !== 'manual' AND recipient is selected)
    await waitFor(
      () => {
        expect(screen.getByText('How do you want to pay?')).toBeInTheDocument();
        // Payment methods should be available - filtered by recipient's supported methods
        // The mock recipient supports ACH and RTP (from routingInformation)
        expect(screen.getByText(/ACH/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Click on the ACH payment method
    const achText = screen.getByText(/ACH/i);
    const achLabel = achText.closest('label');
    expect(achLabel).toBeInTheDocument();
    await userEvent.click(achLabel!);

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
    expect(screen.getByText('100.00 USD')).toBeInTheDocument();
    expect(screen.getByText(/ACH to John Doe/)).toBeInTheDocument();
    expect(screen.getByText('Payment Details')).toBeInTheDocument();
    expect(screen.getByText('Make Another Payment')).toBeInTheDocument();
  });

  test('make another payment button works correctly', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(screen.getByText('Who are you paying?')).toBeInTheDocument();
    });

    // Fill out and submit form (simplified version)
    // Since there's only one recipient, it should be displayed as text, not a select
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Select account - find combobox (skip currency selector)
    const accountSelectors = screen.getAllByRole('combobox');
    const accountSelect = accountSelectors.find(
      (el) => !el.className.includes('eb-w-24')
    );
    if (accountSelect) {
      await userEvent.click(accountSelect);
    } else {
      await userEvent.click(accountSelectors[0]);
    }
    await waitFor(() => {
      expect(
        screen.getByRole('option', {
          name: 'Checking Account (LIMITED_DDA_PAYMENTS)',
        })
      ).toBeInTheDocument();
    });
    await userEvent.click(
      screen.getByRole('option', {
        name: 'Checking Account (LIMITED_DDA_PAYMENTS)',
      })
    );

    const amountInput = screen.getByPlaceholderText('0.00');
    await userEvent.type(amountInput, '100.00');

    // Payment methods should appear after recipient is selected
    // Wait for payment method section to appear (only shown when recipientMode !== 'manual' AND recipient is selected)
    await screen.findByText('How do you want to pay?');

    // Find the ACH payment method label specifically (not the review panel text)
    // Use getAllByText and find the one in the payment method selector
    const achLabels = screen.getAllByText(/ACH/i);
    // Find the label element that's clickable (has a for attribute or is in a label)
    const achLabel = achLabels
      .map((el) => el.closest('label'))
      .find((label) => label !== null && label.getAttribute('for'));
    expect(achLabel).toBeInTheDocument();
    await userEvent.click(achLabel!);

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
      expect(screen.getByText('Who are you paying?')).toBeInTheDocument();
    });

    // Since there's only one recipient, it should be displayed as text, not a select
    // So we just check that the recipient text is visible again
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('preview panel is shown by default', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(screen.getByText('Review payment')).toBeInTheDocument();
    });

    // Preview panel should be visible
    expect(screen.getByText('Review payment')).toBeInTheDocument();
  });

  test('preview panel can be hidden with showPreviewPanel=false', async () => {
    // Render component with showPreviewPanel=false
    server.resetHandlers();
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

    render(
      <EBComponentsProvider
        apiBaseUrl="/"
        headers={{}}
        contentTokens={{
          name: 'enUS',
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MakePayment showPreviewPanel={false} />
        </QueryClientProvider>
      </EBComponentsProvider>
    );

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(screen.getByText('Who are you paying?')).toBeInTheDocument();
    });

    // Preview panel should not be visible
    expect(screen.queryByText('Review payment')).not.toBeInTheDocument();
  });

  test('layout adjusts correctly when preview panel is hidden', async () => {
    // Render component with showPreviewPanel=false
    server.resetHandlers();
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

    render(
      <EBComponentsProvider
        apiBaseUrl="/"
        headers={{}}
        contentTokens={{
          name: 'enUS',
        }}
      >
        <QueryClientProvider client={queryClient}>
          <MakePayment showPreviewPanel={false} />
        </QueryClientProvider>
      </EBComponentsProvider>
    );

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(screen.getByText('Who are you paying?')).toBeInTheDocument();
    });

    // Form should still be functional without preview panel
    expect(screen.getByText('Who are you paying?')).toBeInTheDocument();
    expect(
      screen.getByText('Which account are you paying from?')
    ).toBeInTheDocument();
    expect(screen.getByText('How much are you paying?')).toBeInTheDocument();
    expect(screen.getByText('How do you want to pay?')).toBeInTheDocument();
    expect(screen.getByText(/Additional Information/)).toBeInTheDocument();
  });

  test.skip('recipient mode toggle switches between existing and manual', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(screen.getByText('Who are you paying?')).toBeInTheDocument();
    });

    // Initially should show "Select existing" mode
    expect(screen.getByText('Select existing')).toBeInTheDocument();
    expect(screen.getByText('Enter details')).toBeInTheDocument();

    // Click on "Enter details" to switch to manual mode
    await userEvent.click(screen.getByText('Enter details'));

    // Should show manual recipient fields
    await waitFor(() => {
      // Use getAllByText since "Payment method" appears in both h3 and span
      const paymentMethodElements = screen.getAllByText('Payment method');
      expect(paymentMethodElements.length).toBeGreaterThan(0);
      expect(screen.getByText('Recipient type')).toBeInTheDocument();
      expect(
        screen.getByText('Save recipient for future payments')
      ).toBeInTheDocument();
    });

    // Switch back to existing mode
    await userEvent.click(screen.getByText('Select existing'));

    // Payment methods should NOT appear until a recipient is selected
    // Since no recipient is selected, payment methods should not be visible
    await waitFor(() => {
      expect(
        screen.queryByText('How do you want to pay?')
      ).not.toBeInTheDocument();
    });

    // Now select a recipient - since there's only one, it should be auto-selected
    // Wait for recipient to be displayed
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Now payment methods should appear after recipient is selected
    await waitFor(() => {
      expect(screen.getByText('How do you want to pay?')).toBeInTheDocument();
    });
  });

  test.skip('save recipient checkbox appears in manual mode', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Make a payment'));

    await waitFor(() => {
      expect(screen.getByText('Who are you paying?')).toBeInTheDocument();
    });

    // Switch to manual mode
    await userEvent.click(screen.getByText('Enter details'));

    // Check for save recipient checkbox
    await waitFor(() => {
      const checkbox = screen.getByRole('checkbox', {
        name: /save recipient for future payments/i,
      });
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    // Check the checkbox
    const checkbox = screen.getByRole('checkbox', {
      name: /save recipient for future payments/i,
    });
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
