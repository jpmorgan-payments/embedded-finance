import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { ArrivalDate } from './ArrivalDate';

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

describe('ArrivalDate', () => {
  test('renders correctly', () => {
    render(
      <TestWrapper>
        <ArrivalDate />
      </TestWrapper>
    );

    expect(
      screen.getByText(/when do you want the payment to arrive/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/currently set to today/i)).toBeInTheDocument();
  });

  test("displays today's date", () => {
    render(
      <TestWrapper>
        <ArrivalDate />
      </TestWrapper>
    );

    const today = new Date();
    const expectedDate = today.toLocaleDateString();

    expect(screen.getByDisplayValue(expectedDate)).toBeInTheDocument();
  });

  test('input is disabled', () => {
    render(
      <TestWrapper>
        <ArrivalDate />
      </TestWrapper>
    );

    const today = new Date();
    const expectedDate = today.toLocaleDateString();
    const dateInput = screen.getByDisplayValue(expectedDate);

    expect(dateInput).toBeDisabled();
  });
});
