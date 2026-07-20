import { describe, expect, it } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';

import { RecipientDetailsDialog } from './RecipientDetailsDialog';

const gbpRecipient: Recipient = {
  id: 'rcp-gbp-1',
  type: 'RECIPIENT',
  status: 'ACTIVE',
  partyDetails: {
    type: 'ORGANIZATION',
    businessName: 'Thames Trading Ltd',
  },
  account: {
    number: 'GB82WEST12345698765432',
    type: 'CHECKING',
    countryCode: 'GB',
    currencyCode: 'GBP',
    routingInformation: [
      {
        routingNumber: 'NWBKGB2L',
        transactionType: 'ACH',
        routingCodeType: 'BIC',
      },
      {
        routingNumber: 'NWBKGB2L',
        transactionType: 'WIRE',
        routingCodeType: 'BIC',
      },
    ],
  },
};

const usdRecipient: Recipient = {
  id: 'rcp-usd-1',
  type: 'RECIPIENT',
  status: 'ACTIVE',
  partyDetails: {
    type: 'ORGANIZATION',
    businessName: 'Acme Corp',
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
};

describe('RecipientDetailsDialog FX labels', () => {
  it('shows FX rail tiers and currency-specific bank id for GBP recipients', async () => {
    const user = userEvent.setup();
    render(
      <RecipientDetailsDialog recipient={gbpRecipient} showRecipientCurrency>
        <button type="button">Open details</button>
      </RecipientDetailsDialog>
    );

    await user.click(screen.getByRole('button', { name: 'Open details' }));

    expect(await screen.findByText('FX Low-value')).toBeInTheDocument();
    expect(screen.getByText('FX High-value')).toBeInTheDocument();
    expect(screen.getAllByText(/Sort code \(or BIC\)/i).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByText('NWBKGB2L').length).toBeGreaterThan(0);
    expect(screen.queryByText('Wire Transfer')).not.toBeInTheDocument();
    expect(screen.queryByText('Routing Number')).not.toBeInTheDocument();
    // GBP does not use US checking/savings — account type is hidden.
    expect(screen.queryByText('CHECKING')).not.toBeInTheDocument();
    expect(screen.getByText('IBAN')).toBeInTheDocument();
  });

  it('keeps domestic ACH / Routing Number copy for USD recipients', async () => {
    const user = userEvent.setup();
    render(
      <RecipientDetailsDialog recipient={usdRecipient}>
        <button type="button">Open details</button>
      </RecipientDetailsDialog>
    );

    await user.click(screen.getByRole('button', { name: 'Open details' }));

    expect(await screen.findByText('ACH')).toBeInTheDocument();
    expect(screen.getByText('Routing Number')).toBeInTheDocument();
    expect(screen.getByText('021000021')).toBeInTheDocument();
    expect(screen.queryByText('FX Low-value')).not.toBeInTheDocument();
  });
});
