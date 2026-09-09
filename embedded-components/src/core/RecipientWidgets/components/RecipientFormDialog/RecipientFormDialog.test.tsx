import { server } from '@/msw/server';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';

import { Recipient } from '@/api/generated/ep-recipients.schemas';
import type { BankAccountFormConfig } from '@/core/RecipientWidgets/components/BankAccountForm';

import { RecipientFormDialog } from './RecipientFormDialog';

beforeEach(() => {
  server.use(
    http.get('*/clients/*', () =>
      HttpResponse.json({
        id: 'client-001',
        partyDetails: {
          type: 'ORGANIZATION',
          businessName: 'Test Business',
        },
      })
    )
  );
});

describe('RecipientFormDialog internationalMode', () => {
  it('does not show the account currency selector by default', () => {
    render(
      <RecipientFormDialog
        mode="create"
        open
        recipientType="RECIPIENT"
        i18nNamespace="recipients"
      />
    );

    expect(
      screen.queryByText(/recipient's account currency/i)
    ).not.toBeInTheDocument();
  });

  it('shows the account currency selector when internationalMode is enabled', () => {
    render(
      <RecipientFormDialog
        mode="create"
        open
        recipientType="RECIPIENT"
        i18nNamespace="recipients"
        internationalMode
        supportedCurrencies={['EUR', 'GBP']}
      />
    );

    expect(
      screen.getByText(/recipient's account currency/i)
    ).toBeInTheDocument();
    // Radix Select mirrors the value in a hidden <option>, so match the
    // visible combobox instead of getByText.
    expect(
      screen.getByRole('combobox', { name: /account currency/i })
    ).toHaveTextContent(/us dollar \(domestic\)/i);
  });

  it('does not show the currency selector for linked-account create', () => {
    render(
      <RecipientFormDialog
        mode="create"
        open
        recipientType="LINKED_ACCOUNT"
        i18nNamespace="linked-accounts"
        internationalMode
        supportedCurrencies={['EUR']}
      />
    );

    expect(
      screen.queryByText(/recipient's account currency/i)
    ).not.toBeInTheDocument();
  });

  it('does not show the currency selector in edit mode', () => {
    render(
      <RecipientFormDialog
        mode="edit"
        open
        recipientType="RECIPIENT"
        i18nNamespace="recipients"
        internationalMode
        supportedCurrencies={['EUR']}
        recipient={
          {
            id: 'rcp-1',
            type: 'RECIPIENT',
            status: 'ACTIVE',
            partyDetails: {
              type: 'ORGANIZATION',
              businessName: 'Acme',
            },
            account: {
              number: '1234567890',
              type: 'CHECKING',
              countryCode: 'US',
              currencyCode: 'USD',
              routingInformation: [
                {
                  routingNumber: '021000021',
                  transactionType: 'ACH',
                  routingCodeType: 'USABA',
                },
              ],
            },
          } as unknown as Recipient
        }
      />
    );

    expect(
      screen.queryByText(/recipient's account currency/i)
    ).not.toBeInTheDocument();
  });
});

describe('RecipientFormDialog linked-account payment methods', () => {
  it('submits every payment method selected through the widget create override', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onRecipientSettled = vi.fn();
    let capturedRequest: Record<string, unknown> | undefined;

    server.use(
      http.post('/recipients', async ({ request }) => {
        capturedRequest = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          id: 'linked-account-1',
          status: 'MICRODEPOSITS_INITIATED',
          ...capturedRequest,
        });
      })
    );

    render(
      <RecipientFormDialog
        mode="create"
        open
        recipientType="LINKED_ACCOUNT"
        i18nNamespace="linked-accounts"
        onRecipientSettled={onRecipientSettled}
        linkAccountBankFormConfigOverride={
          {
            paymentMethods: {
              available: ['ACH', 'WIRE', 'RTP'],
              allowMultiple: true,
              defaultSelected: ['ACH'],
            },
          } as unknown as Partial<BankAccountFormConfig>
        }
      />
    );

    await user.click(screen.getByRole('checkbox', { name: /Wire/i }));
    await user.click(
      screen.getByRole('checkbox', { name: /Real-Time Payments/i })
    );
    await user.type(screen.getByLabelText(/First Name/i), 'Test');
    await user.type(screen.getByLabelText(/Last Name/i), 'User');
    await user.type(screen.getByLabelText(/Account Number/i), '12345678');
    await user.type(
      screen.getByLabelText(/ACH \/ Wire \/ RTP Routing Number/i),
      '021000021'
    );
    await user.type(screen.getByLabelText(/Street Address/i), '1 Main St');
    await user.type(screen.getByLabelText(/^City/i), 'New York');
    await user.click(screen.getByRole('combobox', { name: /^State/i }));
    await user.click(await screen.findByRole('option', { name: 'New York' }));
    await user.type(screen.getByLabelText(/ZIP Code/i), '10001');
    await user.click(
      screen.getByRole('checkbox', { name: /I authorize verification/i })
    );
    await user.click(
      screen.getByRole('button', { name: /Confirm and Link Account/i })
    );

    await waitFor(() => expect(onRecipientSettled).toHaveBeenCalledTimes(1));
    expect(capturedRequest).toMatchObject({
      type: 'LINKED_ACCOUNT',
      account: {
        routingInformation: [
          {
            routingNumber: '021000021',
            transactionType: 'ACH',
          },
          {
            routingNumber: '021000021',
            transactionType: 'WIRE',
          },
          {
            routingNumber: '021000021',
            transactionType: 'RTP',
          },
        ],
      },
    });
  });
});
