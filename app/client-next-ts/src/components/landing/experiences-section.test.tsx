import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ExperiencesSection } from './experiences-section';

const DOCS_ROOT =
  'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments';

describe('ExperiencesSection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders integration helper chips', () => {
    render(<ExperiencesSection />);
    expect(screen.getByText(/view full documentation/i)).toBeInTheDocument();
    expect(screen.getByText(/view partially hosted demo/i)).toBeInTheDocument();
    expect(
      screen.getByText(/partially hosted integration guide/i)
    ).toBeInTheDocument();
  });

  it('renders nine experience cards', () => {
    render(<ExperiencesSection />);
    const demoButtons = screen.getAllByTitle('View Live Demo');
    expect(demoButtons.length).toBe(9);
  });

  it('renders status badges that match the library status', () => {
    render(<ExperiencesSection />);
    // Onboarding, Linked Accounts, and Recipients are stable
    expect(screen.getAllByText('Available')).toHaveLength(3);
    // Payouts, Transactions, Accounts, and Client Details are in testing
    expect(screen.getAllByText('Testing')).toHaveLength(4);
    expect(screen.getAllByText('Beta')).toHaveLength(1);
    expect(screen.getAllByText('In Progress')).toHaveLength(1);
    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument();
  });

  it('renders Client Details card with correct title and description', () => {
    render(<ExperiencesSection />);
    expect(screen.getByText('Client Details')).toBeInTheDocument();
    expect(
      screen.getByText(
        /view comprehensive client information for fully onboarded clients/i
      )
    ).toBeInTheDocument();
  });

  it('opens code examples modal when a card title is clicked', async () => {
    const user = userEvent.setup();
    render(<ExperiencesSection />);
    const onboardingButton = screen.getByRole('button', {
      name: /client onboarding \(kyc\/kyb\)/i,
    });
    await user.click(onboardingButton);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(/onboardingflow component/i)
    ).toBeInTheDocument();
  });

  it('opens Client Details code example when Client Details title is clicked', async () => {
    const user = userEvent.setup();
    render(<ExperiencesSection />);
    const clientDetailsButton = screen.getByRole('button', {
      name: /^client details$/i,
    });
    await user.click(clientDetailsButton);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(
      within(dialog).getByText(/clientdetails component/i)
    ).toBeInTheDocument();
  });

  it.each([
    [/^cross-border fx payouts$/i, /paymentflowfx component/i],
    [/^approved client maintenance$/i, /approvedclientmaintenance component/i],
  ])(
    'opens a dedicated code example for %s',
    async (cardTitle, exampleTitle) => {
      const user = userEvent.setup();
      render(<ExperiencesSection />);
      await user.click(screen.getByRole('button', { name: cardTitle }));
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(exampleTitle)).toBeInTheDocument();
    }
  );

  it('opens the FX SellSense scenario and the client maintenance Storybook demo', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    const user = userEvent.setup();
    render(<ExperiencesSection />);

    const demoButtons = screen.getAllByTitle('View Live Demo');
    await user.click(demoButtons[4]);
    await user.click(demoButtons[8]);

    expect(open.mock.calls.map((call) => call[0])).toEqual([
      '/sellsense-demo?fullscreen=true&component=recipients&scenario=Seller%20with%20FX%20Payments&theme=Empty',
      'https://storybook.embedded-finance-dev.com/?path=/story/draft-approvedclientmaintenance--default',
    ]);
  });

  it('each card has demo and github links', () => {
    render(<ExperiencesSection />);
    expect(screen.getAllByTitle('View Live Demo').length).toBe(9);
    expect(screen.getAllByTitle('View Source Code').length).toBe(9);
  });

  it('opens current Embedded Payments API documentation URLs', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    const user = userEvent.setup();
    render(<ExperiencesSection />);

    const docsButtons = screen.getAllByTitle('View API Documentation');
    expect(docsButtons).toHaveLength(9);

    for (const button of docsButtons) {
      await user.click(button);
    }

    expect(open.mock.calls.map((call) => call[0])).toEqual([
      `${DOCS_ROOT}/capabilities/onboard-a-client`,
      `${DOCS_ROOT}/capabilities/external-accounts/add-linked-account`,
      `${DOCS_ROOT}/capabilities/external-accounts/third-party-recipient`,
      `${DOCS_ROOT}/capabilities/transactions/payouts/overview`,
      `${DOCS_ROOT}/capabilities/transactions/payouts/how-to/cross-border-fx-payout`,
      `${DOCS_ROOT}/capabilities/transactions/manage-transactions/view-and-display-transactions`,
      `${DOCS_ROOT}/capabilities/accounts/account-setup/create-accounts`,
      `${DOCS_ROOT}/capabilities/onboard-a-client`,
      `${DOCS_ROOT}/capabilities/onboard-a-client`,
    ]);
  });

  it('opens current GitHub, recipe, and npm links', async () => {
    const open = vi.fn();
    vi.stubGlobal('open', open);
    const user = userEvent.setup();
    render(<ExperiencesSection />);

    await user.click(screen.getAllByTitle('View Source Code')[6]);
    await user.click(screen.getAllByTitle('View Implementation Recipe')[6]);
    await user.click(screen.getAllByTitle('View NPM Components')[6]);

    expect(open.mock.calls.map((call) => call[0])).toEqual([
      'https://github.com/jpmorgan-payments/embedded-finance/tree/main/embedded-components/src/core/Accounts',
      'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/src/core/Accounts/ACCOUNTS_REQUIREMENTS.md',
      'https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-components#2-accounts',
    ]);
  });
});
