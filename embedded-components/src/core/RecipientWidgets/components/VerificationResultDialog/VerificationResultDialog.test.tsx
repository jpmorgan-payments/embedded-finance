import { describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { Recipient } from '@/api/generated/ep-recipients.schemas';

import { VerificationResultDialog } from './VerificationResultDialog';

const mockRecipient: Recipient = {
  id: '123',
  status: 'ACTIVE',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'John',
    lastName: 'Doe',
  },
  account: {
    number: '****1234',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '021000021',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('VerificationResultDialog', () => {
  describe('success variant', () => {
    test('renders correctly when open', () => {
      render(
        <VerificationResultDialog
          open
          onOpenChange={vi.fn()}
          recipient={mockRecipient}
          variant="success"
        />
      );

      expect(
        screen.getByText('Account Verified Successfully')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/account is now ready for transactions/i)
      ).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /close/i }).length).toBe(2);
    });

    test('displays success icon', () => {
      render(
        <VerificationResultDialog
          open
          onOpenChange={vi.fn()}
          recipient={mockRecipient}
          variant="success"
        />
      );

      const iconContainer = document.querySelector('[class*="eb-bg-success"]');
      expect(iconContainer).toBeInTheDocument();
    });

    test('calls onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <VerificationResultDialog
          open
          onOpenChange={onOpenChange}
          recipient={mockRecipient}
          variant="success"
        />
      );

      const [primaryClose] = screen.getAllByRole('button', { name: /close/i });
      await user.click(primaryClose);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('maxAttemptsExceeded variant', () => {
    test('renders correctly when open', () => {
      render(
        <VerificationResultDialog
          open
          onOpenChange={vi.fn()}
          recipient={mockRecipient}
          variant="maxAttemptsExceeded"
        />
      );

      expect(
        screen.getByText('Account Verification Failed')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/link it again to restart the verification process/i)
      ).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /close/i }).length).toBe(2);
    });

    test('displays error icon', () => {
      render(
        <VerificationResultDialog
          open
          onOpenChange={vi.fn()}
          recipient={mockRecipient}
          variant="maxAttemptsExceeded"
        />
      );

      const iconContainer = document.querySelector(
        '[class*="eb-bg-destructive"]'
      );
      expect(iconContainer).toBeInTheDocument();
    });

    test('calls onOpenChange when close button is clicked', async () => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();

      render(
        <VerificationResultDialog
          open
          onOpenChange={onOpenChange}
          recipient={mockRecipient}
          variant="maxAttemptsExceeded"
        />
      );

      const [primaryClose] = screen.getAllByRole('button', { name: /close/i });
      await user.click(primaryClose);

      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('common behavior', () => {
    test('does not render when closed', () => {
      render(
        <VerificationResultDialog
          open={false}
          onOpenChange={vi.fn()}
          recipient={mockRecipient}
          variant="success"
        />
      );

      expect(
        screen.queryByText('Account Verified Successfully')
      ).not.toBeInTheDocument();
    });

    test('handles missing recipient gracefully', () => {
      render(
        <VerificationResultDialog
          open
          onOpenChange={vi.fn()}
          recipient={undefined}
          variant="success"
        />
      );

      expect(
        screen.getByText('Account Verified Successfully')
      ).toBeInTheDocument();
    });
  });
});
