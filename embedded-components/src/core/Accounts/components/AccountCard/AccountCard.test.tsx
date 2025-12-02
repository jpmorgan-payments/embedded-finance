import { server } from '@/msw/server';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import type { AccountResponse } from '@/api/generated/ep-accounts.schemas';

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
  createdAt: '2025-04-14T08:57:21.792272Z',
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
    server.use(
      http.get('*/accounts/:id/balances', () =>
        HttpResponse.json({
          id: 'account1',
          date: '2023-10-28',
          currency: 'USD',
          balanceTypes: [{ typeCode: 'ITAV', amount: 5558.42 }],
        })
      )
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Limited DDA/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/OPEN/i)).toBeInTheDocument();
  });

  test('displays masked account number', () => {
    server.use(
      http.get('*/accounts/:id/balances', () =>
        HttpResponse.json({
          id: 'account1',
          date: '2023-10-28',
          currency: 'USD',
          balanceTypes: [],
        })
      )
    );

    renderComponent();

    // Check for masked account number pattern
    expect(screen.getByText(/3919/)).toBeInTheDocument();
    expect(screen.getByText(/\*\*\*\*/)).toBeInTheDocument();
  });

  test('displays balance information when available', async () => {
    server.use(
      http.get('*/accounts/:id/balances', () =>
        HttpResponse.json({
          id: 'account1',
          date: '2023-10-28',
          currency: 'USD',
          balanceTypes: [
            { typeCode: 'ITAV', amount: 5558.42 },
            { typeCode: 'ITBD', amount: 5758.42 },
          ],
        })
      )
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
      const skeleton = document.querySelector('.eb-h-4');
      expect(skeleton).toBeInTheDocument();
    });
  });
});
