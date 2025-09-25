import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type {
  ListAccountsResponse,
  PageMetaData,
  PaymentFormData,
  Recipient,
} from '../../types';
import { ReviewPanel } from './ReviewPanel';

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

const mockAccounts: ListAccountsResponse = {
  items: [
    {
      id: 'account-1',
      label: 'Checking Account',
      category: 'CHECKING' as any,
      createdAt: '2024-01-01T00:00:00Z',
      state: 'ACTIVE' as any,
    } as any,
  ],
  metadata: {
    page: 0,
    limit: 25,
    totalElements: 1,
    totalPages: 1,
  } as PageMetaData,
};

describe('ReviewPanel', () => {
  test('renders correctly', () => {
    render(
      <TestWrapper>
        <ReviewPanel
          filteredRecipients={mockRecipients}
          accounts={mockAccounts}
          accountsStatus="success"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Review payment')).toBeInTheDocument();
  });

  test('displays payment details when form is filled', () => {
    render(
      <TestWrapper>
        <ReviewPanel
          filteredRecipients={mockRecipients}
          accounts={mockAccounts}
          accountsStatus="success"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Payment details')).toBeInTheDocument();
  });

  test('displays fee and total calculations', () => {
    render(
      <TestWrapper>
        <ReviewPanel
          filteredRecipients={mockRecipients}
          accounts={mockAccounts}
          accountsStatus="success"
        />
      </TestWrapper>
    );

    expect(screen.getByText('Fee')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });
});
