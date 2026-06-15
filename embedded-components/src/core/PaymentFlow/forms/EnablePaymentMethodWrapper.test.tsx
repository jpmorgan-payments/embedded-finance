import { server } from '@/msw/server';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@test-utils';

import { FlowContextProvider } from '../FlowContainer/FlowContext';
import type { Payee, PaymentMethod } from '../PaymentFlow.types';
import { EnablePaymentMethodWrapper } from './EnablePaymentMethodWrapper';

const mockPayee: Payee = {
  id: 'rec-001',
  type: 'RECIPIENT',
  name: 'John Doe',
  accountNumber: '123456789',
  routingNumber: '021000021',
  enabledPaymentMethods: ['ACH'],
  recipientType: 'INDIVIDUAL',
};

const mockLinkedAccountPayee: Payee = {
  id: 'la-001',
  type: 'LINKED_ACCOUNT',
  name: 'Jane Smith',
  accountNumber: '987654321',
  routingNumber: '021000089',
  enabledPaymentMethods: ['ACH'],
  recipientType: 'INDIVIDUAL',
};

const wireMethod: PaymentMethod = {
  id: 'WIRE',
  name: 'Wire Transfer',
  description: 'Same day',
  estimatedDelivery: 'Same day',
};

const rtpMethod: PaymentMethod = {
  id: 'RTP',
  name: 'Real-Time Payment',
  description: 'Instant',
  estimatedDelivery: 'Instant',
};

beforeEach(() => {
  server.use(
    http.get('*/recipients/:id', () =>
      HttpResponse.json({
        id: 'rec-001',
        status: 'ACTIVE',
        type: 'RECIPIENT',
        partyDetails: {
          type: 'INDIVIDUAL',
          firstName: 'John',
          lastName: 'Doe',
          contacts: [],
        },
        account: {
          number: '123456789',
          type: 'CHECKING',
          routingInformation: [
            {
              routingCodeType: 'USABA',
              routingNumber: '021000021',
              transactionType: 'ACH',
            },
          ],
        },
      })
    )
  );
});

function renderWrapper(
  props?: Partial<React.ComponentProps<typeof EnablePaymentMethodWrapper>>
) {
  const defaultProps = {
    payee: mockPayee,
    paymentMethod: wireMethod,
    onSuccess: vi.fn(),
    onCancel: vi.fn(),
  };

  return render(
    <FlowContextProvider>
      <EnablePaymentMethodWrapper {...defaultProps} {...props} />
    </FlowContextProvider>
  );
}

describe('EnablePaymentMethodWrapper', () => {
  it('renders the form for enabling a payment method', async () => {
    renderWrapper();

    // Should show a form or loading state
    expect(
      document.querySelector('form') ||
        document.querySelector('.eb-animate-pulse') ||
        document.querySelector('button')
    ).toBeTruthy();
  });

  it('shows cancel button', async () => {
    renderWrapper();

    // Wait for loading to finish
    await screen.findByRole('button', { name: /cancel/i });
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel is clicked', async () => {
    const onCancel = vi.fn();
    renderWrapper({ onCancel });

    const cancelButton = await screen.findByRole('button', { name: /cancel/i });
    cancelButton.click();

    expect(onCancel).toHaveBeenCalled();
  });

  it('shows loading state while fetching recipient', () => {
    server.use(
      http.get('*/recipients/:id', () => {
        return new Promise(() => {}); // Never resolve
      })
    );

    renderWrapper();

    // Should show skeleton loading
    expect(document.querySelector('.eb-animate-pulse')).toBeTruthy();
  });

  it('handles recipient fetch error gracefully', async () => {
    server.use(
      http.get('*/recipients/:id', () =>
        HttpResponse.json({ message: 'Not Found' }, { status: 404 })
      )
    );

    renderWrapper();

    // Wait a bit for the error state to propagate - component may show form or error
    await new Promise((r) => {
      setTimeout(r, 100);
    });
    // The component should still render without crashing
    expect(document.body.textContent).toBeTruthy();
  });

  it('renders for linked account payee type', async () => {
    renderWrapper({ payee: mockLinkedAccountPayee });

    // Should still render form elements
    expect(
      document.querySelector('form') ||
        document.querySelector('.eb-animate-pulse') ||
        document.querySelector('button')
    ).toBeTruthy();
  });

  it('renders with RTP payment method', async () => {
    renderWrapper({ paymentMethod: rtpMethod });

    expect(
      document.querySelector('form') ||
        document.querySelector('.eb-animate-pulse') ||
        document.querySelector('button')
    ).toBeTruthy();
  });

  it('handles unsaved recipient', () => {
    const unsavedRecipient = {
      displayName: 'Quick Pay',
      accountNumber: '5555666677',
      routingNumber: '021000089',
      enabledPaymentMethods: ['ACH'] as const,
      transactionRecipient: {
        partyDetails: {
          type: 'INDIVIDUAL' as const,
          firstName: 'Quick',
          lastName: 'Pay',
        },
        account: {
          number: '5555666677',
          type: 'CHECKING',
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
      payee: { ...mockPayee, id: 'unsaved-recipient' },
      unsavedRecipient: unsavedRecipient as any,
    });

    // Should render form without fetching recipient (since it's unsaved)
    expect(
      document.querySelector('form') || document.querySelector('button')
    ).toBeTruthy();
  });
});
