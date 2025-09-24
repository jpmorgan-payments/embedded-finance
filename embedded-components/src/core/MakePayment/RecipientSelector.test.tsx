import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { RecipientSelector } from './RecipientSelector';
import type { PaymentFormData, Recipient } from './types';

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
const mockRecipients: Recipient[] = [
  {
    id: 'recipient-1',
    type: 'RECIPIENT',
    partyDetails: {
      type: 'INDIVIDUAL',
      firstName: 'John',
      lastName: 'Doe',
    } as any,
    account: {
      number: '1234567890',
      type: 'CHECKING',
      countryCode: 'US' as any,
      routingInformation: [
        {
          transactionType: 'ACH',
          routingCodeType: 'USABA',
          routingNumber: '123456789',
        },
      ],
    },
  },
];

describe('RecipientSelector', () => {
  test('renders correctly with recipients', () => {
    render(
      <TestWrapper>
        <RecipientSelector
          filteredRecipients={mockRecipients}
          selectedAccount={undefined}
          recipientsStatus="success"
          refetchRecipients={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('1. Who are you paying?')).toBeInTheDocument();
    // Note: Recipients are not visible in the dropdown until it's opened
  });

  test('renders loading state', () => {
    render(
      <TestWrapper>
        <RecipientSelector
          filteredRecipients={[]}
          selectedAccount={undefined}
          recipientsStatus="loading"
          refetchRecipients={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('No recipients available')).toBeInTheDocument();
  });

  test('renders error state', () => {
    render(
      <TestWrapper>
        <RecipientSelector
          filteredRecipients={[]}
          selectedAccount={undefined}
          recipientsStatus="error"
          refetchRecipients={vi.fn()}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Failed to load recipients')).toBeInTheDocument();
  });
});
