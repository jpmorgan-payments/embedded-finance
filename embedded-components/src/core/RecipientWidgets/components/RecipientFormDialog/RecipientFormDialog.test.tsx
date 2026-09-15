import { server } from '@/msw/server';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor, within } from '@test-utils';

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
  const linkedAccount = {
    id: 'linked-account-1',
    type: 'LINKED_ACCOUNT',
    status: 'ACTIVE',
    clientId: 'client-1',
    partyId: 'party-1',
    partyDetails: {
      type: 'ORGANIZATION',
      businessName: 'Acme',
      address: {
        addressLine1: '1 Main Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        countryCode: 'US',
      },
    },
    account: {
      number: '1234567890',
      type: 'CHECKING',
      countryCode: 'US',
      routingInformation: [
        {
          routingNumber: '026009593',
          transactionType: 'WIRE',
          routingCodeType: 'USABA',
        },
        {
          routingNumber: '021000021',
          transactionType: 'ACH',
          routingCodeType: 'USABA',
        },
      ],
    },
  } as unknown as Recipient;

  it('confirms an ACH change before creating a replacement and deactivating the original', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const requests: string[] = [];
    const onRecipientSettled = vi.fn();
    let createPayload: Record<string, unknown> | undefined;

    server.use(
      http.post('/recipients', async ({ request }) => {
        requests.push('create');
        createPayload = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          ...linkedAccount,
          id: 'linked-account-2',
          status: 'MICRODEPOSITS_INITIATED',
          account: createPayload.account,
        });
      }),
      http.post('/recipients/:id', async ({ request, params }) => {
        requests.push(`deactivate:${String(params.id)}`);
        expect(await request.json()).toEqual({ status: 'INACTIVE' });
        return HttpResponse.json({
          ...linkedAccount,
          id: String(params.id),
          status: 'INACTIVE',
        });
      })
    );

    render(
      <RecipientFormDialog
        mode="edit"
        open
        recipientType="LINKED_ACCOUNT"
        i18nNamespace="linked-accounts"
        recipient={linkedAccount}
        onRecipientSettled={onRecipientSettled}
      />
    );

    const achRoutingNumber = screen.getByLabelText(/ACH Routing Number/i);
    const wireRoutingNumber = screen.getByLabelText(/Wire Routing Number/i);

    expect(achRoutingNumber).toHaveValue('021000021');
    expect(achRoutingNumber).not.toHaveAttribute('readonly');
    expect(achRoutingNumber.compareDocumentPosition(wireRoutingNumber)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );

    await user.clear(achRoutingNumber);
    await user.type(achRoutingNumber, '031000503');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    const confirmation = screen.getByRole('alertdialog');
    expect(
      within(confirmation).getByRole('heading', {
        name: 'Update linked account?',
      })
    ).toBeInTheDocument();
    expect(confirmation).toHaveTextContent(
      'Updating the ACH routing number will trigger re-verification of this account, including microdeposit verification if required.'
    );
    expect(requests).toEqual([]);

    await user.click(
      within(confirmation).getByRole('button', {
        name: 'Continue update',
      })
    );

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    await waitFor(() => expect(onRecipientSettled).toHaveBeenCalledTimes(1));
    expect(requests).toEqual(['create', 'deactivate:linked-account-1']);
    expect(createPayload).toMatchObject({
      type: 'LINKED_ACCOUNT',
      clientId: 'client-1',
      partyId: 'party-1',
      account: {
        routingInformation: [
          { transactionType: 'ACH', routingNumber: '031000503' },
          { transactionType: 'WIRE', routingNumber: '026009593' },
        ],
      },
    });
    expect(createPayload).not.toHaveProperty('partyDetails');
  });

  it('returns to the form and shows an error when replacement creation fails', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const amendRecipient = vi.fn();

    server.use(
      http.post('/recipients', () =>
        HttpResponse.json(
          { title: 'Unable to create replacement', httpStatus: 400 },
          { status: 400 }
        )
      ),
      http.post('/recipients/:id', () => {
        amendRecipient();
        return HttpResponse.json({});
      })
    );

    render(
      <RecipientFormDialog
        mode="edit"
        open
        recipientType="LINKED_ACCOUNT"
        i18nNamespace="linked-accounts"
        recipient={linkedAccount}
      />
    );

    const achRoutingNumber = screen.getByLabelText(/ACH Routing Number/i);
    await user.clear(achRoutingNumber);
    await user.type(achRoutingNumber, '031000503');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Continue update',
      })
    );

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(
      await screen.findByText('Unable to update account')
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/ACH Routing Number/i)).toHaveValue(
      '031000503'
    );
    expect(amendRecipient).not.toHaveBeenCalled();
  });

  it('uses the normal amend flow when ACH routing is unchanged', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const requests: string[] = [];

    server.use(
      http.post('/recipients', () => {
        requests.push('create');
        return HttpResponse.json({});
      }),
      http.post('/recipients/:id', async ({ request, params }) => {
        requests.push(`amend:${String(params.id)}`);
        return HttpResponse.json({
          ...linkedAccount,
          account: ((await request.json()) as Record<string, unknown>).account,
        });
      })
    );

    render(
      <RecipientFormDialog
        mode="edit"
        open
        recipientType="LINKED_ACCOUNT"
        i18nNamespace="linked-accounts"
        recipient={linkedAccount}
      />
    );

    const wireRoutingNumber = screen.getByLabelText(/Wire Routing Number/i);
    await user.clear(wireRoutingNumber);
    await user.type(wireRoutingNumber, '031000503');
    await user.click(screen.getByRole('button', { name: 'Save Changes' }));

    await waitFor(() => {
      expect(requests).toEqual(['amend:linked-account-1']);
    });
    expect(
      screen.queryByRole('heading', { name: 'Update linked account?' })
    ).not.toBeInTheDocument();
  });

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
