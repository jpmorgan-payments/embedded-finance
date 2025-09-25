import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type {
  ListAccountsResponse,
  PageMetaData,
  PaymentFormData,
  Recipient,
} from '../../types';
import { PaymentSuccess } from './PaymentSuccess';

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

// Mock data
const mockFormData: PaymentFormData = {
  from: 'account-1',
  to: 'recipient-1',
  amount: '100.00',
  method: 'ACH',
  currency: 'USD',
  memo: 'Test payment memo',
};

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
  } as any,
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

describe('PaymentSuccess', () => {
  test('renders correctly with all props', () => {
    const onMakeAnotherPayment = vi.fn();

    render(
      <TestWrapper>
        <PaymentSuccess
          onMakeAnotherPayment={onMakeAnotherPayment}
          filteredRecipients={mockRecipients}
          accounts={mockAccounts}
          formData={mockFormData}
        />
      </TestWrapper>
    );

    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(
      screen.getByText('Your payment has been processed successfully.')
    ).toBeInTheDocument();
    expect(screen.getByText('Make Another Payment')).toBeInTheDocument();
  });

  test('displays payment details correctly', () => {
    const onMakeAnotherPayment = vi.fn();

    render(
      <TestWrapper>
        <PaymentSuccess
          onMakeAnotherPayment={onMakeAnotherPayment}
          filteredRecipients={mockRecipients}
          accounts={mockAccounts}
          formData={mockFormData}
        />
      </TestWrapper>
    );

    // Check amount display
    expect(screen.getByText('$100.00 USD')).toBeInTheDocument();

    // Check payment method and recipient
    expect(screen.getByText(/ACH to John Doe/)).toBeInTheDocument();

    // Check recipient details
    expect(screen.getByText('Recipient')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('****7890')).toBeInTheDocument();

    // Check from account
    expect(screen.getByText('From Account')).toBeInTheDocument();
    expect(screen.getByText('Checking Account')).toBeInTheDocument();
    expect(screen.getByText('CHECKING')).toBeInTheDocument();

    // Check memo
    expect(screen.getByText('Memo')).toBeInTheDocument();
    expect(screen.getByText('Test payment memo')).toBeInTheDocument();
  });

  test('handles missing optional data gracefully', () => {
    const onMakeAnotherPayment = vi.fn();
    const formDataWithoutMemo: PaymentFormData = {
      ...mockFormData,
      memo: undefined,
    };

    render(
      <TestWrapper>
        <PaymentSuccess
          onMakeAnotherPayment={onMakeAnotherPayment}
          filteredRecipients={mockRecipients}
          accounts={mockAccounts}
          formData={formDataWithoutMemo}
        />
      </TestWrapper>
    );

    // Should still render successfully
    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(screen.getByText('$100.00 USD')).toBeInTheDocument();

    // Memo should not be displayed
    expect(screen.queryByText('Memo')).not.toBeInTheDocument();
  });

  test('handles empty recipients and accounts', () => {
    const onMakeAnotherPayment = vi.fn();

    render(
      <TestWrapper>
        <PaymentSuccess
          onMakeAnotherPayment={onMakeAnotherPayment}
          filteredRecipients={[]}
          accounts={undefined}
          formData={mockFormData}
        />
      </TestWrapper>
    );

    // Should still render successfully
    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(screen.getByText('$100.00 USD')).toBeInTheDocument();

    // Recipient and account details should not be displayed
    expect(screen.queryByText('Recipient')).not.toBeInTheDocument();
    expect(screen.queryByText('From Account')).not.toBeInTheDocument();
  });

  test('make another payment button is clickable', () => {
    const onMakeAnotherPayment = vi.fn();

    render(
      <TestWrapper>
        <PaymentSuccess
          onMakeAnotherPayment={onMakeAnotherPayment}
          filteredRecipients={mockRecipients}
          accounts={mockAccounts}
          formData={mockFormData}
        />
      </TestWrapper>
    );

    const button = screen.getByText('Make Another Payment');
    expect(button).not.toBeDisabled();

    // Test button click
    button.click();
    expect(onMakeAnotherPayment).toHaveBeenCalledTimes(1);
  });

  test('displays processed date', () => {
    const onMakeAnotherPayment = vi.fn();

    render(
      <TestWrapper>
        <PaymentSuccess
          onMakeAnotherPayment={onMakeAnotherPayment}
          filteredRecipients={mockRecipients}
          accounts={mockAccounts}
          formData={mockFormData}
        />
      </TestWrapper>
    );

    // Should display today's date
    const today = new Date();
    const expectedDate = today.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    expect(
      screen.getByText(new RegExp(`Processed on ${expectedDate}`))
    ).toBeInTheDocument();
  });
});
