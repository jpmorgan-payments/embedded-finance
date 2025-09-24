import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type { Recipient } from '../../types';
import { RecipientDetails } from './RecipientDetails';

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
  return (
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{
        name: 'enUS',
      }}
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </EBComponentsProvider>
  );
};

// Simple mock data
const mockRecipient: Recipient = {
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
};

describe('RecipientDetails', () => {
  test('renders correctly with recipient', () => {
    render(
      <TestWrapper>
        <RecipientDetails selectedRecipient={mockRecipient} />
      </TestWrapper>
    );

    expect(screen.getByText(/recipient details/i)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('renders correctly without recipient', () => {
    render(
      <TestWrapper>
        <RecipientDetails selectedRecipient={undefined} />
      </TestWrapper>
    );

    // Component should return null when no recipient
    expect(screen.queryByText(/recipient details/i)).not.toBeInTheDocument();
  });

  test('displays account information', () => {
    render(
      <TestWrapper>
        <RecipientDetails selectedRecipient={mockRecipient} />
      </TestWrapper>
    );

    expect(screen.getByText(/account number/i)).toBeInTheDocument();
    expect(screen.getByText(/routing number/i)).toBeInTheDocument();
  });
});
