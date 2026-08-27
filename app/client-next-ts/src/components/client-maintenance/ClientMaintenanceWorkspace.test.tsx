import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
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

async function loadCompleteStory(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Load complete story' }));
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: 'Review proposed changes' })
    ).toBeEnabled()
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(async () => {
  server.resetHandlers();
  await clientMaintenanceApi.reset();
});
afterAll(() => server.close());

describe('ClientMaintenanceWorkspace', () => {
  it('treats a maintenance-list 404 as an empty workspace', async () => {
    server.use(
      http.get(
        `${API_URL}/onboarding/v1/maintenance-requests`,
        () => new HttpResponse(null, { status: 404 })
      )
    );

    renderWorkspace();

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Marketplace Vendor LLC',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Could not load the maintenance workspace')
    ).not.toBeInTheDocument();
    expect(screen.getByText('0 proposed changes')).toBeInTheDocument();
  });

  it('keeps a client 404 as a retryable workspace error', async () => {
    server.use(
      http.get(
        `${API_URL}/onboarding/v1/clients/:clientId`,
        () => new HttpResponse(null, { status: 404 })
      )
    );

    renderWorkspace();

    expect(
      await screen.findByText('Could not load the maintenance workspace')
    ).toBeInTheDocument();
    expect(screen.getByText('Request failed with status 404')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });

  it('offers a guided path through the default showcase scenario', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await screen.findByRole('heading', {
      level: 1,
      name: 'Marketplace Vendor LLC',
    });
    await user.click(
      screen.getByRole('button', {
        name: 'Guided: load default scenario',
      })
    );
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'Guided: review default scenario',
        })
      ).toBeEnabled()
    );

    await user.click(
      screen.getByRole('button', {
        name: 'Guided: review default scenario',
      })
    );
    expect(
      screen.getByRole('heading', { name: 'Approved and proposed details' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', {
        name: 'Guided: continue to attestation',
      })
    );
    const agreement = screen.getByRole('checkbox', {
      name: /I have read the certification/,
    });
    expect(agreement).not.toBeChecked();
    expect(
      screen.getByRole('button', { name: 'Guided: attest and submit' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Attest and submit for verification',
      })
    ).toBeDisabled();

    await user.click(
      screen.getByRole('button', {
        name: 'Guided: attest and submit',
      })
    );
    expect(agreement).not.toBeChecked();
    expect(
      await screen.findByRole('heading', { name: 'Submitted for review' })
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: 'Continue to questions and documents',
      })
    );

    expect(
      await screen.findByRole('button', {
        name: 'Guided: review requested information',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Questions & documents').closest('li')
    ).toHaveAttribute('aria-current', 'step');
    expect(
      screen.getByRole('heading', { name: 'Document request for Sam Lee' })
    ).toBeInTheDocument();
  });

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
    expect(
      screen.getByRole('button', { name: 'Review proposed changes' })
    ).toBeDisabled();
    await loadCompleteStory(user);
    expect(
      screen.getByRole('radio', { name: /Yes, I have changes to disclose/ })
    ).toBeChecked();
    await user.click(
      screen.getByRole('button', { name: 'Review proposed changes' })
    );

    expect(
      screen.getByRole('heading', { name: 'Approved and proposed details' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Limited DDA')).not.toHaveLength(0);
    expect(screen.getAllByText('Diaz')).not.toHaveLength(0);
    expect(screen.getAllByText('Sam Lee')).not.toHaveLength(0);
    expect(
      screen.getByText(/This approved party is proposed for removal/)
    ).toBeInTheDocument();
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
    await user.click(
      screen.getByRole('button', { name: 'Request sub-product' })
    );
    await user.click(
      screen.getByRole('radio', { name: /Yes, I have changes to disclose/ })
    );
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

  it('supports individual product, add-party, and remove-party operations', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await screen.findByRole('heading', {
      level: 1,
      name: 'Marketplace Vendor LLC',
    });
    await user.click(
      screen.getByRole('button', { name: 'Request sub-product' })
    );
    expect(await screen.findByText('Proposed addition')).toBeInTheDocument();
    await user.click(
      screen.getByRole('radio', { name: /Yes, I have changes to disclose/ })
    );

    await user.click(screen.getByRole('button', { name: 'Add party' }));
    const samParty = (
      await screen.findByRole('heading', { name: 'Sam Lee' })
    ).closest('article');
    expect(samParty).toHaveTextContent('New party · pending approval');
    expect(samParty).not.toHaveTextContent('Approved');

    await user.click(screen.getByRole('button', { name: 'Remove Alex Smith' }));
    const confirmation = screen.getByRole('dialog', {
      name: 'Remove Alex Smith?',
    });
    expect(confirmation).toHaveTextContent('active set to false');
    await user.click(
      within(confirmation).getByRole('button', { name: 'Confirm removal' })
    );
    expect(await screen.findAllByText('Removal requested')).not.toHaveLength(0);
    const alexParty = screen
      .getByRole('heading', { name: 'Alex Smith' })
      .closest('article');
    expect(alexParty).toHaveTextContent('Approved');
    expect(alexParty).toHaveTextContent('Removal requested');
  });

  it('supports a product-only request when nothing changed since approval', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await screen.findByRole('heading', {
      level: 1,
      name: 'Marketplace Vendor LLC',
    });
    expect(
      screen.getByRole('radio', { name: /No, nothing else changed/ })
    ).toBeDisabled();

    await user.click(
      screen.getByRole('button', { name: 'Request sub-product' })
    );
    await user.click(
      screen.getByRole('radio', { name: /No, nothing else changed/ })
    );

    expect(
      screen.queryByRole('button', { name: 'Edit Alex Smith' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add party' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Review proposed changes' })
    ).toBeEnabled();

    await user.click(
      screen.getByRole('button', { name: 'Review proposed changes' })
    );
    expect(screen.getAllByText('Limited DDA')).not.toHaveLength(0);
    expect(screen.queryByText('Diaz')).not.toBeInTheDocument();
  });

  it('compares field, profile, and request-oriented review options', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await screen.findByRole('heading', {
      level: 1,
      name: 'Marketplace Vendor LLC',
    });
    await loadCompleteStory(user);
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
    expect(
      within(
        screen.getByRole('region', { name: 'Proposed profile' })
      ).getByText('EMBEDDED PAYMENTS · LIMITED DDA · Proposed')
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('region', { name: 'Proposed profile' })
      ).getByText('EMBEDDED PAYMENTS · LIMITED DDA PAYMENTS')
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('region', { name: 'Approved profile' })
      ).getByText('Proposed removal')
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
      screen.getByText('This request groups all 9 draft changes into 4 tasks.')
    ).toBeInTheDocument();
    expect(reviewNote).toHaveTextContent(
      'Trade-off: Reviewers must expand a party before seeing every value.'
    );
  });

  it('shows returned questions and party document requests as display-only tasks', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await screen.findByRole('heading', {
      level: 1,
      name: 'Marketplace Vendor LLC',
    });
    await loadCompleteStory(user);
    await user.click(
      screen.getByRole('button', { name: 'Review proposed changes' })
    );
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

    const demoControls = screen.getByRole('complementary', {
      name: 'Asynchronous review',
    });
    await waitFor(() =>
      expect(
        within(demoControls).getByRole('button', {
          name: 'Request more information',
        })
      ).toBeEnabled()
    );
    await user.click(
      within(demoControls).getByRole('button', {
        name: 'Request more information',
      })
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Maintenance returned for information',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'More information required' })
    ).toBeInTheDocument();
    expect(screen.getByText('New-party due diligence')).toBeInTheDocument();
    expect(
      screen.getByText('New party · information requested')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Existing parties remain approved/)
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', {
        name: 'New-party due diligence question',
      })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole('heading', {
        name: 'Legal-name change review question',
      })
    ).toHaveLength(2);
    expect(screen.getAllByText('Client level')).toHaveLength(4);
    expect(
      screen.getByText(
        'Will the newly added party initiate account activity on behalf of the client?'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'What responsibilities will the newly added party have for the client?'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('What prompted the requested legal-name change?')
    ).toBeInTheDocument();
    expect(
      screen.getByText('When did the requested legal name take effect?')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Document request for Sam Lee' })
    ).toBeInTheDocument();
    expect(screen.getByText('Party linked')).toBeInTheDocument();
    expect(screen.getByText('Drivers License')).toBeInTheDocument();
    expect(screen.getAllByText('Display only')).toHaveLength(5);
    expect(
      within(demoControls).getByRole('button', {
        name: 'Approve maintenance',
      })
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: /answer|upload/i })
    ).not.toBeInTheDocument();
  });
});
