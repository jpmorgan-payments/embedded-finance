import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

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

describe.skip('VerificationResultDialog', () => {
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
        screen.getByText(/John Doe has been successfully verified/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /close/i })
      ).toBeInTheDocument();
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

      // Check for the success icon by looking for the styled container
      const iconContainer = document.querySelector('.eb-bg-success\\/10');
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

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

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
        screen.getByText(/John Doe has been rejected/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /close/i })
      ).toBeInTheDocument();
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

      // Check for the error icon by looking for the styled container
      const iconContainer = document.querySelector('.eb-bg-destructive\\/10');
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

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

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
