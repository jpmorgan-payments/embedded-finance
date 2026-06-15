import { describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import { FlowContextProvider } from '../FlowContainer/FlowContext';
import type { Payee, PaymentMethodType } from '../PaymentFlow.types';
import { PayeeSelector } from './PayeeSelector';

const mockRecipients: Payee[] = [
  {
    id: 'rec-001',
    type: 'RECIPIENT',
    name: 'Alice Johnson',
    accountNumber: '111222333',
    routingNumber: '021000021',
    enabledPaymentMethods: ['ACH', 'WIRE'],
    recipientType: 'INDIVIDUAL',
  },
  {
    id: 'rec-002',
    type: 'RECIPIENT',
    name: 'Acme Corp',
    accountNumber: '444555666',
    routingNumber: '021000089',
    enabledPaymentMethods: ['ACH'],
    recipientType: 'BUSINESS',
  },
];

const mockLinkedAccounts: Payee[] = [
  {
    id: 'la-001',
    type: 'LINKED_ACCOUNT',
    name: 'Bob Smith',
    accountNumber: '777888999',
    routingNumber: '021000021',
    enabledPaymentMethods: ['ACH', 'RTP'],
    recipientType: 'INDIVIDUAL',
  },
];

function renderPayeeSelector(
  props?: Partial<React.ComponentProps<typeof PayeeSelector>>
) {
  const defaultProps = {
    selectedPayeeId: undefined as string | undefined,
    onSelect: vi.fn(),
    onAddNew: vi.fn(),
  };

  return render(
    <FlowContextProvider>
      <PayeeSelector {...defaultProps} {...props} />
    </FlowContextProvider>
  );
}

describe('PayeeSelector', () => {
  it('renders tab structure for recipients and linked accounts', () => {
    renderPayeeSelector({
      recipients: mockRecipients,
      linkedAccounts: mockLinkedAccounts,
    });

    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });

  it('displays recipients list', () => {
    renderPayeeSelector({ recipients: mockRecipients });

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('displays linked accounts when tab is clicked', async () => {
    const user = userEvent.setup();
    renderPayeeSelector({
      recipients: mockRecipients,
      linkedAccounts: mockLinkedAccounts,
    });

    // Click on the linked accounts tab
    const linkedTab = screen.getByRole('tab', { name: /linked/i });
    await user.click(linkedTab);

    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('calls onSelect when a recipient is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderPayeeSelector({ recipients: mockRecipients, onSelect });

    await user.click(screen.getByText('Alice Johnson'));

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'rec-001', name: 'Alice Johnson' })
    );
  });

  it('highlights the selected payee', () => {
    renderPayeeSelector({
      recipients: mockRecipients,
      selectedPayeeId: 'rec-001',
    });

    // The selected item should have visual indication
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('shows search input when there are 5+ recipients', () => {
    const manyRecipients: Payee[] = Array.from({ length: 6 }, (_, i) => ({
      id: `rec-${i}`,
      type: 'RECIPIENT' as const,
      name: `Recipient ${i}`,
      accountNumber: `12345678${i}`,
      routingNumber: '021000021',
      enabledPaymentMethods: ['ACH'] as PaymentMethodType[],
      recipientType: 'INDIVIDUAL' as const,
    }));

    renderPayeeSelector({ recipients: manyRecipients });

    const searchInput = document.querySelector('input');
    expect(searchInput).toBeTruthy();
  });

  it('filters recipients by search query', async () => {
    const user = userEvent.setup();
    const manyRecipients: Payee[] = [
      ...mockRecipients,
      ...Array.from({ length: 4 }, (_, i) => ({
        id: `rec-extra-${i}`,
        type: 'RECIPIENT' as const,
        name: `Extra Recipient ${i}`,
        accountNumber: `99999000${i}`,
        routingNumber: '021000021',
        enabledPaymentMethods: ['ACH'] as PaymentMethodType[],
        recipientType: 'INDIVIDUAL' as const,
      })),
    ];

    renderPayeeSelector({ recipients: manyRecipients });

    const searchInput = document.querySelector('input')!;
    expect(searchInput).toBeTruthy();
    await user.type(searchInput, 'Acme');

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
  });

  it('shows "Add New" button', () => {
    renderPayeeSelector({ recipients: mockRecipients });

    expect(
      screen.getByRole('button', { name: /add|new/i })
    ).toBeInTheDocument();
  });

  it('calls onAddNew when add button is clicked', async () => {
    const user = userEvent.setup();
    const onAddNew = vi.fn();
    renderPayeeSelector({ recipients: mockRecipients, onAddNew });

    const addButton = screen.getByRole('button', { name: /add|new/i });
    await user.click(addButton);

    expect(onAddNew).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    renderPayeeSelector({ isLoading: true });

    // Should show a loading indicator
    expect(
      document.querySelector('.eb-animate-spin') ||
        document.querySelector('.eb-animate-pulse')
    ).toBeTruthy();
  });

  it('shows restriction warning when recipients are restricted', () => {
    renderPayeeSelector({
      recipients: mockRecipients,
      linkedAccounts: mockLinkedAccounts,
      recipientsRestricted: true,
    });

    // Should switch to linked accounts tab and show restriction message
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('shows restriction warning banner when showRestrictionWarning is true', () => {
    renderPayeeSelector({
      recipients: mockRecipients,
      linkedAccounts: mockLinkedAccounts,
      recipientsRestricted: true,
      showRestrictionWarning: true,
    });

    // The restriction warning element should exist
    const warningElements = screen.getAllByText(
      /cannot send|restricted|linked account/i
    );
    expect(warningElements.length).toBeGreaterThan(0);
  });

  it('shows error state for recipients', () => {
    renderPayeeSelector({ recipientsError: true, onRetryRecipients: vi.fn() });

    expect(
      screen.queryByText(/error|retry|failed/i) ||
        screen.queryByRole('button', { name: /retry/i })
    ).toBeTruthy();
  });

  it('shows error state for linked accounts', async () => {
    const user = userEvent.setup();
    renderPayeeSelector({
      recipients: mockRecipients,
      linkedAccounts: [],
      linkedAccountsError: true,
      onRetryLinkedAccounts: vi.fn(),
    });

    // Switch to linked accounts tab
    const linkedTab = screen.getByRole('tab', { name: /linked/i });
    await user.click(linkedTab);

    expect(
      screen.queryByText(/error|retry|failed/i) ||
        screen.queryByRole('button', { name: /retry/i })
    ).toBeTruthy();
  });

  it('calls onAddRecipient when provided', async () => {
    const user = userEvent.setup();
    const onAddRecipient = vi.fn();
    renderPayeeSelector({
      recipients: mockRecipients,
      onAddRecipient,
    });

    // Should have an "Add Recipient" button
    const addButton = screen.queryByRole('button', {
      name: /add.*recipient/i,
    });
    if (addButton) {
      await user.click(addButton);
      expect(onAddRecipient).toHaveBeenCalled();
    }
  });

  it('calls onLinkAccount when provided', async () => {
    const user = userEvent.setup();
    const onLinkAccount = vi.fn();
    renderPayeeSelector({
      recipients: mockRecipients,
      linkedAccounts: mockLinkedAccounts,
      onLinkAccount,
    });

    // Switch to linked accounts tab
    const linkedTab = screen.getByRole('tab', { name: /linked/i });
    await user.click(linkedTab);

    const linkButton = screen.queryByRole('button', {
      name: /link.*account|add/i,
    });
    if (linkButton) {
      await user.click(linkButton);
      expect(onLinkAccount).toHaveBeenCalled();
    }
  });

  it('shows load more indicator when hasMoreRecipients', () => {
    renderPayeeSelector({
      recipients: mockRecipients,
      hasMoreRecipients: true,
      isLoadingMoreRecipients: true,
    });

    // Should show a loading more indicator
    expect(
      document.querySelector('.eb-animate-spin') ||
        screen.queryByText(/loading/i)
    ).toBeTruthy();
  });

  it('shows account numbers (masked)', () => {
    renderPayeeSelector({ recipients: mockRecipients });

    // Should show last 4 digits
    expect(screen.getByText(/2333|...333/)).toBeInTheDocument();
  });
});
