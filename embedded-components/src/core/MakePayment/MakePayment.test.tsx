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
      },
    },
    {
      id: 'recipient-2',
      type: 'LINKED_ACCOUNT',
      status: 'ACTIVE',
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName: 'Jane',
        lastName: 'Smith',
      },
      account: {
        number: '0987654321',
      },
    },
  ],
};

const mockAccountBalance = {
  currency: 'USD',
  balanceTypes: [
    {
      typeCode: 'ITAV',
      amount: 1000.0,
    },
    {
      typeCode: 'ITBD',
      amount: 1000.0,
    },
  ],
};

const renderComponent = (props = {}) => {
  // Reset MSW handlers before each render
  server.resetHandlers();

  // Setup API mock handlers
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
        <MakePayment {...props} />
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};

describe.skip('MakePayment', () => {
  test('renders correctly with default props', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Send Money')).toBeInTheDocument();
    });
  });

  test('auto-selects recipient when recipientId is provided and found in list', async () => {
    renderComponent({ recipientId: 'recipient-1' });

    // Open the dialog
    await userEvent.click(screen.getByText('Send Money'));

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByText('From Account')).toBeInTheDocument();
    });

    // Select an account first
    await userEvent.click(screen.getByText('From Account'));
    await userEvent.click(screen.getByText('Checking Account (DDA)'));

    // Wait for recipients to load and check if the specified recipient is selected
    await waitFor(() => {
      const recipientSelect = screen.getByDisplayValue('John Doe - ****7890');
      expect(recipientSelect).toBeInTheDocument();
    });
  });

  test('shows warning when recipientId is provided but not found in list', async () => {
    renderComponent({ recipientId: 'non-existent-recipient' });

    // Open the dialog
    await userEvent.click(screen.getByText('Send Money'));

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByText('From Account')).toBeInTheDocument();
    });

    // Select an account first
    await userEvent.click(screen.getByText('From Account'));
    await userEvent.click(screen.getByText('Checking Account (DDA)'));

    // Wait for recipients to load and check for warning message
    await waitFor(() => {
      expect(
        screen.getByText(
          'Warning: The specified recipient (ID: non-existent-recipient) was not found in the available recipients list.'
        )
      ).toBeInTheDocument();
    });
  });

  test('does not show warning when recipientId is not provided', async () => {
    renderComponent();

    // Open the dialog
    await userEvent.click(screen.getByText('Send Money'));

    // Wait for the form to load
    await waitFor(() => {
      expect(screen.getByText('From Account')).toBeInTheDocument();
    });

    // Select an account first
    await userEvent.click(screen.getByText('From Account'));
    await userEvent.click(screen.getByText('Checking Account (DDA)'));

    // Wait for recipients to load and verify no warning is shown
    await waitFor(() => {
      expect(screen.getByText('To Recipient')).toBeInTheDocument();
    });

    // Verify warning message is not present
    expect(
      screen.queryByText(/Warning: The specified recipient/)
    ).not.toBeInTheDocument();
  });

  test('auto-selects both account and recipient when recipientId is provided and only one account is available', async () => {
    // Mock data with only one account
    const singleAccountMock = {
      items: [
        {
          id: 'account-1',
          label: 'Checking Account',
          category: 'DDA',
        },
      ],
    };

    // Reset MSW handlers and setup with single account
    server.resetHandlers();
    server.use(
      http.get('/api/accounts', () => {
        return HttpResponse.json(singleAccountMock);
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

    renderComponent({ recipientId: 'recipient-1' });

    // Open the dialog
    await userEvent.click(screen.getByText('Send Money'));

    // Wait for the form to load and check if account is auto-selected
    await waitFor(() => {
      expect(
        screen.getByDisplayValue('Checking Account (DDA)')
      ).toBeInTheDocument();
    });

    // Wait for recipients to load and check if the specified recipient is selected
    await waitFor(() => {
      expect(
        screen.getByDisplayValue('John Doe - ****7890')
      ).toBeInTheDocument();
    });
  });
});
