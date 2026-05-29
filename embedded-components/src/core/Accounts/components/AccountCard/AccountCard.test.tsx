import { server } from '@/msw/server';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import type {
  AccountBalanceResponse,
  AccountResponse,
} from '@/api/generated/ep-accounts.schemas';

import { EBComponentsProvider } from '../../../EBComponentsProvider';
import { AccountCard } from './AccountCard';

const mockAccount: AccountResponse = {
  id: 'account1',
  clientId: '0085199987',
  label: 'MAIN3919',
  state: 'OPEN',
  paymentRoutingInformation: {
    accountNumber: '20000057603919',
    country: 'US',
    routingInformation: [
      {
        type: 'ABA',
        value: '028000024',
      },
    ],
  },
  createdAt: '2025-01-26T14:32:00.000Z',
  category: 'LIMITED_DDA',
};

const renderComponent = (account: AccountResponse = mockAccount) => {
  // Don't reset handlers here - beforeEach already does it
  // Handlers should be set up with server.use() before calling renderComponent()

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
      <AccountCard account={account} />
    </EBComponentsProvider>
  );
};

describe('AccountCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  test('renders account information', async () => {
    const mockBalance: AccountBalanceResponse = {
      id: 'account1',
      date: '2025-01-26',
      currency: 'USD',
      balanceTypes: [{ typeCode: 'ITAV', amount: 5558.42 }],
    };
    server.use(
      http.get('*/accounts/:id/balances', () => HttpResponse.json(mockBalance))
    );

    renderComponent();

    await waitFor(() => {
      // Check for display name in heading: "Category (...XXXX)"
      expect(
        screen.getByRole('heading', { name: /Limited DDA \(\.\.\.3919\)/i })
      ).toBeInTheDocument();
    });

    // Status badge shows translated label "Open" for OPEN state
    expect(screen.getByText(/Open/i)).toBeInTheDocument();
  });

  test('displays masked account number', () => {
    const mockBalance: AccountBalanceResponse = {
      id: 'account1',
      date: '2025-01-26',
      currency: 'USD',
      balanceTypes: [],
    };
    server.use(
      http.get('*/accounts/:id/balances', () => HttpResponse.json(mockBalance))
    );

    renderComponent();

    // Check for masked account number pattern "****3919" in the account number section
    expect(screen.getByText(/\*\*\*\*3919/)).toBeInTheDocument();
  });

  test('displays balance information when available', async () => {
    const mockBalance: AccountBalanceResponse = {
      id: 'account1',
      date: '2025-01-26',
      currency: 'USD',
      balanceTypes: [
        { typeCode: 'ITAV', amount: 5558.42 },
        { typeCode: 'ITBD', amount: 5758.42 },
      ],
    };
    server.use(
      http.get('*/accounts/:id/balances', () => HttpResponse.json(mockBalance))
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/5,558/i)).toBeInTheDocument();
    });
  });

  test('displays loading state for balance', async () => {
    server.use(
      http.get('*/accounts/:id/balances', () => new Promise(() => {}))
    );

    renderComponent();

    // Check for skeleton loader - wait for it to appear
    await waitFor(() => {
      const skeleton = document.querySelector('.eb-h-3');
      expect(skeleton).toBeInTheDocument();
    });
  });

  test('renders routing number from V1 API shape for payments accounts', async () => {
    const paymentsAccount: AccountResponse = {
      ...mockAccount,
      category: 'LIMITED_DDA_PAYMENTS',
    };
    server.use(
      http.get('*/accounts/:id/balances', () =>
        HttpResponse.json({
          id: 'account1',
          currency: 'USD',
          balanceTypes: [],
        })
      )
    );

    renderComponent(paymentsAccount);

    await waitFor(() => {
      expect(screen.getByText('028000024')).toBeInTheDocument();
      // V1 ABA entries infer transactionType 'ACH'
      expect(screen.getByText(/ACH Routing Number/i)).toBeInTheDocument();
    });
  });

  test('renders routing number from V2 API shape (routingCodeType/routingNumber/transactionType)', async () => {
    // Simulate V2-shaped response — at runtime the API may return this shape
    // even though the TypeScript type still reflects V1
    const v2Account = {
      ...mockAccount,
      category: 'LIMITED_DDA_PAYMENTS',
      paymentRoutingInformation: {
        accountNumber: '20000057603919',
        country: 'US',
        routingInformation: [
          {
            routingCodeType: 'ABA',
            routingNumber: '065400137',
            transactionType: 'ACH',
          },
        ],
      },
    } as unknown as AccountResponse;

    server.use(
      http.get('*/accounts/:id/balances', () =>
        HttpResponse.json({
          id: 'account1',
          currency: 'USD',
          balanceTypes: [],
        })
      )
    );

    renderComponent(v2Account);

    await waitFor(() => {
      expect(screen.getByText('065400137')).toBeInTheDocument();
      expect(screen.getByText(/ACH Routing Number/i)).toBeInTheDocument();
    });
  });

  test('renders multiple routing entries from V2 API shape', async () => {
    const multiRoutingAccount = {
      ...mockAccount,
      category: 'LIMITED_DDA_PAYMENTS',
      paymentRoutingInformation: {
        accountNumber: '20000057603919',
        country: 'US',
        routingInformation: [
          {
            routingCodeType: 'ABA',
            routingNumber: '065400137',
            transactionType: 'ACH',
          },
          {
            routingCodeType: 'ABA',
            routingNumber: '065400137',
            transactionType: 'WIRE',
          },
        ],
      },
    } as unknown as AccountResponse;

    server.use(
      http.get('*/accounts/:id/balances', () =>
        HttpResponse.json({
          id: 'account1',
          currency: 'USD',
          balanceTypes: [],
        })
      )
    );

    renderComponent(multiRoutingAccount);

    await waitFor(() => {
      expect(screen.getByText(/ACH Routing Number/i)).toBeInTheDocument();
      expect(screen.getByText(/WIRE Routing Number/i)).toBeInTheDocument();
    });
  });
});
