import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import type { ListAccountsResponse } from '@/api/generated/ep-accounts.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type { PaymentFormData } from '../../types';
import { AccountSelector } from './AccountSelector';

// Setup QueryClient for tests
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Simple test wrapper component
const TestWrapper: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const form = useForm<PaymentFormData>({
    defaultValues: {
      from: '',
      to: '',
      amount: '',
      method: 'ACH',
      currency: 'USD',
      memo: '',
    },
  });

  return (
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{
        name: 'enUS',
      }}
    >
      <QueryClientProvider client={queryClient}>
        <FormProvider {...form}>{children}</FormProvider>
      </QueryClientProvider>
    </EBComponentsProvider>
  );
};

// Mock data aligned with ep-accounts ListAccountsResponse and AccountResponse
const mockAccounts: ListAccountsResponse = {
  metadata: { page: 0, limit: 25, total_items: 2 },
  items: [
    {
      id: 'account-1',
      label: 'Checking Account',
      state: 'OPEN',
      createdAt: '2025-01-26T00:00:00.000Z',
      category: 'LIMITED_DDA_PAYMENTS',
    },
    {
      id: 'account-2',
      label: 'Savings Account',
      state: 'OPEN',
      createdAt: '2025-01-26T00:00:00.000Z',
      category: 'LIMITED_DDA',
    },
  ],
};

describe('AccountSelector', () => {
  test('renders correctly with accounts', () => {
    render(
      <TestWrapper>
        <AccountSelector
          accounts={mockAccounts}
          accountsStatus="success"
          refetchAccounts={vi.fn()}
        />
      </TestWrapper>
    );

    expect(
      screen.getByText('Which account are you paying from?')
    ).toBeInTheDocument();
    // Note: Account options are not visible in the dropdown until it's opened
  });

  test('renders loading state', () => {
    render(
      <TestWrapper>
        <AccountSelector
          accounts={undefined}
          accountsStatus="loading"
          refetchAccounts={vi.fn()}
        />
      </TestWrapper>
    );

    // Loading state doesn't show loading text, just disables the select
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  test('renders error state', () => {
    render(
      <TestWrapper>
        <AccountSelector
          accounts={undefined}
          accountsStatus="error"
          refetchAccounts={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Failed to load accounts.')).toBeInTheDocument();
  });
});
