import { server } from '@/msw/server';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { Recipient } from '@/api/generated/ep-recipients.schemas';

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
