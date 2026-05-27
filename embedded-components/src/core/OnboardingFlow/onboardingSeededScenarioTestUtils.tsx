import { render, within } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { screen, waitFor } from '@test-utils';

import { EBComponentsProvider } from '@/core/EBComponentsProvider/EBComponentsProvider';
import { OnboardingFlow } from '@/core/OnboardingFlow';
import type { OnboardingFlowProps } from '@/core/OnboardingFlow/types/onboarding.types';

export function clearSharedQueryClient() {
  const g = globalThis as {
    __EB_QUERY_CLIENT__?: import('@tanstack/react-query').QueryClient;
  };
  g.__EB_QUERY_CLIENT__?.clear();
}

export function suppressHookOrderWarningsInTests() {
  const originalError = console.error;
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('React has detected a change in the order of Hooks')
    ) {
      return;
    }
    originalError(...(args as Parameters<typeof console.error>));
  });
}

/** MSW reset + shared query cache clear + hook-order noise suppression for seeded onboarding RTL suites. */
export function setupSeededOnboardingScenarioHooks(
  server: ReturnType<typeof setupServer>
) {
  beforeEach(() => {
    server.resetHandlers();
    clearSharedQueryClient();
    suppressHookOrderWarningsInTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
}

export function renderSeededOnboardingFlow(
  clientId: string,
  props: Partial<OnboardingFlowProps> = {}
) {
  const defaultProps: OnboardingFlowProps = {
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    availableOrganizationTypes: [
      'SOLE_PROPRIETORSHIP',
      'LIMITED_LIABILITY_COMPANY',
      'C_CORPORATION',
    ],
    docUploadOnlyMode: false,
    alertOnExit: false,
    hideSidebar: true,
    ...props,
  };

  return render(
    <EBComponentsProvider
      apiBaseUrl=""
      apiBaseUrlTransforms={{
        clients: (baseUrl) => baseUrl.replace('v1', '/do/v1'),
      }}
      headers={{}}
      contentTokens={{ name: 'enUS' }}
      reactQueryDefaultOptions={{
        queries: { retry: false },
      }}
      clientId={clientId}
    >
      <OnboardingFlow {...defaultProps} />
    </EBComponentsProvider>
  );
}

export async function waitForOverview(timeout = 25_000) {
  await waitFor(
    () => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    },
    { timeout }
  );
}

/** Business section may resume on Business identity or Check answers depending on seeded completeness. */
export async function assertSeededLegalNameVisibleInBusinessSection(
  legalName: string
) {
  await waitFor(
    () => {
      const identityForm = document.getElementById('business-identity');
      const onReview = screen.queryByRole('heading', {
        name: /Check your answers/i,
      });
      expect(identityForm ?? onReview).toBeTruthy();
    },
    { timeout: 15_000 }
  );

  const identityForm = document.getElementById('business-identity');
  if (identityForm) {
    const legalNameInput = within(identityForm).queryByRole('textbox', {
      name: /Legal name of the company/i,
    });
    if (legalNameInput) {
      expect(legalNameInput).toHaveValue(legalName);
    } else {
      // Sole proprietorship: legal name is readonly copy linked to controller personal details.
      expect(within(identityForm).getByText(legalName)).toBeInTheDocument();
    }
    return;
  }

  expect(screen.getByText(legalName)).toBeInTheDocument();
}
