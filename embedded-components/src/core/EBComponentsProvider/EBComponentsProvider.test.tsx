import { render, screen } from '@testing-library/react';

import { EBComponentsProvider } from './EBComponentsProvider';

// Test component that throws an error
function BuggyComponent() {
  throw new Error('Test error message');
  return null;
}

// Test component that renders normally
function NormalComponent() {
  return <div>Normal component content</div>;
}

describe('EBComponentsProvider', () => {
  // Suppress console.error for error boundary test
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders children normally when no errors occur', () => {
    render(
      <EBComponentsProvider apiBaseUrl="/">
        <NormalComponent />
      </EBComponentsProvider>
    );

    expect(screen.getByText('Normal component content')).toBeInTheDocument();
  });

  it('renders error fallback when child component throws', () => {
    render(
      <EBComponentsProvider apiBaseUrl="/">
        <BuggyComponent />
      </EBComponentsProvider>
    );

    // Check if error message is displayed
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Check if error details are shown in development
    if (process.env.NODE_ENV === 'development') {
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    }
  });

  it('logs error when component throws', () => {
    const mockConsoleError = vi.fn();
    console.error = mockConsoleError;

    render(
      <EBComponentsProvider apiBaseUrl="/">
        <BuggyComponent />
      </EBComponentsProvider>
    );

    // Verify that error was logged
    expect(mockConsoleError).toHaveBeenCalled();
    // Check if the error message contains our test error
    expect(mockConsoleError.mock.calls[0][0]).toContain('Test error message');
  });

  it('isolates errors to specific components', () => {
    render(
      <EBComponentsProvider apiBaseUrl="/">
        <div>
          <NormalComponent />
          <BuggyComponent />
        </div>
      </EBComponentsProvider>
    );

    // Error boundary should show error message
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // But normal component should not be affected
    expect(
      screen.queryByText('Normal component content')
    ).not.toBeInTheDocument();
  });
});
