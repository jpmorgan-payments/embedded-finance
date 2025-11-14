import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import { Recipient } from '@/api/generated/ep-recipients.schemas';

import { AccountConfirmation } from './AccountConfirmation';

const mockRecipient: Recipient = {
  id: 'recipient-1',
  status: 'MICRODEPOSITS_INITIATED',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'John',
    lastName: 'Doe',
  },
  account: {
    number: '12345678',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '123456789',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

describe('AccountConfirmation', () => {
  it('should render account details', () => {
    render(<AccountConfirmation recipient={mockRecipient} />);

    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/•••• 5678/i)).toBeInTheDocument();
  });

  it('should render done button', () => {
    render(<AccountConfirmation recipient={mockRecipient} />);

    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
  });

  it('should display recipient status', () => {
    render(<AccountConfirmation recipient={mockRecipient} />);

    expect(screen.getByText(/microdeposits initiated/i)).toBeInTheDocument();
  });

  it('should use AccountDisplayCard component', () => {
    const { container } = render(
      <AccountConfirmation recipient={mockRecipient} />
    );

    // Should have the card structure from AccountDisplayCard
    expect(container.querySelector('[role="article"]')).toBeInTheDocument();
  });
});
