import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { clientMaintenanceApi } from '@/components/client-maintenance/client-maintenance-api';
import { createClientMaintenanceHandlers } from '@/components/client-maintenance/mocks/create-client-maintenance-handlers';
import { API_URL } from '@/data/constants';

import { ClientMaintenanceWorkspace } from './ClientMaintenanceWorkspace';

const server = setupServer(...createClientMaintenanceHandlers(API_URL));

function renderWorkspace() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ClientMaintenanceWorkspace />
    </QueryClientProvider>
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(async () => {
  server.resetHandlers();
  await clientMaintenanceApi.reset();
});
afterAll(() => server.close());

describe('ClientMaintenanceWorkspace', () => {
  it('reviews one draft request and completes the asynchronous lifecycle', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await screen.findByRole('heading', {
      level: 1,
      name: 'Marketplace Vendor LLC',
    });
    expect(
      screen.getByRole('link', { name: /Official update-party guide/ })
    ).toHaveAttribute(
      'href',
      'https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/update-party'
    );
    const apiSequence = screen
      .getByRole('heading', { name: 'Commerce API sequence' })
      .closest('section');
    const apiCalls = within(apiSequence!).getByRole('list');
    expect(apiCalls).toHaveClass('grid');
    expect(apiCalls).not.toHaveClass('overflow-x-auto');
    await user.click(
      screen.getByRole('button', { name: 'Review proposed changes' })
    );

    expect(
      screen.getByRole('heading', { name: 'Approved and proposed details' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByText('Marketplace Vendor Collective')
    ).not.toHaveLength(0);
    expect(screen.getAllByText('Diaz')).not.toHaveLength(0);
    expect(
      screen.getAllByText('Maintenance request 4000001049').length
    ).toBeGreaterThan(0);

    await user.click(
      screen.getByRole('button', { name: 'Continue to attestation' })
    );
    await user.click(
      screen.getByRole('checkbox', {
        name: /I have read the certification/,
      })
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Attest and submit for verification',
      })
    );

    expect(
      await screen.findByRole('heading', { name: 'Submitted for review' })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/202 Accepted/)).toHaveLength(2);

    await waitFor(() =>
      expect(screen.getByText('Review In Progress')).toBeInTheDocument()
    );
    const demoControls = screen.getByRole('complementary', {
      name: 'Asynchronous review',
    });
    await user.click(
      within(demoControls).getByRole('button', {
        name: 'Approve maintenance',
      })
    );

    expect(
      await screen.findByRole('heading', { name: 'Maintenance approved' })
    ).toBeInTheDocument();
  });

  it('creates a new sparse proposal from the edit drawer', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await screen.findByRole('heading', {
      level: 1,
      name: 'Marketplace Vendor LLC',
    });
    await user.click(screen.getByRole('button', { name: 'Edit Alex Smith' }));
    const drawer = screen.getByRole('dialog', { name: 'Edit person' });
    const lastName = within(drawer).getByLabelText('Last name');
    await user.clear(lastName);
    await user.type(lastName, 'Johnson');
    await user.click(
      within(drawer).getByRole('button', { name: 'Save proposed update' })
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Approved and proposed details',
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Johnson').length).toBeGreaterThan(0);
  });

  it('compares field, profile, and request-oriented review options', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await screen.findByRole('heading', {
      level: 1,
      name: 'Marketplace Vendor LLC',
    });
    await user.click(
      screen.getByRole('button', { name: 'Review proposed changes' })
    );

    const reviewNote = screen.getByRole('note');
    expect(reviewNote).toHaveTextContent(
      'Best for: Fast, precise validation of every changed value.'
    );
    expect(reviewNote).toHaveTextContent(
      'Trade-off: Unchanged profile context stays out of view.'
    );

    await user.click(screen.getByRole('tab', { name: 'Profiles' }));
    expect(
      screen.getByRole('heading', { name: 'Complete profile comparison' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Approved profile' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Proposed profile' })
    ).toBeInTheDocument();
    expect(reviewNote).toHaveTextContent(
      'Trade-off: Repeats unchanged data and becomes longer on mobile.'
    );

    await user.click(screen.getByRole('tab', { name: 'Request' }));
    expect(
      screen.getByRole('heading', {
        name: 'Maintenance request 4000001049',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'This request groups all 4 draft changes across 2 parties.'
      )
    ).toBeInTheDocument();
    expect(reviewNote).toHaveTextContent(
      'Trade-off: Reviewers must expand a party before seeing every value.'
    );
  });
});
