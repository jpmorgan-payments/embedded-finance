/**
 * Integration: OnboardingFlow link-account scenario.
 *
 * Seeds an APPROVED client, navigates to the link-account step, completes
 * the bank account form, verifies the linked account appears on the overview,
 * and exercises the "View Details" dialog.
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

    // ─── Overview ─────────────────────────────────────────────────────────────
    await waitForOverview();

    // The bank account section should be visible
    const bankSection = screen
      .getByText(/Link a bank account for payouts/i)
      .closest('[class*="eb-bg-card"]')!;
    expect(bankSection).toBeInTheDocument();

    // Wait for linked recipients query to finish loading (skeleton disappears)
    await waitFor(() => {
      expect(
        within(bankSection as HTMLElement).getByText(/Link an account/i)
      ).toBeInTheDocument();
    });

    // Click "Start" to navigate to the link-account screen
    const startButton = within(bankSection as HTMLElement).getByRole('button', {
      name: /start/i,
    });
    expect(startButton).toBeEnabled();
    await user.click(startButton);

    // ─── Link Account Screen: Step 1 (Payment Method) ─────────────────────────
    await waitFor(
      () => {
        expect(screen.getByText(/Link a bank account/i)).toBeInTheDocument();
      },
      { timeout: 10_000 }
    );

    // ACH is pre-selected and locked for linked accounts; just continue
    const continueButton = screen.getByRole('button', {
      name: /Continue to Account Details/i,
    });
    await user.click(continueButton);

    // ─── Link Account Screen: Step 2 (Account Details) ────────────────────────
    // Wait for form fields to appear
    await waitFor(() => {
      expect(screen.getByLabelText(/Account Number/i)).toBeInTheDocument();
    });

    // Select account holder from the individual selector (mock has 2 parties)
    const accountHolderSelect = screen.getByRole('combobox', {
      name: /Account Holder/i,
    });
    await user.click(accountHolderSelect);
    const peiterOption = await screen.findByRole('option', {
      name: /Peiter Pan/i,
    });
    await user.click(peiterOption);

    // Fill account details
    const accountNumberInput = screen.getByLabelText(/Account Number/i);
    await user.clear(accountNumberInput);
    await user.type(accountNumberInput, '12345678901234567');

    // Account type (Checking) is pre-filled via linkAccountStepOptions.initialValues

    // Fill routing number
    const routingInput = screen.getByLabelText(/ACH Routing Number/i);
    await user.clear(routingInput);
    await user.type(routingInput, '021000021');

    // Check the certification checkbox
    const certCheckbox = screen.getByRole('checkbox', {
      name: /I authorize verification/i,
    });
    await user.click(certCheckbox);

    // Submit the form
    const linkButton = screen.getByRole('button', {
      name: /^Link Account$/i,
    });
    expect(linkButton).toBeEnabled();
    await user.click(linkButton);

    // ─── Back to Overview with linked account card ─────────────────────────────
    // After successful submission, should redirect back to overview
    await waitFor(
      () => {
        expect(screen.getByText(/Overview/i)).toBeInTheDocument();
      },
      { timeout: 15_000 }
    );

    // Success alert should appear (MICRODEPOSITS_INITIATED status)
    await waitFor(() => {
      expect(
        screen.getByText(
          /Two small deposits will be sent to your account for verification/i
        )
      ).toBeInTheDocument();
    });

    // The account card should display masked account number
    const maskedMatches = screen.getAllByText(/4567/);
    expect(maskedMatches.length).toBeGreaterThan(0);

    // ─── View Details ─────────────────────────────────────────────────────────
    const viewDetailsButton = screen.getByRole('button', {
      name: /View details/i,
    });
    await user.click(viewDetailsButton);

    // Dialog should open with account holder information
    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Account number should be shown (masked by default)
      expect(within(dialog).getByText(/4567/)).toBeInTheDocument();
    });
  });

  test('shows "Start" button disabled when client status does not allow linking', async () => {
    // Re-seed with a status that does NOT allow linking
    resetAndSeedClient(
      { ...mockClientApproved, status: 'NEW' as any },
      DEFAULT_CLIENT_ID
    );

    renderSeededOnboardingFlow(DEFAULT_CLIENT_ID, {
      showLinkAccountStep: true,
    });

    await waitForOverview();

    const bankSection = screen
      .getByText(/Link a bank account for payouts/i)
      .closest('[class*="eb-bg-card"]')!;

    // Wait for the link-account card to render (after recipients query loads)
    await waitFor(() => {
      expect(
        within(bankSection as HTMLElement).getByText(/Link an account/i)
      ).toBeInTheDocument();
    });

    const startButton = within(bankSection as HTMLElement).getByRole('button', {
      name: /start/i,
    });
    expect(startButton).toBeDisabled();
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
