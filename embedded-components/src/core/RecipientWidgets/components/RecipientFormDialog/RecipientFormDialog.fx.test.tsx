/**
 * RecipientFormDialog — FR-FX-10 cross-border (FX) create wiring.
 *
 * The visibility of the "Recipient's account currency" selector across
 * mode / recipientType is covered in `RecipientFormDialog.test.tsx`. This
 * file focuses on the FX submit logic that has no other coverage:
 * - the canonical `routingCodeType` forwarded to {@link useRecipientForm}, and
 * - currency tagging of the settled recipient (`onRecipientSettled`).
 *
 * `useRecipientForm` is mocked so we can inspect the arguments it receives and
 * drive its `onSettled` callback directly (no full-form submit needed).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { getFxRoutingCodeType } from '@/core/PaymentFlowFX/fxRecipientRequirements';
import { useRecipientForm } from '@/core/RecipientWidgets/hooks';

import { RecipientFormDialog } from './RecipientFormDialog';

const settledRecipient = (id: string) =>
  ({ id, account: { number: '1234567890' } }) as unknown as Recipient;

vi.mock('@/core/RecipientWidgets/hooks', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/RecipientWidgets/hooks')>();
  return {
    ...actual,
    useRecipientForm: vi.fn(),
  };
});

const mockSubmit = vi.fn();
const mockReset = vi.fn();

/** Latest options object passed to the mocked `useRecipientForm`. */
function lastFormOptions() {
  const calls = vi.mocked(useRecipientForm).mock.calls;
  return calls[calls.length - 1]?.[0];
}

function renderFxDialog() {
  return render(
    <RecipientFormDialog
      mode="create"
      open
      recipientType="RECIPIENT"
      i18nNamespace="recipients"
      internationalMode
      supportedCurrencies={['EUR']}
      currencyLabels={{ EUR: 'Euro' }}
      onRecipientSettled={onRecipientSettled}
    />
  );
}

const onRecipientSettled = vi.fn();

async function selectEur(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('combobox', { name: /account currency/i }));
  await user.click(await screen.findByRole('option', { name: /EUR/i }));
}

describe('RecipientFormDialog — FX create wiring', () => {
  beforeEach(() => {
    vi.mocked(useRecipientForm).mockReturnValue({
      submit: mockSubmit,
      reset: mockReset,
      status: 'idle',
      data: undefined,
      error: null,
    } as unknown as ReturnType<typeof useRecipientForm>);
    onRecipientSettled.mockClear();
  });

  it('forwards no routingCodeType while USD (domestic) is selected', () => {
    renderFxDialog();
    expect(lastFormOptions()?.routingCodeType).toBeUndefined();
  });

  it('forwards the currency routing code type once a non-USD currency is picked', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderFxDialog();

    await selectEur(user);

    await waitFor(() => {
      expect(lastFormOptions()?.routingCodeType).toBe(
        getFxRoutingCodeType('EUR')
      );
    });
    // Sanity: the currency actually resolves to a real code (BIC for SEPA/IBAN).
    expect(getFxRoutingCodeType('EUR')).toBe('BIC');
  });

  it('tags the settled recipient with the selected currency', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderFxDialog();

    await selectEur(user);
    await waitFor(() => {
      expect(lastFormOptions()?.routingCodeType).toBe('BIC');
    });

    // Drive the form hook's settle callback as a successful create would.
    const onSettled = lastFormOptions()?.onSettled;
    onSettled?.(settledRecipient('rcp-1'), undefined);

    expect(onRecipientSettled).toHaveBeenCalledWith(
      expect.objectContaining({
        account: expect.objectContaining({ currencyCode: 'EUR' }),
      }),
      undefined
    );
  });

  it('does not tag currency for a domestic (USD) recipient', () => {
    renderFxDialog();

    const onSettled = lastFormOptions()?.onSettled;
    onSettled?.(settledRecipient('rcp-2'), undefined);

    const settled = onRecipientSettled.mock.calls[0]?.[0];
    expect(settled?.account?.currencyCode).toBeUndefined();
  });
});
