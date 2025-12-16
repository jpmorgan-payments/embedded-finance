import { EBComponentsProvider } from '@/index';
import { render as testingLibraryRender } from '@testing-library/react';

export function render(ui: React.ReactNode) {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <EBComponentsProvider
        apiBaseUrl=""
        apiPathPrefixes={{ clients: '/do/v1' }}
      >
        {children}
      </EBComponentsProvider>
    ),
  });
}
