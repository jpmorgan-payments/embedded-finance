/**
 * Behavioral Vitest parity with Storybook **Core/OnboardingFlow/Bad API Data** seeds:
 * invalid API values surface `FormMessage` on the corrected field (ⓘ prefix); fixing the
 * value clears that field’s message. We scope assertions to the field’s FormItem because
 * other inputs on the same step may still show unrelated validation.
 *
 * Schema-level rules remain covered in colocated `*.schema.test.*` files.
 */
import { server } from '@/msw/server';
import { render, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { screen, userEvent, waitFor } from '@test-utils';

import { EBComponentsProvider } from '@/core/EBComponentsProvider/EBComponentsProvider';
import { OnboardingFlow } from '@/core/OnboardingFlow';
import {
  createMockClientInvalidEIN,
  createMockClientInvalidJobTitle,
  createMockClientInvalidSSN,
} from '@/core/OnboardingFlow/fixtures/badApiClient.fixtures';
import {
  DEFAULT_CLIENT_ID,
  resetAndSeedClient,
} from '@/core/OnboardingFlow/stories/story-utils';
import type { OnboardingFlowProps } from '@/core/OnboardingFlow/types/onboarding.types';

/** Matches {@link FormMessage} prefix (information mark before error text). */
const FORM_MESSAGE_MARK = /\u24d8/;

function formItemRootForLabel(name: RegExp | string): HTMLElement {
  const label = screen.getByLabelText(name);
  const root = label.closest('.eb-space-y-2');
  expect(root).toBeTruthy();
  return root as HTMLElement;
}

function renderOnboardingFlow(props: Partial<OnboardingFlowProps> = {}) {
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

  const clientId = DEFAULT_CLIENT_ID;

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

async function waitForOverview(timeout = 25000) {
  await waitFor(
    () => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    },
    { timeout }
  );
}

describe('OnboardingFlow Bad API Data — validation clears after correction', () => {
  beforeEach(() => {
    server.resetHandlers();
    const g = globalThis as {
      __EB_QUERY_CLIENT__?: import('@tanstack/react-query').QueryClient;
    };
    g.__EB_QUERY_CLIENT__?.clear();

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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('InvalidJobTitle (Associate): destructive validation appears then clears after picking CEO', async () => {
    resetAndSeedClient(createMockClientInvalidJobTitle(), DEFAULT_CLIENT_ID);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderOnboardingFlow();
    await waitForOverview();

    await user.click(screen.getByTestId('personal-section-button'));
    await waitFor(
      () => {
        expect(screen.getByText(/Your personal details/i)).toBeInTheDocument();
      },
      { timeout: 25000 }
    );

    await waitFor(
      () => {
        expect(document.getElementById('personal-details')).toBeTruthy();
      },
      { timeout: 25000 }
    );

    const jobTitleRoot = formItemRootForLabel(/Job title/i);

    await waitFor(
      () => {
        expect(
          within(jobTitleRoot).getByText(FORM_MESSAGE_MARK)
        ).toBeInTheDocument();
      },
      { timeout: 25000 }
    );

    await user.click(screen.getByLabelText(/Job title/i));
    await user.click(screen.getByRole('option', { name: /^CEO$/i }));

    await waitFor(
      () => {
        expect(
          within(jobTitleRoot).queryByText(FORM_MESSAGE_MARK)
        ).not.toBeInTheDocument();
      },
      { timeout: 15000 }
    );
  }, 90000);

  test('Invalid EIN prefix: destructive validation appears then clears after entering valid EIN', async () => {
    resetAndSeedClient(createMockClientInvalidEIN(), DEFAULT_CLIENT_ID);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderOnboardingFlow();
    await waitForOverview();

    await user.click(screen.getByTestId('business-section-button'));
    await waitFor(
      () => {
        expect(screen.getByText(/Business identity/i)).toBeInTheDocument();
      },
      { timeout: 25000 }
    );

    await waitFor(
      () => {
        expect(document.getElementById('business-identity')).toBeTruthy();
      },
      { timeout: 25000 }
    );

    const einInput = screen.getByLabelText(/Employer Identification Number/i);
    const einRoot = formItemRootForLabel(/Employer Identification Number/i);

    await waitFor(
      () => {
        expect(
          within(einRoot).getByText(FORM_MESSAGE_MARK)
        ).toBeInTheDocument();
      },
      { timeout: 25000 }
    );

    await user.click(einInput);
    await user.keyboard('{Control>}a{/Control}{Backspace}');
    await user.type(einInput, '125698785');
    await user.tab();

    await waitFor(
      () => {
        expect(
          within(einRoot).queryByText(FORM_MESSAGE_MARK)
        ).not.toBeInTheDocument();
      },
      { timeout: 15000 }
    );
  }, 90000);

  test('Invalid SSN length: destructive validation appears then clears after entering valid SSN', async () => {
    resetAndSeedClient(createMockClientInvalidSSN(), DEFAULT_CLIENT_ID);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderOnboardingFlow();
    await waitForOverview();

    await user.click(screen.getByTestId('personal-section-button'));

    await waitFor(
      () => {
        const personal = document.getElementById('personal-details');
        const identity = document.getElementById('identity-document');
        expect(personal || identity).toBeTruthy();
      },
      { timeout: 25000 }
    );

    if (document.getElementById('personal-details')) {
      await user.click(screen.getByRole('button', { name: /continue/i }));
    }

    await waitFor(
      () => {
        expect(screen.getByText(/Your ID details/i)).toBeInTheDocument();
      },
      { timeout: 25000 }
    );

    await waitFor(
      () => {
        expect(document.getElementById('identity-document')).toBeTruthy();
      },
      { timeout: 25000 }
    );

    const ssnInput = screen.getByLabelText(/Social Security Number/i);
    const ssnRoot = formItemRootForLabel(/Social Security Number/i);

    await waitFor(
      () => {
        expect(
          within(ssnRoot).getByText(FORM_MESSAGE_MARK)
        ).toBeInTheDocument();
      },
      { timeout: 25000 }
    );

    await user.click(ssnInput);
    await user.keyboard('{Control>}a{/Control}{Backspace}');
    // nine digits accepted by schema (not in KNOWN_INVALID_SSNS); matches corp mock shape
    await user.type(ssnInput, '300400004');
    await user.tab();

    await waitFor(
      () => {
        expect(
          within(ssnRoot).queryByText(FORM_MESSAGE_MARK)
        ).not.toBeInTheDocument();
      },
      { timeout: 15000 }
    );
  }, 90000);
});
