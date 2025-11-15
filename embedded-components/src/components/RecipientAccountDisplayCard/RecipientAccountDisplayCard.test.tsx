import { describe, expect, it } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { Recipient } from '@/api/generated/ep-recipients.schemas';

import { RecipientAccountDisplayCard } from './RecipientAccountDisplayCard';

const mockRecipient: Recipient = {
  id: 'recipient-1',
  status: 'ACTIVE',
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
      {
        transactionType: 'WIRE',
        routingNumber: '987654321',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: new Date().toISOString(),
};

describe.skip('RecipientAccountDisplayCard', () => {
  it('should render recipient name and status', () => {
    render(<RecipientAccountDisplayCard recipient={mockRecipient} />);

    expect(screen.getByText(/john doe/i)).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
  });

  it('should render account holder type', () => {
    render(<RecipientAccountDisplayCard recipient={mockRecipient} />);

    expect(screen.getByText(/individual/i)).toBeInTheDocument();
  });

  it('should render masked account number by default', () => {
    render(<RecipientAccountDisplayCard recipient={mockRecipient} />);

    expect(screen.getByText(/•••• 5678/i)).toBeInTheDocument();
  });

  it('should toggle account number visibility', async () => {
    const user = userEvent.setup();
    render(<RecipientAccountDisplayCard recipient={mockRecipient} />);

    // Initially masked
    expect(screen.getByText(/•••• 5678/i)).toBeInTheDocument();

    // Click toggle button
    const toggleButton = screen.getByRole('button', {
      name: /show full account/i,
    });
    await user.click(toggleButton);

    // Should show full number
    expect(screen.getByText('12345678')).toBeInTheDocument();

    // Click again to hide
    const hideButton = screen.getByRole('button', { name: /hide account/i });
    await user.click(hideButton);

    // Should be masked again
    expect(screen.getByText(/•••• 5678/i)).toBeInTheDocument();
  });

  it('should hide account toggle when showAccountToggle is false', () => {
    render(
      <RecipientAccountDisplayCard
        recipient={mockRecipient}
        showAccountToggle={false}
      />
    );

    expect(
      screen.queryByRole('button', { name: /show full account/i })
    ).not.toBeInTheDocument();
  });

  it('should render payment methods', () => {
    render(<RecipientAccountDisplayCard recipient={mockRecipient} />);

    expect(screen.getByText(/ach/i)).toBeInTheDocument();
    expect(screen.getByText(/wire/i)).toBeInTheDocument();
  });

  it('should hide payment methods when showPaymentMethods is false', () => {
    render(
      <RecipientAccountDisplayCard
        recipient={mockRecipient}
        showPaymentMethods={false}
      />
    );

    expect(screen.queryByText(/payment methods/i)).not.toBeInTheDocument();
  });

  it('should toggle detailed payment method info', async () => {
    const user = userEvent.setup();
    render(<RecipientAccountDisplayCard recipient={mockRecipient} />);

    // Click expand button
    const expandButton = screen.getByRole('button', { name: /view routing/i });
    await user.click(expandButton);

    // Should show routing numbers
    expect(screen.getByText('123456789')).toBeInTheDocument();
    expect(screen.getByText('987654321')).toBeInTheDocument();
  });

  it('should render header content when provided', () => {
    const headerContent = <div>Success Message</div>;

    render(
      <RecipientAccountDisplayCard
        recipient={mockRecipient}
        headerContent={headerContent}
      />
    );

    expect(screen.getByText('Success Message')).toBeInTheDocument();
  });

  it('should render status alert when provided', () => {
    const statusAlert = <div role="alert">Needs verification</div>;

    render(
      <RecipientAccountDisplayCard
        recipient={mockRecipient}
        statusAlert={statusAlert}
      />
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Needs verification')).toBeInTheDocument();
  });

  it('should render actions content when provided', () => {
    const actionsContent = <button type="button">Make Payment</button>;

    render(
      <RecipientAccountDisplayCard
        recipient={mockRecipient}
        actionsContent={actionsContent}
      />
    );

    expect(
      screen.getByRole('button', { name: /make payment/i })
    ).toBeInTheDocument();
  });

  it('should render add routing button when callback provided', () => {
    const renderAddRoutingButton = (isExpanded: boolean) => (
      <button type="button">
        {isExpanded ? 'Expanded Button' : 'Add Routing'}
      </button>
    );

    render(
      <RecipientAccountDisplayCard
        recipient={mockRecipient}
        renderAddRoutingButton={renderAddRoutingButton}
      />
    );

    expect(screen.getByText(/add routing/i)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <RecipientAccountDisplayCard
        recipient={mockRecipient}
        className="eb-custom-class"
      />
    );

    const card = container.querySelector('.eb-custom-class');
    expect(card).toBeInTheDocument();
  });

  it('should have accessible labels', () => {
    render(<RecipientAccountDisplayCard recipient={mockRecipient} />);

    expect(
      screen.getByRole('article', { name: /account: john doe/i })
    ).toBeInTheDocument();
  });
});
