import { server } from '@/msw/server';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { FlowContextProvider } from '../FlowContainer/FlowContext';
import { BankAccountFormWrapper } from './BankAccountFormWrapper';

// Mock the client API
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
    ),
    http.post('*/recipients', () =>
      HttpResponse.json(
        {
          id: 'new-rec-001',
          status: 'ACTIVE',
          type: 'RECIPIENT',
          partyDetails: {
            type: 'INDIVIDUAL',
            firstName: 'John',
            lastName: 'Doe',
          },
          account: {
            number: '1234567890',
            routingInformation: [
              { routingNumber: '021000021', transactionType: 'ACH' },
            ],
          },
        },
        { status: 201 }
      )
    )
  );
});

function renderWrapper(
  props?: Partial<React.ComponentProps<typeof BankAccountFormWrapper>>
) {
  const defaultProps = {
    formType: 'recipient' as const,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  return render(
    <FlowContextProvider>
      <BankAccountFormWrapper {...defaultProps} {...props} />
    </FlowContextProvider>
  );
}

describe('BankAccountFormWrapper', () => {
  describe('recipient form type', () => {
    it('renders the bank account form', () => {
      renderWrapper({ formType: 'recipient' });

      // Should render the form (check for form elements)
      expect(
        document.querySelector('form') || document.querySelector('button')
      ).toBeTruthy();
    });

    it('shows cancel button', () => {
      renderWrapper({ formType: 'recipient' });

      expect(
        screen.getByRole('button', { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it('calls onCancel when cancel is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      renderWrapper({ formType: 'recipient', onCancel });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('shows switch to linked account option when onSwitchToLinkedAccount provided', () => {
      renderWrapper({
        formType: 'recipient',
        onSwitchToLinkedAccount: vi.fn(),
      });

      // Should show a link to switch
      expect(
        screen.queryByText(/link.*account/i) ||
          screen.queryByRole('button', { name: /link.*account/i })
      ).toBeTruthy();
    });
  });

  describe('linked-account form type', () => {
    it('renders the bank account form for linked accounts', () => {
      renderWrapper({ formType: 'linked-account' });

      expect(
        document.querySelector('form') || document.querySelector('button')
      ).toBeTruthy();
    });

    it('shows switch to recipient option when onSwitchToRecipient provided', () => {
      renderWrapper({
        formType: 'linked-account',
        onSwitchToRecipient: vi.fn(),
      });

      // Should show a link to switch
      expect(
        screen.queryByText(/recipient/i) ||
          screen.queryByRole('button', { name: /recipient/i })
      ).toBeTruthy();
    });
  });

  describe('one-time payment flow', () => {
    it('shows Continue button when onSubmitWithoutSave is provided', () => {
      renderWrapper({
        formType: 'recipient',
        onSubmitWithoutSave: vi.fn(),
      });

      expect(
        screen.getByRole('button', { name: /continue/i })
      ).toBeInTheDocument();
    });
  });

  describe('editing mode', () => {
    it('renders in editing mode with initial data', () => {
      const initialData = {
        displayName: 'Existing Recipient',
        accountNumber: '9876543210',
        routingNumber: '021000089',
        enabledPaymentMethods: ['ACH'] as const,
        transactionRecipient: {
          partyDetails: {
            type: 'INDIVIDUAL' as const,
            firstName: 'Jane',
            lastName: 'Smith',
          },
          account: {
            number: '9876543210',
            routingInformation: [
              {
                routingCodeType: 'USABA' as const,
                routingNumber: '021000089',
                transactionType: 'ACH',
              },
            ],
          },
        },
      };

      renderWrapper({
        formType: 'recipient',
        initialData: initialData as any,
        isEditing: true,
      });

      // Form should render in editing mode
      expect(
        document.querySelector('form') || document.querySelector('button')
      ).toBeTruthy();
    });
  });

  describe('with initial error', () => {
    it('renders with initial error state', () => {
      const initialData = {
        displayName: 'Error Recipient',
        accountNumber: '1111222233',
        routingNumber: '021000089',
        enabledPaymentMethods: ['ACH'] as const,
        originalFormData: {
          accountType: 'INDIVIDUAL',
          firstName: 'Error',
          lastName: 'User',
          accountNumber: '1111222233',
          bankAccountType: 'CHECKING',
          routingNumbers: [{ routingNumber: '021000089', paymentType: 'ACH' }],
        },
        transactionRecipient: {
          partyDetails: {
            type: 'INDIVIDUAL',
            firstName: 'Error',
            lastName: 'User',
          },
          account: {
            number: '1111222233',
            routingInformation: [
              {
                routingCodeType: 'USABA',
                routingNumber: '021000089',
                transactionType: 'ACH',
              },
            ],
          },
        },
      };

      const mockError = new Error('Something went wrong');

      renderWrapper({
        formType: 'recipient',
        initialData: initialData as any,
        isEditing: true,
        initialError: mockError,
        onSubmitWithoutSave: vi.fn(),
      });

      // Form renders even with error
      expect(
        document.querySelector('form') || document.querySelector('button')
      ).toBeTruthy();
    });
  });

  describe('international mode (FX)', () => {
    it('does not show the account currency selector by default', () => {
      renderWrapper({ formType: 'recipient' });

      expect(
        screen.queryByText(/recipient's account currency/i)
      ).not.toBeInTheDocument();
    });

    it('shows the account currency selector when internationalMode is enabled', () => {
      renderWrapper({
        formType: 'recipient',
        internationalMode: true,
        supportedCurrencies: ['EUR', 'GBP'],
      });

      expect(
        screen.getByText(/recipient's account currency/i)
      ).toBeInTheDocument();
      // Defaults to USD (domestic).
      expect(screen.getByText(/us dollar \(domestic\)/i)).toBeInTheDocument();
    });

    it('does not show the currency selector for linked-account form type', () => {
      renderWrapper({
        formType: 'linked-account',
        internationalMode: true,
        supportedCurrencies: ['EUR'],
      });

      expect(
        screen.queryByText(/recipient's account currency/i)
      ).not.toBeInTheDocument();
    });

    it('keeps the one-time Continue button while USD is selected', () => {
      renderWrapper({
        formType: 'recipient',
        internationalMode: true,
        supportedCurrencies: ['EUR'],
        onSubmitWithoutSave: vi.fn(),
      });

      // USD is the default, so the pay-without-saving path stays available.
      expect(
        screen.getByRole('button', { name: /continue/i })
      ).toBeInTheDocument();
    });
  });
});
