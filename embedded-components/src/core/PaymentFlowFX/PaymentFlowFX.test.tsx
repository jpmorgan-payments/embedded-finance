import { server } from '@/msw/server';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, userEvent, waitFor } from '@test-utils';

import { PaymentFlowFX, PaymentFlowFXInline } from './PaymentFlowFX';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const mockAccounts = {
  metadata: { page: 0, limit: 25, total_items: 2 },
  items: [
    {
      id: 'acct-fx-001',
      label: 'Operating Account',
      state: 'OPEN',
      category: 'LIMITED_DDA_PAYMENTS',
      paymentRoutingInformation: {
        accountNumber: '123456789',
        routingNumber: '021000021',
      },
    },
    {
      id: 'acct-fx-002',
      label: 'Payments Account',
      state: 'OPEN',
      category: 'LIMITED_DDA_PAYMENTS',
      paymentRoutingInformation: {
        accountNumber: '987654321',
        routingNumber: '021000021',
      },
    },
  ],
};

const singleAccount = {
  metadata: { page: 0, limit: 25, total_items: 1 },
  items: [mockAccounts.items[0]],
};

const mockBalance = {
  accountId: 'acct-fx-001',
  currency: 'USD',
  balanceTypes: [
    { typeCode: 'ITAV', amount: 5000.0 },
    { typeCode: 'CLAV', amount: 4800.0 },
  ],
};

// International (EUR) recipient — drives FX eligibility (FR-FX-1).
const mockRecipients = {
  recipients: [
    {
      id: 'rec-eur-001',
      type: 'RECIPIENT',
      status: 'ACTIVE',
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName: 'Isabelle',
        lastName: 'Moreau',
        address: {
          addressLine1: '10 Rue de Rivoli',
          city: 'Paris',
          postalCode: '75001',
          countryCode: 'FR',
        },
        contacts: [{ contactType: 'EMAIL', value: 'isabelle@example.fr' }],
      },
      account: {
        number: '111222333',
        currencyCode: 'EUR',
        countryCode: 'FR',
        routingInformation: [
          { routingNumber: '021000089', transactionType: 'ACH' },
          { routingNumber: '021000089', transactionType: 'WIRE' },
        ],
      },
    },
    {
      id: 'rec-usd-001',
      type: 'RECIPIENT',
      status: 'ACTIVE',
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName: 'John',
        lastName: 'Doe',
        contacts: [{ contactType: 'EMAIL', value: 'john@example.com' }],
      },
      account: {
        number: '444555666',
        routingInformation: [
          { routingNumber: '021000089', transactionType: 'ACH' },
        ],
      },
    },
  ],
  metadata: { total_items: 2, total_pages: 1 },
  page: 0,
  limit: 25,
};

const mockLinkedAccounts = {
  recipients: [
    {
      id: 'la-001',
      type: 'LINKED_ACCOUNT',
      status: 'ACTIVE',
      partyDetails: {
        type: 'INDIVIDUAL',
        firstName: 'Jane',
        lastName: 'Smith',
        contacts: [],
      },
      account: {
        number: '777888999',
        routingInformation: [
          { routingNumber: '021000089', transactionType: 'ACH' },
        ],
      },
    },
  ],
  metadata: { total_items: 1, total_pages: 1 },
  page: 0,
  limit: 25,
};

// V3 transaction responses.
const mockV3CreateResponse = {
  id: 'txn-v3-001',
  transactionReferenceId: 'PHUI_abc123',
  status: 'PENDING',
};

const mockV3EnrichedResponse = {
  id: 'txn-v3-001',
  transactionReferenceId: 'PHUI_abc123',
  status: 'COMPLETED',
  amount: '100.00',
  currency: 'USD',
  targetCurrency: 'EUR',
  targetAmount: '92.00',
  fxInformation: { exchangeRate: '0.92' },
};

function setupHandlers(
  overrides: {
    accounts?: typeof mockAccounts;
    accountsStatus?: number;
  } = {}
) {
  const { accounts = mockAccounts, accountsStatus } = overrides;

  server.use(
    http.get('*/accounts', () => {
      if (accountsStatus) {
        return HttpResponse.json({ error: 'boom' }, { status: accountsStatus });
      }
      return HttpResponse.json(accounts);
    }),
    http.get('*/accounts/:accountId/balances', () =>
      HttpResponse.json(mockBalance)
    ),
    http.get('*/recipients', ({ request }) => {
      const url = new URL(request.url);
      const type = url.searchParams.get('type');
      if (type === 'LINKED_ACCOUNT') {
        return HttpResponse.json(mockLinkedAccounts);
      }
      return HttpResponse.json(mockRecipients);
    }),
    http.post('*/transactions', () =>
      HttpResponse.json(mockV3CreateResponse, { status: 202 })
    ),
    http.get('*/transactions/:id', () =>
      HttpResponse.json(mockV3EnrichedResponse)
    )
  );
}

describe('PaymentFlowFX', () => {
  beforeEach(() => {
    setupHandlers();
  });

  describe('rendering', () => {
    it('renders inside a dialog when open with no trigger', async () => {
      render(<PaymentFlowFX open onOpenChange={vi.fn()} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
      });
    });

    it('renders a trigger button when provided', () => {
      render(
        <PaymentFlowFX
          trigger={<button type="button">Send FX Payment</button>}
          onClose={vi.fn()}
        />
      );

      expect(
        screen.getByRole('button', { name: /send fx payment/i })
      ).toBeInTheDocument();
    });

    it('shows the account list after data loads', async () => {
      render(<PaymentFlowFX open onOpenChange={vi.fn()} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Operating Account')).toBeInTheDocument();
      });
    });
  });

  describe('account selection', () => {
    it('shows all accounts when multiple are available', async () => {
      render(<PaymentFlowFX open onOpenChange={vi.fn()} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Operating Account')).toBeInTheDocument();
        expect(screen.getByText('Payments Account')).toBeInTheDocument();
      });
    });

    it('renders with a single eligible account', async () => {
      setupHandlers({ accounts: singleAccount });

      render(<PaymentFlowFX open onOpenChange={vi.fn()} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByText('Operating Account')).toBeInTheDocument();
      });
    });
  });

  describe('error and empty states', () => {
    it('shows the fatal error view when accounts fail to load', async () => {
      setupHandlers({ accountsStatus: 500 });

      render(<PaymentFlowFX open onOpenChange={vi.fn()} onClose={vi.fn()} />);

      await waitFor(
        () => {
          expect(
            screen.queryByText('Operating Account')
          ).not.toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('shows the empty state when no accounts are available', async () => {
      setupHandlers({
        accounts: {
          metadata: { page: 0, limit: 25, total_items: 0 },
          items: [],
        },
      });

      render(<PaymentFlowFX open onOpenChange={vi.fn()} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(screen.queryByText('Operating Account')).not.toBeInTheDocument();
      });
    });
  });

  describe('FX configuration', () => {
    it('accepts a custom supportedTargetCurrencies list without error', async () => {
      render(
        <PaymentFlowFX
          open
          onOpenChange={vi.fn()}
          onClose={vi.fn()}
          supportedTargetCurrencies={['EUR', 'GBP']}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Operating Account')).toBeInTheDocument();
      });
    });

    it('pre-selects account and payee from initial props', async () => {
      render(
        <PaymentFlowFX
          open
          onOpenChange={vi.fn()}
          onClose={vi.fn()}
          initialAccountId="acct-fx-001"
          initialPayeeId="rec-eur-001"
        />
      );

      await waitFor(() => {
        expect(document.querySelector('[role="dialog"]')).toBeInTheDocument();
      });
    });
  });

  describe('submission', () => {
    it('submits an FX payment from the dialog and shows the success view', async () => {
      const onTransactionComplete = vi.fn();

      render(
        <PaymentFlowFX
          open
          onOpenChange={vi.fn()}
          onClose={vi.fn()}
          initialPayeeId="rec-eur-001"
          initialPaymentMethod="ACH"
          initialAmount="100"
          onTransactionComplete={onTransactionComplete}
        />
      );

      // FROM section active; wait for accounts + balances to load.
      await screen.findByText('Operating Account');
      await waitFor(() =>
        expect(screen.getAllByText(/\$5,000/).length).toBeGreaterThan(0)
      );

      // Select the debtor account to complete the form.
      await userEvent.click(screen.getByText('Operating Account'));

      // Confirm the payment (two layouts render the button; use the first).
      const confirmButtons = await screen.findAllByRole('button', {
        name: /confirm payment/i,
      });
      await waitFor(() => expect(confirmButtons[0]).toBeEnabled());
      await userEvent.click(confirmButtons[0]);

      await waitFor(
        () =>
          expect(screen.getAllByText(/payment sent/i).length).toBeGreaterThan(
            0
          ),
        { timeout: 3000 }
      );
      expect(onTransactionComplete).toHaveBeenCalled();
    });
  });
});

describe('PaymentFlowFXInline', () => {
  beforeEach(() => {
    setupHandlers();
  });

  it('renders inline without a dialog', async () => {
    render(<PaymentFlowFXInline />);

    await waitFor(() => {
      expect(screen.getByText('Operating Account')).toBeInTheDocument();
    });

    expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('drives account, international recipient, method, and amount selection', async () => {
    render(<PaymentFlowFXInline />);

    // FROM section is active with two accounts; wait for balances to load.
    await screen.findByText('Operating Account');
    await waitFor(() =>
      expect(screen.getAllByText(/\$5,000/).length).toBeGreaterThan(0)
    );

    // Select the debtor account — advances to the payee step.
    await userEvent.click(screen.getByText('Operating Account'));

    // Choose the EUR recipient — activates FX.
    const payee = await screen.findByText('Isabelle Moreau');
    await userEvent.click(payee);

    // Choose the FX Low-value (ACH) payment method — relabeled when FX is active.
    const ach = await screen.findByText('FX Low-value');
    await userEvent.click(ach);

    // The amount and memo inputs are always present; typing updates them.
    const amountInput = document.getElementById(
      'fx-amount'
    ) as HTMLInputElement;
    await userEvent.type(amountInput, '250');
    await waitFor(() => expect(amountInput.value).toBe('250'));

    const memoInput = document.getElementById('fx-memo') as HTMLInputElement;
    await userEvent.type(memoInput, 'invoice 42');
    await waitFor(() => expect(memoInput.value).toBe('invoice 42'));
  });

  it('warns when the preselected account and payee are not found', async () => {
    render(
      <PaymentFlowFXInline
        initialAccountId="acct-does-not-exist"
        initialPayeeId="rec-does-not-exist"
      />
    );

    await screen.findByText('Operating Account');
    await waitFor(() =>
      expect(
        screen.getByText(/pre-selected account .* was not found/i)
      ).toBeInTheDocument()
    );
    expect(
      screen.getByText(/pre-selected payee .* was not found/i)
    ).toBeInTheDocument();
  });

  it('submits an FX payment end-to-end and shows the success view', async () => {
    const onTransactionComplete = vi.fn();

    render(
      <PaymentFlowFXInline
        initialPayeeId="rec-eur-001"
        initialPaymentMethod="ACH"
        initialAmount="100"
        onTransactionComplete={onTransactionComplete}
      />
    );

    // FROM section is active; wait for accounts + balances to load.
    await screen.findByText('Operating Account');
    await waitFor(() =>
      expect(screen.getAllByText(/\$5,000/).length).toBeGreaterThan(0)
    );

    // Select the debtor account to complete the form.
    await userEvent.click(screen.getByText('Operating Account'));

    // Confirm the payment (two layouts render the button; use the first).
    const confirmButtons = await screen.findAllByRole('button', {
      name: /confirm payment/i,
    });
    await waitFor(() => expect(confirmButtons[0]).toBeEnabled());
    await userEvent.click(confirmButtons[0]);

    // Success view is shown once the transaction resolves.
    await waitFor(
      () =>
        expect(screen.getAllByText(/payment sent/i).length).toBeGreaterThan(0),
      { timeout: 3000 }
    );
    expect(onTransactionComplete).toHaveBeenCalled();
  });
});

describe('PaymentFlowFX interactions', () => {
  beforeEach(() => {
    setupHandlers();
  });

  it('sanitizes the amount input across edge cases', async () => {
    render(
      <PaymentFlowFXInline
        initialPayeeId="rec-eur-001"
        initialPaymentMethod="ACH"
      />
    );

    // Wait for accounts + balances, then select the debtor account.
    await screen.findByText('Operating Account');
    await waitFor(() =>
      expect(screen.getAllByText(/\$5,000/).length).toBeGreaterThan(0)
    );
    await userEvent.click(screen.getByText('Operating Account'));

    const amountInput = document.getElementById(
      'fx-amount'
    ) as HTMLInputElement;

    // Strips non-numeric characters.
    fireEvent.change(amountInput, { target: { value: 'ab12c3' } });
    await waitFor(() => expect(amountInput.value).toBe('123'));

    // Caps to two decimal places.
    fireEvent.change(amountInput, { target: { value: '9.999' } });
    await waitFor(() => expect(amountInput.value).toBe('9.99'));

    // Collapses multiple decimal points to a single one.
    fireEvent.change(amountInput, { target: { value: '1.2.3' } });
    await waitFor(() => expect(amountInput.value).toBe('1.23'));

    // Strips leading zeros from whole numbers.
    fireEvent.change(amountInput, { target: { value: '007' } });
    await waitFor(() => expect(amountInput.value).toBe('7'));

    // Keeps a valid sub-dollar amount intact.
    fireEvent.change(amountInput, { target: { value: '0.5' } });
    await waitFor(() => expect(amountInput.value).toBe('0.5'));

    // Clears back to empty.
    fireEvent.change(amountInput, { target: { value: '' } });
    await waitFor(() => expect(amountInput.value).toBe(''));
  });

  it('selects a domestic (USD) recipient without activating FX', async () => {
    render(<PaymentFlowFXInline />);

    await screen.findByText('Operating Account');
    await waitFor(() =>
      expect(screen.getAllByText(/\$5,000/).length).toBeGreaterThan(0)
    );
    await userEvent.click(screen.getByText('Operating Account'));

    // Domestic recipient — handlePayeeSelect with no target currency.
    const usdPayee = await screen.findByText('John Doe');
    await userEvent.click(usdPayee);

    // Advances to the payment-method step for the domestic payee.
    expect(await screen.findByText('ACH Transfer')).toBeInTheDocument();
  });

  it('flags the amount step when confirming without an amount', async () => {
    render(
      <PaymentFlowFXInline
        initialPayeeId="rec-eur-001"
        initialPaymentMethod="ACH"
      />
    );

    await screen.findByText('Operating Account');
    await waitFor(() =>
      expect(screen.getAllByText(/\$5,000/).length).toBeGreaterThan(0)
    );
    await userEvent.click(screen.getByText('Operating Account'));

    // Confirm with an empty amount — only the amount field is missing.
    const confirmButtons = await screen.findAllByRole('button', {
      name: /confirm payment/i,
    });
    await userEvent.click(confirmButtons[0]);

    // The amount step surfaces its required indicator.
    await waitFor(() =>
      expect(screen.getAllByText(/\(required\)/i).length).toBeGreaterThan(0)
    );

    // Entering a valid amount clears the amount error.
    const amountInput = document.getElementById(
      'fx-amount'
    ) as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: '100' } });
    await waitFor(() => expect(amountInput.value).toBe('100'));
  });

  it('highlights missing fields when confirming an empty form', async () => {
    render(<PaymentFlowFXInline />);

    await screen.findByText('Operating Account');

    // Nothing selected — confirming collects every missing field.
    const confirmButtons = await screen.findAllByRole('button', {
      name: /confirm payment/i,
    });
    await userEvent.click(confirmButtons[0]);

    // Validation blocked submission; the FROM step is still shown.
    await waitFor(() =>
      expect(screen.getByText('Operating Account')).toBeInTheDocument()
    );

    // Selecting the account clears its validation error.
    await userEvent.click(screen.getByText('Operating Account'));
    await waitFor(() =>
      expect(screen.getAllByText(/\$5,000/).length).toBeGreaterThan(0)
    );

    // Selecting a payee and method clears their validation errors too.
    await userEvent.click(await screen.findByText('Isabelle Moreau'));
    await userEvent.click(await screen.findByText('FX Low-value'));
  });

  it('navigates to the add-recipient form from the payee step', async () => {
    render(<PaymentFlowFXInline />);

    await screen.findByText('Operating Account');
    await waitFor(() =>
      expect(screen.getAllByText(/\$5,000/).length).toBeGreaterThan(0)
    );
    await userEvent.click(screen.getByText('Operating Account'));

    // Recipients tab is active by default — open the add-recipient form.
    const addButton = await screen.findByRole('button', {
      name: /add new recipient/i,
    });
    await userEvent.click(addButton);

    expect(
      await screen.findByText(/add a new person or business/i)
    ).toBeInTheDocument();

    // Switch from the recipient form to the link-account form.
    await userEvent.click(
      screen.getByRole('button', { name: /or link my account instead/i })
    );
    expect(
      await screen.findByText(/connect your account from another bank/i)
    ).toBeInTheDocument();
  });

  it('navigates to the link-account form from the linked-accounts tab', async () => {
    render(<PaymentFlowFXInline />);

    await screen.findByText('Operating Account');
    await waitFor(() =>
      expect(screen.getAllByText(/\$5,000/).length).toBeGreaterThan(0)
    );
    await userEvent.click(screen.getByText('Operating Account'));

    // Switch to the linked-accounts tab, then open the link-account form.
    const linkedTab = await screen.findByRole('tab', {
      name: /linked accounts/i,
    });
    await userEvent.click(linkedTab);

    const linkButton = await screen.findByRole('button', {
      name: /link new account/i,
    });
    await userEvent.click(linkButton);

    expect(
      await screen.findByText(/connect your account from another bank/i)
    ).toBeInTheDocument();

    // Switch from the link-account form back to the recipient form.
    await userEvent.click(
      screen.getByRole('button', {
        name: /or add an external recipient instead/i,
      })
    );
    expect(
      await screen.findByText(/add a new person or business/i)
    ).toBeInTheDocument();
  });

  it('resets the flow when making another payment', async () => {
    render(
      <PaymentFlowFXInline
        initialPayeeId="rec-eur-001"
        initialPaymentMethod="ACH"
        initialAmount="100"
      />
    );

    await screen.findByText('Operating Account');
    await waitFor(() =>
      expect(screen.getAllByText(/\$5,000/).length).toBeGreaterThan(0)
    );
    await userEvent.click(screen.getByText('Operating Account'));

    const confirmButtons = await screen.findAllByRole('button', {
      name: /confirm payment/i,
    });
    await waitFor(() => expect(confirmButtons[0]).toBeEnabled());
    await userEvent.click(confirmButtons[0]);

    await waitFor(
      () =>
        expect(screen.getAllByText(/payment sent/i).length).toBeGreaterThan(0),
      { timeout: 3000 }
    );

    // Reset the flow to start another payment — returns to the main form.
    const makeAnother = await screen.findByRole('button', {
      name: /make another payment/i,
    });
    await userEvent.click(makeAnother);

    await waitFor(() =>
      expect(screen.getByText('Operating Account')).toBeInTheDocument()
    );
  });

  it('closes the dialog from the success view', async () => {
    const onClose = vi.fn();

    render(
      <PaymentFlowFX
        open
        onOpenChange={vi.fn()}
        onClose={onClose}
        initialPayeeId="rec-eur-001"
        initialPaymentMethod="ACH"
        initialAmount="100"
      />
    );

    await screen.findByText('Operating Account');
    await waitFor(() =>
      expect(screen.getAllByText(/\$5,000/).length).toBeGreaterThan(0)
    );
    await userEvent.click(screen.getByText('Operating Account'));

    const confirmButtons = await screen.findAllByRole('button', {
      name: /confirm payment/i,
    });
    await waitFor(() => expect(confirmButtons[0]).toBeEnabled());
    await userEvent.click(confirmButtons[0]);

    await waitFor(
      () =>
        expect(screen.getAllByText(/payment sent/i).length).toBeGreaterThan(0),
      { timeout: 3000 }
    );

    const done = await screen.findByRole('button', { name: /^done$/i });
    await userEvent.click(done);

    expect(onClose).toHaveBeenCalled();
  });
});
