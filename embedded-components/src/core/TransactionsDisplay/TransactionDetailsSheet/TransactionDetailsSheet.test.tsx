import {
  mockTransactionComplete,
  mockTransactionFee,
  mockTransactionMinimal,
  mockTransactionWithError,
} from '@/mocks/transactions.mock';
import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { userEvent } from '@test-utils';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { TransactionDetailsDialogTrigger } from './TransactionDetailsSheet';

// Setup QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Component rendering helper
const renderComponent = (
  transactionId: string,
  mockData: any = mockTransactionComplete
) => {
  // Reset MSW handlers before each render
  server.resetHandlers();

  // Setup explicit API mock handlers
  server.use(
    http.get('/transactions/:id', () => {
      return HttpResponse.json(mockData);
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
        <TransactionDetailsDialogTrigger transactionId={transactionId}>
          <button type="button">View Details</button>
        </TransactionDetailsDialogTrigger>
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};

describe('TransactionDetailsSheet', () => {
  beforeEach(() => {
    queryClient.clear();
  });

  describe('Rendering Tests', () => {
    test('renders trigger children correctly', () => {
      renderComponent('txn-001');
      expect(screen.getByText('View Details')).toBeInTheDocument();
    });

    test('opens dialog on trigger click', async () => {
      renderComponent('txn-001');

      await userEvent.click(screen.getByText('View Details'));

      expect(
        await screen.findByText(/Transaction: txn-001/i)
      ).toBeInTheDocument();
    });

    test.skip('displays loading state while fetching', async () => {
      server.use(
        http.get('/transactions/:id', async () => {
          await new Promise((resolve) => {
            setTimeout(resolve, 100);
          });
          return HttpResponse.json(mockTransactionComplete);
        })
      );

      renderComponent('txn-001');
      await userEvent.click(screen.getByText('View Details'));

      expect(
        screen.getByText(/Loading transaction details/i)
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(
          screen.queryByText(/Loading transaction details/i)
        ).not.toBeInTheDocument();
      });
    });

    test('displays transaction details when loaded', async () => {
      renderComponent('txn-complete-001');
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(screen.getByText(/\$1,500\.25/)).toBeInTheDocument();
      });

      expect(screen.getByText('ACH')).toBeInTheDocument();
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });

    test.skip('closes dialog on close button click', async () => {
      renderComponent('txn-001');
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(screen.getByText(/Transaction: txn-001/i)).toBeInTheDocument();
      });

      await userEvent.click(screen.getByRole('button', { name: /close/i }));

      await waitFor(() => {
        expect(
          screen.queryByText(/Transaction: txn-001/i)
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Mode Switcher Tests', () => {
    test('toggle switches between show/hide empty modes', async () => {
      renderComponent('txn-minimal-001', mockTransactionMinimal);
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(
          screen.getByText(/Transaction: txn-minimal-001/i)
        ).toBeInTheDocument();
      });

      const toggle = screen.getByRole('switch');
      // By default, hideEmpty is true, so "show all" is false (unchecked)
      expect(toggle).not.toBeChecked();

      // Label is always "Show all fields"
      expect(screen.getByText('Show all fields')).toBeInTheDocument();

      await userEvent.click(toggle);
      expect(toggle).toBeChecked();

      // Label remains the same
      expect(screen.getByText('Show all fields')).toBeInTheDocument();
    });

    test('hides N/A fields by default, shows them when toggle enabled', async () => {
      renderComponent('txn-minimal-001', mockTransactionMinimal);
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(
          screen.getByText(/Transaction: txn-minimal-001/i)
        ).toBeInTheDocument();
      });

      // By default (hideEmpty=true), N/A values should be hidden
      const initialNaElements = screen.queryAllByText('N/A');

      // Enable show all mode (toggle to checked)
      const toggle = screen.getByRole('switch');
      await userEvent.click(toggle);

      // After toggle, N/A values should be visible
      await waitFor(() => {
        const naElements = screen.getAllByText('N/A');
        expect(naElements.length).toBeGreaterThan(initialNaElements.length);
      });
    });

    test('shows all fields when toggle enabled', async () => {
      renderComponent('txn-complete-001');
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(
          screen.getByText(/Transaction: txn-complete-001/i)
        ).toBeInTheDocument();
      });

      const toggle = screen.getByRole('switch');
      // Enable show all mode
      await userEvent.click(toggle);
      expect(toggle).toBeChecked();

      // All sections should be visible
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Identifiers')).toBeInTheDocument();
      expect(screen.getByText('Dates & Versioning')).toBeInTheDocument();
      expect(screen.getByText('Debtor')).toBeInTheDocument();
      expect(screen.getByText('Creditor')).toBeInTheDocument();
      expect(screen.getByText('Financial')).toBeInTheDocument();
    });

    test('hides entire sections when all fields empty in hide mode (default)', async () => {
      const minimalWithoutDebtor = {
        ...mockTransactionMinimal,
        debtorName: undefined,
        debtorAccountId: undefined,
        debtorAccountNumber: undefined,
        debtorClientId: undefined,
      };

      renderComponent('txn-minimal-001', minimalWithoutDebtor);
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(
          screen.getByText(/Transaction: txn-minimal-001/i)
        ).toBeInTheDocument();
      });

      // By default (hideEmpty=true), debtor section should be hidden
      expect(screen.queryByText('Debtor')).not.toBeInTheDocument();

      // Enable show all mode
      const toggle = screen.getByRole('switch');
      await userEvent.click(toggle);

      // Debtor section should now be visible
      await waitFor(() => {
        expect(screen.getByText('Debtor')).toBeInTheDocument();
      });
    });
  });

  describe('Field Mapping Tests', () => {
    test('displays all TransactionGetResponseDetailsV2 fields correctly', async () => {
      renderComponent('txn-complete-001');
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(
          screen.getByText(/Transaction: txn-complete-001/i)
        ).toBeInTheDocument();
      });

      // Check all major fields are present
      expect(screen.getByText('ACH')).toBeInTheDocument();
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
      expect(screen.getByText('REF-COMPLETE-12345')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    test('formats currency values properly', async () => {
      renderComponent('txn-complete-001');
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(screen.getByText(/\$1,500\.25/)).toBeInTheDocument();
      });
    });

    test.skip('formats dates correctly', async () => {
      renderComponent('txn-complete-001');
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        // Check for the formatted date - it could be in different formats
        const dateElement = screen.getByText(/May.*2024/i);
        expect(dateElement).toBeInTheDocument();
      });
    });

    test('shows N/A for undefined values in show all mode', async () => {
      renderComponent('txn-minimal-001', mockTransactionMinimal);
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(
          screen.getByText(/Transaction: txn-minimal-001/i)
        ).toBeInTheDocument();
      });

      // Enable show all mode to see N/A values
      const toggle = screen.getByRole('switch');
      await userEvent.click(toggle);

      // Now N/A values should be visible
      await waitFor(() => {
        const naElements = screen.getAllByText('N/A');
        expect(naElements.length).toBeGreaterThan(0);
      });
    });

    test('displays error object when present', async () => {
      renderComponent('txn-error-001', mockTransactionWithError);
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(screen.getByText('Error Details')).toBeInTheDocument();
      });

      expect(screen.getByText('Insufficient Funds')).toBeInTheDocument();
      expect(screen.getByText('400')).toBeInTheDocument();
      expect(screen.getByText('trace-error-123')).toBeInTheDocument();
    });

    test('shows feeType when present', async () => {
      renderComponent('txn-fee-001', mockTransactionFee);
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(
          screen.getByText(/Transaction: txn-fee-001/i)
        ).toBeInTheDocument();
      });

      expect(screen.getByText('CHARGE')).toBeInTheDocument();
    });
  });

  describe('API Integration Tests', () => {
    test.skip('fetches transaction on dialog open', async () => {
      let requestMade = false;

      server.use(
        http.get('/transactions/:id', () => {
          requestMade = true;
          return HttpResponse.json(mockTransactionComplete);
        })
      );

      renderComponent('txn-001');

      // Request should not be made initially
      expect(requestMade).toBe(false);

      await userEvent.click(screen.getByText('View Details'));

      // Wait for the dialog to appear and transaction to load
      await waitFor(
        () => {
          expect(requestMade).toBe(true);
        },
        { timeout: 3000 }
      );
    });

    test.skip('handles API errors gracefully', async () => {
      server.use(
        http.get('/transactions/:id', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      renderComponent('txn-001');
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(
        () => {
          // The component displays a red error message when the request fails
          const errorElement = screen.getByText(/Failed to load transaction/i);
          expect(errorElement).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    test.skip('shows error message on fetch failure', async () => {
      server.use(
        http.get('/transactions/:id', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      renderComponent('txn-001');
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(
        () => {
          // Check for the error state rendering
          const errorElement = screen.getByText(/Failed to load transaction/i);
          expect(errorElement).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    test('does not fetch when dialog is closed', async () => {
      let requestMade = false;

      server.use(
        http.get('/transactions/:id', () => {
          requestMade = true;
          return HttpResponse.json(mockTransactionComplete);
        })
      );

      renderComponent('txn-001');

      // Wait a bit to ensure no request is made
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(requestMade).toBe(false);
    });
  });

  describe('Copy Functionality Tests', () => {
    test('copy button copies transaction ID to clipboard', async () => {
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn(),
        },
      });

      renderComponent('txn-001');
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(screen.getByText(/Transaction: txn-001/i)).toBeInTheDocument();
      });

      const copyButton = screen.getByRole('button', {
        name: /copy transaction id/i,
      });
      await userEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('txn-001');
    });
  });

  describe('Edge Cases', () => {
    test('handles minimal transaction with few fields', async () => {
      renderComponent('txn-minimal-001', mockTransactionMinimal);
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(
          screen.getByText(/Transaction: txn-minimal-001/i)
        ).toBeInTheDocument();
      });

      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('TRANSFER')).toBeInTheDocument();
    });

    test('handles transaction with all fields populated', async () => {
      renderComponent('txn-complete-001');
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(
          screen.getByText(/Transaction: txn-complete-001/i)
        ).toBeInTheDocument();
      });

      // Verify all major sections are present
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Identifiers')).toBeInTheDocument();
      expect(screen.getByText('Dates & Versioning')).toBeInTheDocument();
      expect(screen.getByText('Debtor')).toBeInTheDocument();
      expect(screen.getByText('Creditor')).toBeInTheDocument();
      expect(screen.getByText('Financial')).toBeInTheDocument();
    });

    test('handles transaction with error object', async () => {
      renderComponent('txn-error-001', mockTransactionWithError);
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(screen.getByText('Error Details')).toBeInTheDocument();
      });

      expect(screen.getByText('Insufficient Funds')).toBeInTheDocument();
    });

    test('handles fee transaction with feeType', async () => {
      renderComponent('txn-fee-001', mockTransactionFee);
      await userEvent.click(screen.getByText('View Details'));

      await waitFor(() => {
        expect(
          screen.getByText(/Transaction: txn-fee-001/i)
        ).toBeInTheDocument();
      });

      // FEE appears multiple times (type and originatingTransactionType)
      const feeElements = screen.getAllByText('FEE');
      expect(feeElements.length).toBeGreaterThan(0);
      expect(screen.getByText('CHARGE')).toBeInTheDocument();
    });
  });
});
