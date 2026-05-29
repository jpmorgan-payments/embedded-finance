import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import type { PaymentFormData } from '../types';
import { usePaymentForm } from './usePaymentForm';

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

describe('usePaymentForm', () => {
  test('returns form instance with correct default values', () => {
    const { result } = renderHook(() => usePaymentForm(), {
      wrapper: TestWrapper,
    });

    expect(result.current.form).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.onSubmit).toBeDefined();
    expect(result.current.resetForm).toBeDefined();

    // Check default values
    const defaultValues = result.current.form.getValues();
    expect(defaultValues.from).toBe('');
    expect(defaultValues.to).toBe('');
    expect(defaultValues.amount).toBe('');
    expect(defaultValues.method).toBe('ACH');
    expect(defaultValues.currency).toBe('USD');
    expect(defaultValues.memo).toBe('');
  });

  test('handles form submission', async () => {
    const { result } = renderHook(() => usePaymentForm(), {
      wrapper: TestWrapper,
    });

    const mockData: PaymentFormData = {
      from: 'account-1',
      to: 'recipient-1',
      amount: '100.50',
      method: 'ACH',
      currency: 'USD',
      memo: 'Test memo',
      recipientMode: 'existing',
    };

    // Set form values
    act(() => {
      result.current.form.setValue('from', mockData.from);
      result.current.form.setValue('to', mockData.to);
      result.current.form.setValue('amount', mockData.amount);
      result.current.form.setValue('method', mockData.method);
      result.current.form.setValue('currency', mockData.currency);
      result.current.form.setValue('memo', mockData.memo);
    });

    // Submit form
    await act(async () => {
      await result.current.onSubmit(mockData);
    });

    expect(result.current.isLoading).toBe(false);
  });

  test('resets form correctly', () => {
    const { result } = renderHook(() => usePaymentForm(), {
      wrapper: TestWrapper,
    });

    // Set some values
    act(() => {
      result.current.form.setValue('from', 'account-1');
      result.current.form.setValue('amount', '100.50');
    });

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    const values = result.current.form.getValues();
    expect(values.from).toBe('');
    expect(values.amount).toBe('');
  });
});
