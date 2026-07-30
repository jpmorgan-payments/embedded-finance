/**
 * Behavioural coverage for the delta `deltaMode.reviewSectionsDisplay` modes on
 * the Review & attest screen:
 *  - `requireReview` gates the "data is complete and true" checkbox until every
 *    section accordion has been opened (with helper text).
 *  - `expanded` renders every section open up front.
 *  - `collapsible` (default) starts collapsed and does not gate the checkbox.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import type { OnboardingDeltaModeProp } from '@/core/OnboardingFlow/types/onboarding.types';

import { ReviewForm } from './ReviewForm';

// useTermsAndConditions fetches the caller's public IP; stub it so the review
// screen renders without a network round-trip.
vi.mock('@/lib/hooks', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/hooks')>();
  return {
    ...actual,
    useIPAddress: () => ({ data: '127.0.0.1', isLoading: false }),
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

// Rich LLC with an org + controller and nothing outstanding (no attestation
// documents, so the document-open gate is satisfied and the only gate under
// test is the section-review one).
const clientData = {
  id: 'client-1',
  partyId: 'org-1',
  products: ['EMBEDDED_PAYMENTS'],
  status: 'NEW',
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  questionResponses: [],
  parties: [
    {
      id: 'org-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      active: true,
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Acme LLC',
        countryOfFormation: 'US',
      },
    },
    {
      id: 'ctrl-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      active: true,
      individualDetails: {
        firstName: 'Ada',
        lastName: 'Byron',
        birthDate: '1990-01-01',
        countryOfResidence: 'US',
      },
    },
  ],
} as unknown as ClientResponse;

const baseContext = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
  showLinkAccountStep: false,
  showDownloadChecklist: false,
} as unknown as OnboardingContextType;

const noop = () => undefined;

function renderReview(deltaMode: OnboardingDeltaModeProp) {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider value={{ ...baseContext, deltaMode }}>
        <FlowProvider
          initialScreenId="review-attest-section"
          flowConfig={flowConfig}
          deltaModeActive
        >
          <ReviewForm
            handlePrev={noop}
            handleNext={noop}
            getPrevButtonLabel={() => 'Back'}
            getNextButtonLabel={() => 'Agree and finish'}
          />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

const dataAccuracyCheckbox = () =>
  screen.getByRole('checkbox', {
    name: /true, accurate, current, and complete/i,
  });

const helperText = /open and review each section above/i;

describe('ReviewForm — deltaMode.reviewSectionsDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  test('collapsible (default): sections start collapsed and the checkbox is not gated', () => {
    renderReview({ enabled: true, reviewSectionsDisplay: 'collapsible' });

    // Some collapsed section triggers exist.
    expect(
      screen.getAllByRole('button', { expanded: false }).length
    ).toBeGreaterThan(0);
    // No section-review requirement, so the checkbox is interactable.
    expect(dataAccuracyCheckbox()).toBeEnabled();
    expect(screen.queryByText(helperText)).not.toBeInTheDocument();
  });

  test('expanded: every section is open up front and the checkbox is not gated', () => {
    renderReview({ enabled: true, reviewSectionsDisplay: 'expanded' });

    // All section triggers are expanded, none collapsed.
    expect(
      screen.getAllByRole('button', { expanded: true }).length
    ).toBeGreaterThan(0);
    expect(screen.queryAllByRole('button', { expanded: false })).toHaveLength(
      0
    );
    expect(dataAccuracyCheckbox()).toBeEnabled();
  });

  test('requireReview: checkbox is gated until every section is opened', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderReview({ enabled: true, reviewSectionsDisplay: 'requireReview' });

    // Helper text is shown and the checkbox is disabled. Complete-but-unopened
    // sections read "Not reviewed"; incomplete sections show "Missing details".
    expect(screen.getByText(helperText)).toBeInTheDocument();
    expect(dataAccuracyCheckbox()).toBeDisabled();
    expect(screen.getAllByText('Not reviewed').length).toBeGreaterThan(0);

    // Open every collapsed section accordion.
    const triggers = screen.getAllByRole('button', { expanded: false });
    expect(triggers.length).toBeGreaterThan(0);
    for (const trigger of triggers) {
      await user.click(trigger);
    }

    // No section stays "Not reviewed"; the checkbox becomes interactable and the
    // helper requirement disappears.
    expect(screen.queryByText('Not reviewed')).not.toBeInTheDocument();
    expect(dataAccuracyCheckbox()).toBeEnabled();
    expect(screen.queryByText(helperText)).not.toBeInTheDocument();
  });
});
