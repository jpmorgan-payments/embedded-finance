import { render, screen, waitFor } from '@test-utils';

import {
  EBComponentsProvider,
  useScopedContentTokens,
} from './EBComponentsProvider';

// Test component that throws an error
function BuggyComponent() {
  throw new Error('Test error message');
  return null;
}

// Test component that renders normally
function NormalComponent() {
  return <div>Normal component content</div>;
}

// Test component that displays a translated value
const TestComponent = ({ namespace }: { namespace: string }) => {
  const { getTokensForNamespace } = useScopedContentTokens();
  const tokens = getTokensForNamespace(namespace);

  return (
    <div>
      <div data-testid="test-value">{tokens?.testValue}</div>
      <div data-testid="provider-namespace">{namespace}</div>
    </div>
  );
};

// Test component wrapper with specified content tokens
const TestProviderWrapper = ({
  id,
  testValue,
  namespace = 'testNamespace',
}: {
  id: string;
  testValue: string;
  namespace?: string;
}) => {
  return (
    <EBComponentsProvider
      apiBaseUrl="/"
      contentTokens={{
        name: 'enUS',
        tokens: {
          [namespace]: {
            testValue,
          },
        },
      }}
    >
      <div data-testid={`provider-${id}`}>
        <TestComponent namespace={namespace} />
      </div>
    </EBComponentsProvider>
  );
};

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

  test('basic provider functionality works', () => {
    render(
      <EBComponentsProvider apiBaseUrl="/" contentTokens={{ name: 'enUS' }}>
        <div data-testid="content">Test content</div>
      </EBComponentsProvider>
    );

    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  test('multiple providers have isolated content tokens', () => {
    render(
      <>
        <TestProviderWrapper id="first" testValue="First Provider Value" />
        <TestProviderWrapper id="second" testValue="Second Provider Value" />
      </>
    );

    const firstProvider = screen.getByTestId('provider-first');
    const secondProvider = screen.getByTestId('provider-second');

    expect(firstProvider).toBeInTheDocument();
    expect(secondProvider).toBeInTheDocument();

    // Each provider should have its own isolated value
    const firstValue = firstProvider.querySelector(
      '[data-testid="test-value"]'
    );
    const secondValue = secondProvider.querySelector(
      '[data-testid="test-value"]'
    );

    expect(firstValue?.textContent).toBe('First Provider Value');
    expect(secondValue?.textContent).toBe('Second Provider Value');
  });

  test('updating one provider does not affect others', async () => {
    const { rerender } = render(
      <>
        <TestProviderWrapper id="first" testValue="First Provider Value" />
        <TestProviderWrapper id="second" testValue="Second Provider Value" />
      </>
    );

    // Verify initial values
    const firstProvider = screen.getByTestId('provider-first');
    const secondProvider = screen.getByTestId('provider-second');

    const firstValue = firstProvider.querySelector(
      '[data-testid="test-value"]'
    );
    const secondValue = secondProvider.querySelector(
      '[data-testid="test-value"]'
    );

    expect(firstValue?.textContent).toBe('First Provider Value');
    expect(secondValue?.textContent).toBe('Second Provider Value');

    // Update just the first provider
    rerender(
      <>
        <TestProviderWrapper id="first" testValue="Updated First Value" />
        <TestProviderWrapper id="second" testValue="Second Provider Value" />
      </>
    );

    // Verify first provider updated but second remained unchanged
    const updatedFirstValue = screen
      .getByTestId('provider-first')
      .querySelector('[data-testid="test-value"]');
    const unchangedSecondValue = screen
      .getByTestId('provider-second')
      .querySelector('[data-testid="test-value"]');

    await waitFor(() => {
      expect(updatedFirstValue?.textContent).toBe('Updated First Value');
    });
    expect(unchangedSecondValue?.textContent).toBe('Second Provider Value');
  });

  test('providers with different namespaces remain isolated', () => {
    render(
      <>
        <TestProviderWrapper
          id="first"
          testValue="First Provider Value"
          namespace="namespace1"
        />
        <TestProviderWrapper
          id="second"
          testValue="Second Provider Value"
          namespace="namespace2"
        />
      </>
    );

    const firstProvider = screen.getByTestId('provider-first');
    const secondProvider = screen.getByTestId('provider-second');

    screen.debug();

    const firstValue = firstProvider.querySelector(
      '[data-testid="test-value"]'
    );
    const secondValue = secondProvider.querySelector(
      '[data-testid="test-value"]'
    );

    expect(firstValue?.textContent).toBe('First Provider Value');
    expect(secondValue?.textContent).toBe('Second Provider Value');
  });
});
