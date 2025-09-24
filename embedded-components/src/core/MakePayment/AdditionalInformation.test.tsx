import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { AdditionalInformation } from './AdditionalInformation';
import type { PaymentFormData } from './types';

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

describe('AdditionalInformation', () => {
  test('renders correctly', () => {
    render(
      <TestWrapper>
        <AdditionalInformation />
      </TestWrapper>
    );

    expect(screen.getByText(/additional information/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/add a note or memo/i)
    ).toBeInTheDocument();
  });

  test('displays correct label', () => {
    render(
      <TestWrapper>
        <AdditionalInformation />
      </TestWrapper>
    );

    expect(
      screen.getByText(/additional information \(optional\)/i)
    ).toBeInTheDocument();
  });

  test('has memo input field', () => {
    render(
      <TestWrapper>
        <AdditionalInformation />
      </TestWrapper>
    );

    const memoInput = screen.getByPlaceholderText(/add a note or memo/i);
    expect(memoInput).toBeInTheDocument();
    // Input elements don't have explicit type="text" by default
  });
});
