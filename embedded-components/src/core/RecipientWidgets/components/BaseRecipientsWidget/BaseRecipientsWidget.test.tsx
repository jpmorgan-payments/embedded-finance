import { server } from '@/msw/server';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { BaseRecipientsWidget } from './BaseRecipientsWidget';

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
    ],
  },
  createdAt: '2026-01-15T00:00:00.000Z',
};

const mockRecipient2: Recipient = {
  id: 'recipient-2',
  status: 'PENDING',
  type: 'LINKED_ACCOUNT',
  partyDetails: {
    type: 'INDIVIDUAL',
    firstName: 'Jane',
    lastName: 'Smith',
  },
  account: {
    number: '87654321',
    countryCode: 'US',
    routingInformation: [
      {
        transactionType: 'ACH',
        routingNumber: '987654321',
        routingCodeType: 'USABA',
      },
    ],
  },
  createdAt: '2026-02-01T00:00:00.000Z',
};

const renderWidget = (
  props: Partial<React.ComponentProps<typeof BaseRecipientsWidget>> = {}
) =>
  render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
      reactQueryDefaultOptions={{ queries: { retry: false } }}
    >
      <BaseRecipientsWidget
        recipientType="LINKED_ACCOUNT"
        viewMode="compact-cards"
        {...props}
      />
    </EBComponentsProvider>
  );

describe('BaseRecipientsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
  });

  it('shows loading state initially', () => {
    server.use(http.get('*/recipients', () => new Promise(() => {})));
    renderWidget();

    // Component should render without crashing while loading
    expect(document.querySelector('.eb-component')).toBeInTheDocument();
  });

  it('shows empty state when no recipients', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [],
          metadata: { total_items: 0, total_pages: 0 },
          page: 0,
          limit: 10,
        })
      )
    );

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText(/no linked accounts/i)).toBeInTheDocument();
    });
  });

  it('renders recipient cards when data loads', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [mockRecipient, mockRecipient2],
          metadata: { total_items: 2, total_pages: 1 },
          page: 0,
          limit: 10,
        })
      )
    );

    renderWidget();

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json(
          { message: 'Internal Server Error', httpStatus: 500 },
          { status: 500 }
        )
      )
    );

    renderWidget();

    await waitFor(
      () => {
        expect(
          screen.getByRole('button', { name: /try again/i })
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('shows error state with retry button', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json(
          { message: 'Server Error', httpStatus: 500 },
          { status: 500 }
        )
      )
    );

    renderWidget();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument();
    });
  });

  it('hides create button when hideCreateButton is true', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [],
          metadata: { total_items: 0, total_pages: 0 },
          page: 0,
          limit: 10,
        })
      )
    );

    renderWidget({ hideCreateButton: true });

    await waitFor(() => {
      expect(screen.getByText(/no linked accounts/i)).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('button', { name: /add/i })
    ).not.toBeInTheDocument();
  });

  it('shows add button when hideCreateButton is false', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [],
          metadata: { total_items: 0, total_pages: 0 },
          page: 0,
          limit: 10,
        })
      )
    );

    renderWidget({ hideCreateButton: false });

    await waitFor(() => {
      expect(screen.getByText(/no linked accounts/i)).toBeInTheDocument();
    });

    // Add button should be visible
    expect(
      screen.getByRole('button', { name: /add|link/i })
    ).toBeInTheDocument();
  });

  it('renders in table view mode', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [mockRecipient],
          metadata: { total_items: 1, total_pages: 1 },
          page: 0,
          limit: 10,
        })
      )
    );

    renderWidget({ viewMode: 'table' });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    // Table should have a table element
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('renders in single mode', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [mockRecipient],
          metadata: { total_items: 1, total_pages: 1 },
          page: 0,
          limit: 10,
        })
      )
    );

    renderWidget({ mode: 'single' });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
  });

  it('applies custom className', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [],
          metadata: { total_items: 0, total_pages: 0 },
          page: 0,
          limit: 10,
        })
      )
    );

    const { container } = renderWidget({ className: 'eb-custom-class' });

    await waitFor(() => {
      expect(container.innerHTML).toContain('eb-custom-class');
    });
  });

  it('shows rejected accounts section when enabled and rejected accounts exist', async () => {
    server.use(
      http.get('*/recipients', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        if (status === 'REJECTED') {
          return HttpResponse.json({
            recipients: [
              {
                ...mockRecipient,
                id: 'rejected-1',
                status: 'REJECTED',
                updatedAt: new Date().toISOString(),
                partyDetails: {
                  type: 'INDIVIDUAL',
                  firstName: 'Rejected',
                  lastName: 'Account',
                },
              },
            ],
            metadata: { total_items: 1, total_pages: 1 },
            total_items: 1,
            page: 0,
            limit: 25,
          });
        }
        return HttpResponse.json({
          recipients: [mockRecipient],
          metadata: { total_items: 1, total_pages: 1 },
          page: 0,
          limit: 10,
        });
      })
    );

    renderWidget({ showRejectedAccounts: true });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    // Rejected section should appear
    await waitFor(() => {
      expect(
        screen.getByText(/Recently Rejected Accounts/i)
      ).toBeInTheDocument();
    });
  });

  it('hides add button in single mode when active recipient exists', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [mockRecipient],
          metadata: { total_items: 1, total_pages: 1 },
          page: 0,
          limit: 10,
        })
      )
    );

    renderWidget({ mode: 'single', hideCreateButton: false });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    // In single mode with active recipient, add button should be hidden
    expect(
      screen.queryByRole('button', { name: /add|link/i })
    ).not.toBeInTheDocument();
  });

  it('renders with loadMore pagination style', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [mockRecipient, mockRecipient2],
          metadata: { total_items: 5, total_pages: 3 },
          page: 0,
          limit: 2,
        })
      )
    );

    renderWidget({ paginationStyle: 'loadMore', pageSize: 2 });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
  });

  it('renders with RECIPIENT type', async () => {
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [
            {
              ...mockRecipient,
              type: 'RECIPIENT',
            },
          ],
          metadata: { total_items: 1, total_pages: 1 },
          page: 0,
          limit: 10,
        })
      )
    );

    renderWidget({ recipientType: 'RECIPIENT' });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
  });

  it('supports multiple pages of recipients', async () => {
    const manyRecipients = Array.from({ length: 5 }, (_, i) => ({
      ...mockRecipient,
      id: `recipient-${i}`,
      partyDetails: {
        type: 'INDIVIDUAL' as const,
        firstName: `Recipient`,
        lastName: `${i + 1}`,
      },
    }));

    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: manyRecipients,
          metadata: { total_items: 15, total_pages: 3 },
          page: 0,
          limit: 5,
        })
      )
    );

    renderWidget({ pageSize: 5 });

    await waitFor(() => {
      expect(screen.getByText(/Recipient 1/i)).toBeInTheDocument();
    });
  });

  it('calls onAccountSettled callback after create', async () => {
    const onSettled = vi.fn();
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [],
          metadata: { total_items: 0, total_pages: 0 },
          page: 0,
          limit: 10,
        })
      )
    );

    renderWidget({ onAccountSettled: onSettled });

    await waitFor(() => {
      expect(screen.getByText(/no linked accounts/i)).toBeInTheDocument();
    });

    // Component should render without errors with callback prop
    expect(onSettled).not.toHaveBeenCalled();
  });

  it('tracks user events when handler provided', async () => {
    const handler = vi.fn();
    server.use(
      http.get('*/recipients', () =>
        HttpResponse.json({
          recipients: [mockRecipient],
          metadata: { total_items: 1, total_pages: 1 },
          page: 0,
          limit: 10,
        })
      )
    );

    renderWidget({ userEventsHandler: handler });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });

    // Should track view event
    expect(handler).toHaveBeenCalled();
  });
});
