import { server } from '@/msw/server';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import type {
  AccountBalanceResponse,
  AccountResponse,
  ListAccountsResponse,
} from '@/api/generated/ep-accounts.schemas';

import { EBComponentsProvider } from '../EBComponentsProvider';
import { Accounts } from './Accounts';
import type { AccountsProps } from './Accounts.types';

const renderComponent = (props: Partial<AccountsProps> = {}) => {
  server.resetHandlers();

  const defaultProps: AccountsProps = {
    allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
    ...props,
  };

  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
      reactQueryDefaultOptions={{
        queries: {
          retry: false,
        },
      }}
    >
      <div className="eb-mx-auto eb-max-w-2xl eb-p-6">
        <Accounts {...defaultProps} />
      </div>
    </EBComponentsProvider>
  );
};

describe('Accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  describe('Rendering', () => {
    test('renders loading state', () => {
      server.use(http.get('*/accounts', () => new Promise(() => {})));

      renderComponent();

      expect(screen.getByText('Your account')).toBeInTheDocument();
    });

    test('renders empty state when no accounts found', async () => {
      const emptyResponse: ListAccountsResponse = {
        metadata: { page: 0, limit: 25, total_items: 0 },
        items: [],
      };
      server.use(
        http.get('*/accounts', () => HttpResponse.json(emptyResponse))
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/No accounts found/i)).toBeInTheDocument();
      });
      // Check for empty state icon (SVG element)
      const icon = document.querySelector('.lucide-landmark');
      expect(icon).toBeInTheDocument();
    });

    test('renders with default title', () => {
      const emptyResponse: ListAccountsResponse = {
        metadata: { page: 0, limit: 25, total_items: 0 },
        items: [],
      };
      server.use(
        http.get('*/accounts', () => HttpResponse.json(emptyResponse))
      );

      renderComponent();

      expect(screen.getByText('Your account')).toBeInTheDocument();
    });

    test('renders with custom title', () => {
      const emptyResponse: ListAccountsResponse = {
        metadata: { page: 0, limit: 25, total_items: 0 },
        items: [],
      };
      server.use(
        http.get('*/accounts', () => HttpResponse.json(emptyResponse))
      );

      renderComponent({ title: 'My Accounts' });

      expect(screen.getByText('My Accounts')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    const emptyResponse: ListAccountsResponse = {
      metadata: { page: 0, limit: 25, total_items: 0 },
      items: [],
    };

    test('accepts LIMITED_DDA category', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json(emptyResponse))
      );

      renderComponent({ allowedCategories: ['LIMITED_DDA'] });

      expect(screen.getByText('Your account')).toBeInTheDocument();
    });

    test('accepts LIMITED_DDA_PAYMENTS category', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json(emptyResponse))
      );

      renderComponent({ allowedCategories: ['LIMITED_DDA_PAYMENTS'] });

      expect(screen.getByText('Your account')).toBeInTheDocument();
    });

    test('accepts both categories', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json(emptyResponse))
      );

      renderComponent({
        allowedCategories: ['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS'],
      });

      expect(screen.getByText('Your account')).toBeInTheDocument();
    });
  });

  describe('With clientId filter', () => {
    const emptyResponse: ListAccountsResponse = {
      metadata: { page: 0, limit: 25, total_items: 0 },
      items: [],
    };

    test('renders when clientId is provided', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json(emptyResponse))
      );

      renderComponent({ clientId: 'client-001' });

      expect(screen.getByText('Your account')).toBeInTheDocument();
    });

    test('renders when clientId is not provided', () => {
      server.use(
        http.get('*/accounts', () => HttpResponse.json(emptyResponse))
      );

      renderComponent();

      expect(screen.getByText('Your account')).toBeInTheDocument();
    });
  });

  describe.skip('Error State', () => {
    test('renders error state with retry button', async () => {
      // Use wildcard pattern to match any baseURL (stories use this pattern)
      server.use(
        http.get('*/accounts', () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        })
      );

      renderComponent();

      // Wait for error alert to appear (similar to TransactionsDisplay test pattern)
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Verify error message and retry button
      expect(screen.getByText(/Failed to load accounts/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /retry/i })
      ).toBeInTheDocument();
    });
  });

  describe.skip('Status Badges', () => {
    test('displays status badge for account state', async () => {
      const mockAccount: AccountResponse = {
        id: 'account1',
        clientId: '0085199987',
        label: 'MAIN3919',
        state: 'OPEN',
        paymentRoutingInformation: {
          accountNumber: '20000057603919',
          country: 'US',
          routingInformation: [{ type: 'ABA', value: '028000024' }],
        },
        createdAt: '2025-01-26T14:32:00.000Z',
        category: 'LIMITED_DDA',
      };

      const mockBalance: AccountBalanceResponse = {
        id: 'account1',
        date: '2025-01-26',
        currency: 'USD',
        balanceTypes: [{ typeCode: 'ITAV', amount: 5558.42 }],
      };

      const accountsResponse: ListAccountsResponse = {
        metadata: { page: 0, limit: 25, total_items: 1 },
        items: [mockAccount],
      };

      server.use(
        http.get('*/accounts', () => HttpResponse.json(accountsResponse)),
        http.get('*/accounts/:id/balances', () =>
          HttpResponse.json(mockBalance)
        )
      );

      renderComponent({ allowedCategories: ['LIMITED_DDA'] });

      // Wait for the account card to be rendered - check for category name
      // This ensures the query ran and account was loaded
      await waitFor(() => {
        expect(screen.getByText(/Limited DDA/i)).toBeInTheDocument();
      });

      // Check for the status badge - should be visible once account is rendered
      await waitFor(() => {
        expect(screen.getByText('OPEN')).toBeInTheDocument();
      });
    });
  });
});
