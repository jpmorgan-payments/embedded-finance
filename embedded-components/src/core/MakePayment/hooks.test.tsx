import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import {
  usePaymentAutoSelection,
  usePaymentData,
  usePaymentValidation,
} from './hooks';
import type { PaymentFormData, PaymentMethod } from './types';

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
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'ACH',
    name: 'ACH Transfer',
    fee: 2.5,
    description: 'Standard ACH transfer',
  },
];

describe('usePaymentData', () => {
  test('returns initial data state', () => {
    const { result } = renderHook(() => {
      const form = useForm<PaymentFormData>();
      return usePaymentData([], form);
    }, {
      wrapper: TestWrapper,
    });

    expect(result.current.accounts).toBeUndefined();
    expect(result.current.recipients).toEqual([]);
    expect(result.current.selectedAccount).toBeUndefined();
    expect(result.current.selectedRecipient).toBeUndefined();
    expect(result.current.filteredRecipients).toEqual([]);
    expect(result.current.dynamicPaymentMethods).toEqual([]);
    expect(result.current.availableBalance).toBe(0);
  });
});

describe('usePaymentValidation', () => {
  test('returns initial validation state', () => {
    const { result } = renderHook(() => {
      const form = useForm<PaymentFormData>();
      return usePaymentValidation(mockPaymentMethods, 1000, form);
    }, { wrapper: TestWrapper });

    expect(result.current.isAmountValid).toBe(true);
    expect(result.current.totalAmount).toBe(0);
    expect(result.current.fee).toBe(0);
    expect(result.current.availableBalance).toBe(1000);
  });

  test('calculates fee correctly', () => {
    const { result } = renderHook(() => {
      const form = useForm<PaymentFormData>({
        defaultValues: { method: 'ACH' },
      });
      return usePaymentValidation(mockPaymentMethods, 1000, form);
    }, { wrapper: TestWrapper });

    expect(result.current.fee).toBe(2.5);
  });
});

describe('usePaymentAutoSelection', () => {
  test('does not crash with empty data', () => {
    const form = useForm<PaymentFormData>();

    expect(() => {
      renderHook(
        () =>
          usePaymentAutoSelection({ items: [] }, undefined, [], [], [], form),
        { wrapper: TestWrapper }
      );
    }).not.toThrow();
  });
});
