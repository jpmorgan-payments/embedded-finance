/**
 * BankAccountForm — single-page linked-account create (party selector variants).
 *
 * Covers behavior introduced with `layout="singlePage"`:
 * - Unified {@link PartySelector} (individuals + organizations) instead of the
 *   two-step, type-branched account-holder fields.
 * - `hideAccountTypeSelect` + `hidePaymentMethodSelect` (Step 1 collapses when a
 *   single locked method is preselected — the linked-account ACH default).
 * - Selecting an ORGANIZATION party derives `accountType`/`businessName`.
 * - Auto-selection of the only available party.
 */
import { describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';

import {
  BankAccountForm,
  useLinkedAccountConfig,
  type BankAccountFormData,
} from './index';

/**
 * Resolves the real linked-account config within the provider (ACH-only,
 * locked, `prefillFromClient`) and renders the single-page form.
 */
function LinkedAccountSinglePageHarness({
  client,
  onSubmit,
}: {
  client?: ClientResponse;
  onSubmit?: (data: BankAccountFormData) => void;
}) {
  const config = useLinkedAccountConfig();
  return (
    <BankAccountForm
      client={client}
      config={config}
      layout="singlePage"
      embedded
      showCard={false}
      defaultValuesOverride={{ bankAccountType: 'CHECKING' }}
      onSubmit={onSubmit ?? (() => {})}
      onCancel={() => {}}
    />
  );
}

const orgAndIndividuals = {
  id: 'client-1',
  parties: [
    {
      id: 'org-party',
      active: true,
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      organizationDetails: { organizationName: 'Globex LLC' },
    },
    {
      id: 'ind-party-1',
      active: true,
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      individualDetails: { firstName: 'Ada', lastName: 'Lovelace' },
    },
    {
      id: 'ind-party-2',
      active: true,
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: { firstName: 'Grace', lastName: 'Hopper' },
    },
  ],
} as unknown as ClientResponse;

const singleIndividual = {
  id: 'client-2',
  parties: [
    {
      id: 'ind-only',
      active: true,
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      individualDetails: { firstName: 'Ada', lastName: 'Lovelace' },
    },
  ],
} as unknown as ClientResponse;

describe('BankAccountForm — single-page linked create', () => {
  test('renders unified party selector and hides account-type + payment-method controls', async () => {
    render(<LinkedAccountSinglePageHarness client={orgAndIndividuals} />);

    // Unified party picker replaces the type-branched holder fields.
    expect(
      await screen.findByRole('combobox', { name: /Account Holder/i })
    ).toBeInTheDocument();

    // Single locked ACH method → the payment-method checklist is suppressed.
    expect(
      screen.queryByText(/Select at least one payment method/i)
    ).not.toBeInTheDocument();

    // Bank details still render on the single page.
    expect(screen.getByLabelText(/Account Number/i)).toBeInTheDocument();
  });

  test('selecting an organization party derives ORGANIZATION type + business name on submit', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onSubmit = vi.fn();

    render(
      <LinkedAccountSinglePageHarness
        client={orgAndIndividuals}
        onSubmit={onSubmit}
      />
    );

    await user.click(
      await screen.findByRole('combobox', { name: /Account Holder/i })
    );
    await user.click(
      await screen.findByRole('option', { name: /Globex LLC/i })
    );

    const accountNumber = screen.getByLabelText(/Account Number/i);
    await user.clear(accountNumber);
    await user.type(accountNumber, '12345678901234567');

    const routing = screen.getByLabelText(/ACH Routing Number/i);
    await user.clear(routing);
    await user.type(routing, '021000021');

    await user.click(
      screen.getByRole('checkbox', { name: /I authorize verification/i })
    );

    await user.click(
      screen.getByRole('button', { name: /Confirm and Link Account/i })
    );

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        accountType: 'ORGANIZATION',
        businessName: 'Globex LLC',
        selectedPartyId: 'org-party',
      })
    );
  });

  test('auto-selects the only available party', async () => {
    render(<LinkedAccountSinglePageHarness client={singleIndividual} />);

    const holder = await screen.findByRole('combobox', {
      name: /Account Holder/i,
    });
    await waitFor(() => {
      expect(holder).toHaveTextContent(/Ada Lovelace/i);
    });
  });
});
