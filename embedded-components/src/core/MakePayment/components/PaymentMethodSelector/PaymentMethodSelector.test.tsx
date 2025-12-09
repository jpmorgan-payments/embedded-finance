import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type { PaymentFormData, PaymentMethod } from '../../types';
import { PaymentMethodSelector } from './PaymentMethodSelector';

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
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'ACH',
    name: 'ACH Transfer',
    fee: 2.5,
    description: 'Standard ACH transfer',
  } as any,
  {
    id: 'RTP',
    name: 'Real-Time Payment',
    fee: 1.0,
    description: 'Instant payment',
  } as any,
];

describe('PaymentMethodSelector', () => {
  test('renders correctly with payment methods', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          dynamicPaymentMethods={mockPaymentMethods}
          paymentMethods={mockPaymentMethods}
          isFormFilled={false}
          amount={0}
          fee={0}
        />
      </TestWrapper>
    );

    expect(screen.getByText('How do you want to pay?')).toBeInTheDocument();
    // Payment methods should be rendered with icons and labels
    expect(screen.getByText(/ACH/i)).toBeInTheDocument();
    expect(screen.getByText(/RTP/i)).toBeInTheDocument();
  });

  test('renders with manual label when forceAllMethods is true', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          dynamicPaymentMethods={mockPaymentMethods}
          paymentMethods={mockPaymentMethods}
          isFormFilled={false}
          amount={0}
          fee={0}
          forceAllMethods
        />
      </TestWrapper>
    );

    expect(screen.getByText('Payment method')).toBeInTheDocument();
  });

  test('displays payment method fees', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          dynamicPaymentMethods={mockPaymentMethods}
          paymentMethods={mockPaymentMethods}
          isFormFilled={false}
          amount={0}
          fee={0}
        />
      </TestWrapper>
    );

    expect(screen.getByText('$2.50 fee')).toBeInTheDocument();
    expect(screen.getByText('$1.00 fee')).toBeInTheDocument();
  });

  test('shows no payment methods message when empty', () => {
    render(
      <TestWrapper>
        <PaymentMethodSelector
          dynamicPaymentMethods={[]}
          paymentMethods={mockPaymentMethods}
          isFormFilled={false}
          amount={0}
          fee={0}
        />
      </TestWrapper>
    );

    expect(
      screen.getByText('No payment methods available for this recipient.')
    ).toBeInTheDocument();
  });
});
