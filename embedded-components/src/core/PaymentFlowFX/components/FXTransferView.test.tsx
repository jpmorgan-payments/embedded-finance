import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { FlowContextProvider } from '../../PaymentFlow/FlowContainer';
import { DEFAULT_PAYMENT_METHODS } from '../../PaymentFlow/PaymentFlow.constants';
import type {
  AccountResponse,
  PaymentFlowFormData,
} from '../../PaymentFlow/PaymentFlow.types';
import type { FXPayee, FxQuote } from '../PaymentFlowFX.types';
import type { MethodAvailability } from '../utils/eligibility';
import { FXTransferView, type FXTransferViewProps } from './FXTransferView';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const eurPayee = {
  id: 'rec-eur-001',
  name: 'Isabelle Moreau',
  accountNumber: '111222333',
  currencyCode: 'EUR',
  countryCode: 'FR',
  type: 'RECIPIENT',
  enabledPaymentMethods: ['ACH', 'WIRE'],
} as unknown as FXPayee;

const accounts = [
  {
    id: 'acct-fx-001',
    label: 'Operating Account',
    state: 'OPEN',
    category: 'LIMITED_DDA_PAYMENTS',
    paymentRoutingInformation: { accountNumber: '123456789' },
    balance: {
      available: 5000,
      currency: 'USD',
      hasError: false,
      isLoading: false,
    },
  },
  {
    id: 'acct-fx-002',
    label: 'Reserve Account',
    state: 'OPEN',
    category: 'LIMITED_DDA_PAYMENTS',
    paymentRoutingInformation: { accountNumber: '987654321' },
    balance: {
      available: 0,
      currency: 'USD',
      hasError: true,
      isLoading: false,
    },
  },
] as unknown as AccountResponse[];

const lockedQuote: FxQuote = {
  rate: 0.92,
  rateId: 'rate-eur-exec',
  expiresAt: new Date(Date.now() + 60_000),
  isIndicative: false,
};

function makeProps(
  overrides: Partial<FXTransferViewProps> = {}
): FXTransferViewProps {
  return {
    payees: [eurPayee],
    linkedAccounts: [],
    accounts,
    paymentMethods: DEFAULT_PAYMENT_METHODS,
    isLoading: false,
    onPayeeSelect: vi.fn(),
    onAddNewPayee: vi.fn(),
    onPaymentMethodSelect: vi.fn(),
    onEnablePaymentMethod: vi.fn(),
    onAccountSelect: vi.fn(),
    onAmountChange: vi.fn(),
    onMemoChange: vi.fn(),
    fxActive: true,
    targetCurrency: 'EUR',
    getAccountDisabledReason: () => undefined,
    getMethodAvailability: () => ({ available: true }) as MethodAvailability,
    getPayeeDisabledReason: () => undefined,
    fxQuoteStatus: 'success',
    fxQuote: lockedQuote,
    ...overrides,
  };
}

function renderView(
  props: Partial<FXTransferViewProps> = {},
  initialData: Record<string, unknown> = {}
) {
  return render(
    <FlowContextProvider
      initialData={initialData as unknown as Partial<PaymentFlowFormData>}
    >
      <FXTransferView {...makeProps(props)} />
    </FlowContextProvider>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FXTransferView', () => {
  it('renders the amount input and FX quote preview when FX is active', () => {
    renderView(
      {},
      {
        fromAccountId: 'acct-fx-001',
        payeeId: 'rec-eur-001',
        paymentMethod: 'ACH',
        amount: '100',
        targetCurrency: 'EUR',
        currency: 'USD',
      }
    );

    const amountInput = document.getElementById(
      'fx-amount'
    ) as HTMLInputElement;
    expect(amountInput.value).toBe('100');

    // Locked quote preview shows the exchange rate.
    expect(screen.getAllByText(/0\.92/).length).toBeGreaterThan(0);
  });

  it('lists selectable accounts with balances and error states', async () => {
    const onAccountSelect = vi.fn();
    renderView(
      { onAccountSelect },
      // No fromAccountId + two accounts -> FROM step is active.
      { targetCurrency: 'EUR', currency: 'USD' }
    );

    // Healthy account shows its available balance.
    expect(screen.getByText('Operating Account')).toBeInTheDocument();
    expect(screen.getByText(/\$5,000/)).toBeInTheDocument();

    // Errored balance surfaces the unavailable label.
    expect(screen.getByText('Reserve Account')).toBeInTheDocument();
    expect(screen.getByText(/unavailable/i)).toBeInTheDocument();

    await userEvent.click(screen.getByText('Operating Account'));
    expect(onAccountSelect).toHaveBeenCalledWith('acct-fx-001');
  });

  it('does not select a restricted account', async () => {
    const onAccountSelect = vi.fn();
    renderView(
      {
        onAccountSelect,
        getAccountDisabledReason: () => 'Not eligible for FX',
      },
      { targetCurrency: 'EUR', currency: 'USD' }
    );

    await userEvent.click(screen.getByText('Operating Account'));
    expect(onAccountSelect).not.toHaveBeenCalled();
  });

  it('forwards amount and memo edits to the callbacks', async () => {
    const onAmountChange = vi.fn();
    const onMemoChange = vi.fn();
    renderView(
      { onAmountChange, onMemoChange },
      {
        fromAccountId: 'acct-fx-001',
        payeeId: 'rec-eur-001',
        paymentMethod: 'ACH',
        amount: '',
        targetCurrency: 'EUR',
        currency: 'USD',
      }
    );

    const amountInput = document.getElementById(
      'fx-amount'
    ) as HTMLInputElement;
    await userEvent.type(amountInput, '5');
    expect(onAmountChange).toHaveBeenCalled();

    const memoInput = document.getElementById('fx-memo') as HTMLInputElement;
    await userEvent.type(memoInput, 'rent');
    expect(onMemoChange).toHaveBeenCalled();
  });

  it('renders the one-time recipient card with edit/save/clear actions', async () => {
    const onEditUnsavedRecipient = vi.fn();
    const onSaveUnsavedRecipient = vi.fn();
    const onClearUnsavedRecipient = vi.fn();

    renderView(
      {
        onEditUnsavedRecipient,
        onSaveUnsavedRecipient,
        onClearUnsavedRecipient,
        saveUnsavedRecipientError: new Error('Save failed'),
      },
      {
        fromAccountId: 'acct-fx-001',
        paymentMethod: 'ACH',
        amount: '50',
        targetCurrency: 'EUR',
        currency: 'USD',
        unsavedRecipient: {
          displayName: 'One Time Payee',
          accountNumber: '999888777',
          enabledPaymentMethods: ['ACH'],
        },
      }
    );

    // Expand the "To" step so the unsaved-recipient card is visible.
    const toHeader = screen
      .getAllByRole('button')
      .find((btn) => (btn.textContent ?? '').trimStart().startsWith('To'));
    expect(toHeader).toBeDefined();
    await userEvent.click(toHeader as HTMLElement);

    expect(screen.getByText('One Time Payee')).toBeInTheDocument();
    expect(screen.getByText('Save failed')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEditUnsavedRecipient).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /^save$/i }));
    expect(onSaveUnsavedRecipient).toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole('button', { name: /choose a different recipient/i })
    );
    expect(onClearUnsavedRecipient).toHaveBeenCalled();
  });

  it('clears a LIMITED_DDA account when a recipient is selected', async () => {
    const limitedAccounts = [
      {
        id: 'acct-limited',
        label: 'Limited Account',
        state: 'OPEN',
        category: 'LIMITED_DDA',
        paymentRoutingInformation: { accountNumber: '555666777' },
        balance: {
          available: 5000,
          currency: 'USD',
          hasError: false,
          isLoading: false,
        },
      },
    ] as unknown as AccountResponse[];

    renderView(
      { accounts: limitedAccounts },
      {
        fromAccountId: 'acct-limited',
        payeeId: 'rec-eur-001',
        paymentMethod: 'ACH',
        amount: '50',
        targetCurrency: 'EUR',
        currency: 'USD',
      }
    );

    // A LIMITED_DDA account cannot pay external recipients, so it is cleared.
    expect(
      await screen.findByText(/the selected account cannot send this payment/i)
    ).toBeInTheDocument();

    // The account is listed as unavailable for external recipients.
    expect(
      screen.getByText(/not available for external recipients/i)
    ).toBeInTheDocument();
  });
});
