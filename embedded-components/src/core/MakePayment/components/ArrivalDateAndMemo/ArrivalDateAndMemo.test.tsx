import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type { PaymentFormData } from '../../types';
import { ArrivalDateAndMemo } from './ArrivalDateAndMemo';

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

describe('ArrivalDateAndMemo', () => {
  test('renders correctly', () => {
    render(
      <TestWrapper>
        <ArrivalDateAndMemo />
      </TestWrapper>
    );

    expect(
      screen.getByText(/when do you want the payment to arrive/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Memo')).toBeInTheDocument();
  });

  test('displays arrival date section', () => {
    render(
      <TestWrapper>
        <ArrivalDateAndMemo />
      </TestWrapper>
    );

    expect(
      screen.getByText(/when do you want the payment to arrive/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/currently set to today/i)).toBeInTheDocument();
  });

  test('displays memo section', () => {
    render(
      <TestWrapper>
        <ArrivalDateAndMemo />
      </TestWrapper>
    );

    expect(screen.getByText('Memo')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/add a note or memo/i)
    ).toBeInTheDocument();
  });
});
