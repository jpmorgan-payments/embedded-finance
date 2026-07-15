import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, userEvent } from '@test-utils';

import {
  CurrencyAmountInput,
  FX_MEMO_MAX_LENGTH,
  type CurrencyAmountInputProps,
} from './CurrencyAmountInput';

function setup(overrides: Partial<CurrencyAmountInputProps> = {}) {
  const onAmountChange = vi.fn();
  const onMemoChange = vi.fn();
  const props: CurrencyAmountInputProps = {
    amount: '',
    memo: undefined,
    exceedsBalance: false,
    availableBalance: 1000,
    hasAmountError: false,
    onAmountChange,
    onMemoChange,
    isSubmitting: false,
    amountInputRef: createRef<HTMLInputElement>(),
    amountSectionRef: createRef<HTMLDivElement>(),
    ...overrides,
  };
  render(<CurrencyAmountInput {...props} />);
  return { onAmountChange, onMemoChange };
}

describe('CurrencyAmountInput', () => {
  it('renders the USD amount field and memo field', () => {
    setup();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByText('USD')).toBeInTheDocument();
    expect(screen.getByLabelText(/memo/i)).toBeInTheDocument();
  });

  it('calls onAmountChange as the user types digits', async () => {
    const { onAmountChange } = setup();
    await userEvent.type(screen.getByLabelText(/amount/i), '5');
    expect(onAmountChange).toHaveBeenCalledWith('5');
  });

  it('blocks non-numeric key presses', async () => {
    const { onAmountChange } = setup();
    await userEvent.type(screen.getByLabelText(/amount/i), 'a');
    expect(onAmountChange).not.toHaveBeenCalled();
  });

  it('shows the FX conversion line when a rate is provided', () => {
    setup({ amount: '100', targetCurrency: 'EUR', fxRate: 0.92 });
    expect(screen.getByText(/≈/)).toBeInTheDocument();
    expect(screen.getByText(/€92\.00/)).toBeInTheDocument();
  });

  it('marks the conversion line as indicative', () => {
    setup({
      amount: '100',
      targetCurrency: 'EUR',
      fxRate: 0.92,
      isIndicativeRate: true,
    });
    expect(screen.getByText(/indicative/i)).toBeInTheDocument();
  });

  it('does not show the FX conversion line for USD', () => {
    setup({ amount: '100', targetCurrency: 'USD', fxRate: 1 });
    expect(screen.queryByText(/≈/)).not.toBeInTheDocument();
  });

  it('shows the exceeds-balance error', () => {
    setup({ amount: '2000', exceedsBalance: true, availableBalance: 1000 });
    expect(screen.getByText(/exceeds available balance/i)).toBeInTheDocument();
  });

  it('shows the memo counter when near the limit', () => {
    setup({ memo: 'x'.repeat(125) });
    expect(screen.getByText(`125/${FX_MEMO_MAX_LENGTH}`)).toBeInTheDocument();
  });

  it('truncates memo input to the FX max length', () => {
    const { onMemoChange } = setup();
    fireEvent.change(screen.getByLabelText(/memo/i), {
      target: { value: 'z'.repeat(FX_MEMO_MAX_LENGTH + 50) },
    });
    const lastCall = onMemoChange.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toHaveLength(FX_MEMO_MAX_LENGTH);
  });

  it('disables inputs while submitting', () => {
    setup({ isSubmitting: true });
    expect(screen.getByLabelText(/amount/i)).toBeDisabled();
    expect(screen.getByLabelText(/memo/i)).toBeDisabled();
  });
});
