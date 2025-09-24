import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

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

describe('PaymentSuccess', () => {
  test('renders correctly', () => {
    const onMakeAnotherPayment = vi.fn();

    render(
      <TestWrapper>
        <PaymentSuccess onMakeAnotherPayment={onMakeAnotherPayment} />
      </TestWrapper>
    );

    expect(screen.getByText('Payment Successful!')).toBeInTheDocument();
    expect(
      screen.getByText('Your payment has been processed successfully.')
    ).toBeInTheDocument();
    expect(screen.getByText('Make Another Payment')).toBeInTheDocument();
  });

  test('displays make another payment button', () => {
    const onMakeAnotherPayment = vi.fn();

    render(
      <TestWrapper>
        <PaymentSuccess onMakeAnotherPayment={onMakeAnotherPayment} />
      </TestWrapper>
    );

    expect(screen.getByText('Make Another Payment')).toBeInTheDocument();
  });

  test('button is clickable', () => {
    const onMakeAnotherPayment = vi.fn();

    render(
      <TestWrapper>
        <PaymentSuccess onMakeAnotherPayment={onMakeAnotherPayment} />
      </TestWrapper>
    );

    const button = screen.getByText('Make Another Payment');
    expect(button).not.toBeDisabled();
  });
});
