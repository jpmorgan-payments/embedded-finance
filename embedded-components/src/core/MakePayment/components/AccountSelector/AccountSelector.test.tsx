import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type {
  ListAccountsResponse,
  PageMetaData,
  PaymentFormData,
} from '../../types';
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

// Simple mock data
const mockAccounts: ListAccountsResponse = {
  items: [
    {
      id: 'account-1',
      label: 'Checking Account',
      category: 'CHECKING' as any,
      createdAt: '2024-01-01T00:00:00Z',
      state: 'ACTIVE' as any,
    } as any,
    {
      id: 'account-2',
      label: 'Savings Account',
      category: 'SAVINGS' as any,
      createdAt: '2024-01-01T00:00:00Z',
      state: 'ACTIVE' as any,
    } as any,
  ],
  metadata: {
    page: 0,
    limit: 25,
    totalElements: 2,
    totalPages: 1,
  } as PageMetaData,
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
