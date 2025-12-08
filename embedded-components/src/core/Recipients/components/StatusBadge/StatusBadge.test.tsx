import { render, screen } from '@testing-library/react';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { StatusBadge } from './StatusBadge';

// Test wrapper with i18n provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{
        name: 'enUS',
      }}
    >
      {children}
    </EBComponentsProvider>
  );
};

describe('StatusBadge', () => {
  test('renders status badge with correct text and structure', () => {
    render(
      <TestWrapper>
        <StatusBadge status="ACTIVE" />
      </TestWrapper>
    );
    const badgeText = screen.getByText('Active');
    expect(badgeText).toBeInTheDocument();
    expect(badgeText.parentElement).toBeInTheDocument();
  });
});
