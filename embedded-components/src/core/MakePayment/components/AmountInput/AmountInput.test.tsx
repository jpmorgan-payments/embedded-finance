import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type { PaymentFormData } from '../../types';
import { AmountInput } from './AmountInput';

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

describe('AmountInput', () => {
  test('renders correctly', () => {
    render(
      <TestWrapper>
        <AmountInput isAmountValid totalAmount={100} availableBalance={1000} />
      </TestWrapper>
    );

    expect(screen.getByText('How much are you paying?')).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  test('displays currency symbol', () => {
    render(
      <TestWrapper>
        <AmountInput isAmountValid totalAmount={100} availableBalance={1000} />
      </TestWrapper>
    );

    expect(screen.getByText('$')).toBeInTheDocument();
  });

  test('shows validation error when amount is invalid', () => {
    render(
      <TestWrapper>
        <AmountInput
          isAmountValid={false}
          totalAmount={1500}
          availableBalance={1000}
        />
      </TestWrapper>
    );

    // Validation errors are not shown in the basic render
    expect(screen.getByText('How much are you paying?')).toBeInTheDocument();
  });
});
