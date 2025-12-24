import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as rtlRender } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { render, screen } from '@test-utils';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { LinkedAccountWidget } from './LinkedAccountWidget';

function mockRecipientsResponse(body: any, opts?: { delayMs?: number }) {
  server.use(
    http.get('/recipients', async () => {
      if (opts?.delayMs) {
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), opts.delayMs);
        });
      }
      return HttpResponse.json(body);
    })
  );
}

describe.skip('LinkedAccountWidget component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header', async () => {
    mockRecipientsResponse({ recipients: [] });
    render(<LinkedAccountWidget />);
    expect(await screen.findByText('Linked Accounts')).toBeInTheDocument();
  });

  it('shows loading state while fetching', async () => {
    mockRecipientsResponse({ recipients: [] }, { delayMs: 250 });
    render(<LinkedAccountWidget />);
    expect(
      await screen.findByText(/loading linked accounts/i)
    ).toBeInTheDocument();
  });

  it('renders empty state when no accounts', async () => {
    mockRecipientsResponse({ recipients: [] });
    render(<LinkedAccountWidget />);
    expect(
      await screen.findByText(/no linked accounts found/i)
    ).toBeInTheDocument();
  });

  it('renders recipients and badges on success', async () => {
    mockRecipientsResponse({
      recipients: [
        {
          id: 'r1',
          status: 'ACTIVE',
          partyDetails: { type: 'INDIVIDUAL', firstName: 'Ada', lastName: 'L' },
          account: {
            number: '00001234',
            routingInformation: [
              { transactionType: 'ACH' },
              { transactionType: 'WIRE' },
            ],
          },
          createdAt: new Date().toISOString(),
        },
      ],
    });
    render(<LinkedAccountWidget />);

    // Card content
    expect(await screen.findByText(/individual/i)).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.getByText(/ach/i)).toBeInTheDocument();
    expect(screen.getByText(/wire/i)).toBeInTheDocument();
  });

  it('shows error state on API error', async () => {
    server.use(
      http.get('/recipients', () =>
        HttpResponse.json({ message: 'Boom' }, { status: 500 })
      )
    );
    // Use a QueryClient with retries disabled (matches RecipientForm pattern)
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    rtlRender(
      <EBComponentsProvider apiBaseUrl="/" headers={{}}>
        <QueryClientProvider client={queryClient}>
          <LinkedAccountWidget />
        </QueryClientProvider>
      </EBComponentsProvider>
    );

    expect(await screen.findByText(/error:/i)).toBeInTheDocument();
  });

  it('opens link account dialog and validates form', async () => {
    mockRecipientsResponse({ recipients: [] });
    // Mock create recipient
    server.use(
      http.post('/recipients', async ({ request }) => {
        const body = (await request.json()) as any;
        // basic echo with status
        return HttpResponse.json({
          id: 'r2',
          status: 'MICRODEPOSITS_INITIATED',
          ...body,
        });
      })
    );

    render(<LinkedAccountWidget />);

    const user = userEvent.setup();
    // Open dialog
    await user.click(
      await screen.findByRole('button', { name: /link a new account/i })
    );

    // Submit empty to trigger validation summary
    await user.click(screen.getByRole('button', { name: /link account/i }));

    // Expect error summary in dialog
    expect(await screen.findByText(/form errors:/i)).toBeInTheDocument();

    // Fill minimal required fields for INDIVIDUAL
    await user.type(screen.getByLabelText(/first name/i), 'Grace');
    await user.type(screen.getByLabelText(/last name/i), 'H');
    await user.type(screen.getByLabelText(/routing number/i), '123456789');
    await user.type(screen.getByLabelText(/account number/i), '99999999');
    await user.click(screen.getByLabelText(/i authorize verification/i));

    await user.click(screen.getByRole('button', { name: /link account/i }));

    // Success state description should mention microdeposits initiated
    expect(
      await screen.findByText(/we initiated microdeposits/i)
    ).toBeInTheDocument();
  });

  it('shows Verify microdeposits button for READY_FOR_VALIDATION', async () => {
    mockRecipientsResponse({
      recipients: [
        {
          id: 'r3',
          status: 'READY_FOR_VALIDATION',
          partyDetails: { type: 'INDIVIDUAL', firstName: 'Lin', lastName: 'Q' },
          account: {
            number: '00001234',
            routingInformation: [{ transactionType: 'ACH' }],
          },
          createdAt: new Date().toISOString(),
        },
      ],
    });
    render(<LinkedAccountWidget />);

    expect(
      await screen.findByRole('button', { name: /verify microdeposits/i })
    ).toBeInTheDocument();
  });

  it('renders makePaymentComponent only for ACTIVE recipients', async () => {
    mockRecipientsResponse({
      recipients: [
        {
          id: 'r4',
          status: 'ACTIVE',
          partyDetails: { type: 'INDIVIDUAL', firstName: 'A', lastName: 'B' },
          account: {
            number: '00001234',
            routingInformation: [{ transactionType: 'ACH' }],
          },
        },
      ],
    });
    render(
      <LinkedAccountWidget
        renderPaymentAction={() => <button type="button">Pay</button>}
      />
    );

    expect(
      await screen.findByRole('button', { name: 'Pay' })
    ).toBeInTheDocument();
  });

  it('hides create button in singleAccount variant when an ACTIVE exists', async () => {
    mockRecipientsResponse({
      recipients: [
        {
          id: 'r5',
          status: 'ACTIVE',
          partyDetails: { type: 'INDIVIDUAL', firstName: 'X', lastName: 'Y' },
          account: {
            number: '00001234',
            routingInformation: [{ transactionType: 'ACH' }],
          },
        },
      ],
    });
    render(<LinkedAccountWidget mode="single" />);

    // Ensure button is not shown
    const linkButtons = screen.queryAllByRole('button', {
      name: /link a new account/i,
    });
    expect(linkButtons.length).toBe(0);
  });
});
