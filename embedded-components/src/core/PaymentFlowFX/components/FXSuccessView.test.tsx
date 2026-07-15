import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type {
  TransactionGetResponseV3,
  TransactionResponseV3,
} from '@/api/generated/ep-transactions-v3.schemas';

import { FlowContextProvider } from '../../PaymentFlow/FlowContainer';
import type {
  AccountResponse,
  PaymentMethod,
} from '../../PaymentFlow/PaymentFlow.types';
import type { FXPayee, PaymentFlowFXFormData } from '../PaymentFlowFX.types';
import { FXSuccessView } from './FXSuccessView';

const formData = {
  amount: '100',
  currency: 'USD',
  targetCurrency: 'EUR',
  payeeId: 'p1',
  fromAccountId: 'a1',
  paymentMethod: 'ACH',
} as unknown as PaymentFlowFXFormData;

const payees = [
  { id: 'p1', name: 'Isabelle Moreau', accountNumber: '1234567890' },
] as unknown as FXPayee[];

const accounts = [
  {
    id: 'a1',
    label: 'Main Account',
    paymentRoutingInformation: { accountNumber: '9876543210' },
  },
] as unknown as AccountResponse[];

const paymentMethods = [
  { id: 'ACH', name: 'ACH Transfer' },
] as unknown as PaymentMethod[];

const transactionResponse = {
  id: 'txn-abc12345',
  transactionReferenceId: 'ref-1',
  status: 'PENDING',
} as unknown as TransactionResponseV3;

const enrichedDetails = {
  id: 'txn-abc12345',
  status: 'COMPLETED',
  targetAmount: '92.00',
  targetCurrency: 'EUR',
  fxInformation: { exchangeRate: '0.92' },
} as unknown as TransactionGetResponseV3;

function renderView(
  props: Partial<React.ComponentProps<typeof FXSuccessView>> = {}
) {
  const onClose = vi.fn();
  const onMakeAnotherPayment = vi.fn();
  render(
    <FlowContextProvider>
      <FXSuccessView
        transactionResponse={transactionResponse}
        formData={formData}
        payees={payees}
        accounts={accounts}
        paymentMethods={paymentMethods}
        onClose={onClose}
        onMakeAnotherPayment={onMakeAnotherPayment}
        {...props}
      />
    </FlowContextProvider>
  );
  return { onClose, onMakeAnotherPayment };
}

describe('FXSuccessView', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('renders the success heading and the initiated amount', () => {
    renderView();
    expect(screen.getByText(/payment sent/i)).toBeInTheDocument();
    expect(
      screen.getByText(/\$100\.00 has been initiated/i)
    ).toBeInTheDocument();
  });

  it('shows the "being converted" note for a non-USD target currency', () => {
    renderView();
    expect(screen.getByText(/being converted to eur/i)).toBeInTheDocument();
  });

  it('renders recipient, account and method rows', () => {
    renderView();
    expect(screen.getByText(/isabelle moreau/i)).toBeInTheDocument();
    expect(screen.getByText(/\(\.\.\.7890\)/)).toBeInTheDocument();
    expect(screen.getByText(/main account/i)).toBeInTheDocument();
    expect(screen.getByText(/ach transfer/i)).toBeInTheDocument();
  });

  it('renders settled FX details from enrichment', () => {
    renderView({ enrichedDetails });
    expect(screen.getByText(/recipient receives/i)).toBeInTheDocument();
    expect(screen.getByText(/€92\.00/)).toBeInTheDocument();
    expect(screen.getByText(/1 USD = 0\.92 EUR/)).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it('shows a loading indicator while enriching', () => {
    renderView({ isEnriching: true, enrichedDetails: undefined });
    expect(screen.getByText(/loading conversion details/i)).toBeInTheDocument();
  });

  it('copies the transaction reference on click', async () => {
    renderView();
    await userEvent.click(screen.getByRole('button', { name: /txn-abc1/i }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('txn-abc12345');
  });

  it('calls onClose when Done is clicked', async () => {
    const { onClose } = renderView();
    await userEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onMakeAnotherPayment when the reset button is clicked', async () => {
    const { onMakeAnotherPayment } = renderView();
    await userEvent.click(
      screen.getByRole('button', { name: /make another payment/i })
    );
    expect(onMakeAnotherPayment).toHaveBeenCalledOnce();
  });
});
