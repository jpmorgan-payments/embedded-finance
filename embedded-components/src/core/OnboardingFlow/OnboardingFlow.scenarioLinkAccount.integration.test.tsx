/**
 * Integration: OnboardingFlow link-account scenario.
 *
 * Seeds an APPROVED client, completes the single-page bank account form on Overview,
 * verifies the linked account appears, and exercises the "View Details" dialog.
 */
import { server } from '@/msw/server';
import { beforeEach, describe, expect, test } from 'vitest';
import { screen, userEvent, waitFor, within } from '@test-utils';

import {
  renderSeededOnboardingFlow,
  setupSeededOnboardingScenarioHooks,
  waitForOverview,
} from '@/core/OnboardingFlow/onboardingSeededScenarioTestUtils';
import {
  DEFAULT_CLIENT_ID,
  mockClientApproved,
  resetAndSeedClient,
} from '@/core/OnboardingFlow/stories/story-utils';

describe('OnboardingFlow — link account journey', () => {
  setupSeededOnboardingScenarioHooks(server);

  beforeEach(() => {
    resetAndSeedClient(mockClientApproved, DEFAULT_CLIENT_ID);
  });

  test('completes link account from overview, verifies account card and views details', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    renderSeededOnboardingFlow(DEFAULT_CLIENT_ID, {
      showLinkAccountStep: true,
      linkAccountStepOptions: {
        completionMode: 'editable',
        initialValues: {
          bankAccountType: 'CHECKING',
        },
      },
    });

    await waitForOverview();

    const bankSection = screen
      .getByText(/Link a bank account for payouts/i)
      .closest('[class*="eb-bg-card"]')!;
    expect(bankSection).toBeInTheDocument();

    // Single-page form renders inline (no Continue CTA)
    await waitFor(
      () => {
        expect(
          within(bankSection as HTMLElement).getByLabelText(/Account Number/i)
        ).toBeInTheDocument();
      },
      { timeout: 10_000 }
    );

    expect(
      within(bankSection as HTMLElement).queryByRole('button', {
        name: /Continue to Account Details/i,
      })
    ).not.toBeInTheDocument();

    const accountHolderSelect = screen.getByRole('combobox', {
      name: /Account Holder/i,
    });
    await user.click(accountHolderSelect);
    const peiterOption = await screen.findByRole('option', {
      name: /Peiter Pan/i,
    });
    await user.click(peiterOption);

    const accountNumberInput = screen.getByLabelText(/Account Number/i);
    await user.clear(accountNumberInput);
    await user.type(accountNumberInput, '12345678901234567');

    const routingInput = screen.getByLabelText(/ACH Routing Number/i);
    await user.clear(routingInput);
    await user.type(routingInput, '021000021');

    const certCheckbox = screen.getByRole('checkbox', {
      name: /I authorize verification/i,
    });
    await user.click(certCheckbox);

    const linkButton = screen.getByRole('button', {
      name: /^Link Account$/i,
    });
    expect(linkButton).toBeEnabled();
    await user.click(linkButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Two small deposits will be sent to your account for verification/i
        )
      ).toBeInTheDocument();
    });

    const maskedMatches = screen.getAllByText(/4567/);
    expect(maskedMatches.length).toBeGreaterThan(0);

    const viewDetailsButton = screen.getByRole('button', {
      name: /View details/i,
    });
    await user.click(viewDetailsButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(within(dialog).getByText(/4567/)).toBeInTheDocument();
    });
  });

  test('shows locked empty state when client status does not allow linking', async () => {
    resetAndSeedClient(
      { ...mockClientApproved, status: 'NEW' },
      DEFAULT_CLIENT_ID
    );

    renderSeededOnboardingFlow(DEFAULT_CLIENT_ID, {
      showLinkAccountStep: true,
    });

    await waitForOverview();

    const bankSection = screen
      .getByText(/Link a bank account for payouts/i)
      .closest('[class*="eb-bg-card"]')!;

    await waitFor(() => {
      expect(
        within(bankSection as HTMLElement).getByText(/Link an account/i)
      ).toBeInTheDocument();
    });

    expect(
      within(bankSection as HTMLElement).queryByRole('button', {
        name: /Continue to Account Details/i,
      })
    ).not.toBeInTheDocument();
    expect(
      within(bankSection as HTMLElement).queryByLabelText(/Account Number/i)
    ).not.toBeInTheDocument();
  });

  test('link account section hidden when showLinkAccountStep is false', async () => {
    renderSeededOnboardingFlow(DEFAULT_CLIENT_ID, {
      showLinkAccountStep: false,
    });

    await waitForOverview();

    expect(
      screen.queryByText(/Link a bank account for payouts/i)
    ).not.toBeInTheDocument();
  });
});
