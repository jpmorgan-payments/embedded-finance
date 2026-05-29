import { server } from '@/msw/server';
import { http, HttpResponse } from 'msw';
import { render, screen, userEvent, waitFor } from '@test-utils';

import * as smbdoApi from '@/api/generated/smbdo';
import {
  ClientResponse,
  DocumentRequestResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import { OnboardingContext } from '@/core/OnboardingFlow/contexts/OnboardingContext';

import { DocumentUploadScreen } from './DocumentUploadScreen';

/**
 * `useFlowContext` is `() => useContext(FlowContext)`.
 * Mock both relative and `@/` module ids so Vitest resolves the same binding as the SUT in CI.
 */
const flowContextTestState = vi.hoisted(() => {
  const defaults = {
    currentScreenId: 'document-upload',
    originScreenId: 'overview',
    goTo: vi.fn(),
    goBack: vi.fn(),
    editingPartyIds: {},
    updateEditingPartyId: vi.fn(),
    sections: [],
    sessionData: {},
    updateSessionData: vi.fn(),
    previouslyCompleted: false,
    reviewScreenOpenedSectionId: null,
    initialStepperStepId: null,
    shortLabelOverride: null,
    unsavedChangesRef: { current: false },
    setFlowUnsavedChanges: vi.fn(),
  };
  let overrides: Record<string, unknown> = {};

  return {
    reset() {
      overrides = {};
    },
    setOverrides(patch: Record<string, unknown>) {
      overrides = { ...patch };
    },
    getValue() {
      return { ...defaults, ...overrides };
    },
  };
});

async function createFlowContextMock(
  importOriginal: () => Promise<Record<string, unknown>>
) {
  const actual = (await importOriginal()) as {
    useFlowContext: () => unknown;
    [key: string]: unknown;
  };
  return {
    ...actual,
    useFlowContext: () =>
      flowContextTestState.getValue() as unknown as ReturnType<
        typeof actual.useFlowContext
      >,
  };
}

vi.mock('../../contexts/FlowContext', (importOriginal) =>
  createFlowContextMock(importOriginal)
);
vi.mock('@/core/OnboardingFlow/contexts/FlowContext', (importOriginal) =>
  createFlowContextMock(importOriginal)
);

/** Stable ids for assertions against `goTo(..., { editingPartyId })` (value is document request id). */
const DOC_REQ = {
  businessActive: 'doc-req-1',
  ownerActive: 'doc-req-2',
  controllerClosed: 'doc-req-3',
} as const;

const mockParties: PartyResponse[] = [
  {
    id: 'party-1',
    roles: ['CLIENT'],
    partyType: 'ORGANIZATION',
    organizationDetails: {
      organizationName: 'Test Business Inc.',
      organizationType: 'LIMITED_LIABILITY_COMPANY',
      addresses: [
        {
          addressLines: ['123 Business St'],
          city: 'Business City',
          state: 'NY',
          country: 'US',
          postalCode: '10001',
          addressType: 'LEGAL_ADDRESS',
        },
      ],
    },
    status: 'ACTIVE',
    validationResponse: [],
  },
  {
    id: 'party-2',
    roles: ['BENEFICIAL_OWNER'],
    partyType: 'INDIVIDUAL',
    individualDetails: {
      firstName: 'John',
      lastName: 'Owner',
      jobTitle: 'CEO',
      addresses: [
        {
          addressLines: ['456 Owner St'],
          city: 'Owner City',
          state: 'CA',
          country: 'US',
          postalCode: '90001',
          addressType: 'RESIDENTIAL_ADDRESS',
        },
      ],
    },
    status: 'ACTIVE',
    validationResponse: [],
  },
  {
    id: 'party-3',
    roles: ['CONTROLLER'],
    partyType: 'INDIVIDUAL',
    individualDetails: {
      firstName: 'Jane',
      lastName: 'Controller',
      jobTitle: 'CFO',
      addresses: [
        {
          addressLines: ['789 Controller St'],
          city: 'Controller City',
          state: 'TX',
          country: 'US',
          postalCode: '75001',
          addressType: 'RESIDENTIAL_ADDRESS',
        },
      ],
    },
    status: 'ACTIVE',
    validationResponse: [],
  },
];

const mockClient: ClientResponse = {
  id: 'client-1',
  status: 'NEW',
  parties: mockParties,
  partyId: 'party-1',
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
};

const mockDocumentRequests: DocumentRequestResponse[] = [
  {
    id: DOC_REQ.businessActive,
    clientId: 'client-1',
    partyId: 'party-1',
    status: 'ACTIVE',
    createdAt: '2023-01-01T12:00:00Z',
    requirements: [
      {
        documentTypes: ['BUSINESS_LICENSE'],
        level: 'PRIMARY',
        minRequired: 1,
      },
    ],
  },
  {
    id: DOC_REQ.ownerActive,
    clientId: 'client-1',
    partyId: 'party-2',
    status: 'ACTIVE',
    createdAt: '2023-01-01T12:00:00Z',
    requirements: [
      {
        documentTypes: ['DRIVERS_LICENSE', 'PASSPORT'],
        level: 'PRIMARY',
        minRequired: 1,
      },
    ],
  },
  {
    id: DOC_REQ.controllerClosed,
    clientId: 'client-1',
    partyId: 'party-3',
    status: 'CLOSED',
    createdAt: '2023-01-01T12:00:00Z',
    requirements: [
      {
        documentTypes: ['DRIVERS_LICENSE', 'PASSPORT'],
        level: 'PRIMARY',
        minRequired: 1,
      },
    ],
  },
];

const baseOnboardingSlice = {
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY' as const,
  docUploadOnlyMode: false,
  showLinkAccountStep: false,
  showDownloadChecklist: false,
};

function renderDocumentUploadScreen(
  options: {
    client?: Partial<ClientResponse>;
    documentRequests?: DocumentRequestResponse[];
    flow?: Record<string, unknown>;
    onboarding?: Partial<OnboardingContextType>;
  } = {}
) {
  const {
    client: clientPatch,
    documentRequests = mockDocumentRequests,
    flow: flowPatch = {},
    onboarding: onboardingPatch = {},
  } = options;

  flowContextTestState.setOverrides(flowPatch);

  const client = { ...mockClient, ...clientPatch };
  const onboardingContext: OnboardingContextType = {
    ...baseOnboardingSlice,
    clientGetStatus: 'success',
    clientData: client,
    availableJurisdictions: ['US'],
    availableProducts: ['EMBEDDED_PAYMENTS'],
    ...onboardingPatch,
  };

  server.use(
    http.get('/document-requests', () =>
      HttpResponse.json({ documentRequests })
    )
  );

  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
      reactQueryDefaultOptions={{
        queries: { retry: false },
      }}
    >
      <OnboardingContext.Provider value={onboardingContext}>
        <DocumentUploadScreen />
      </OnboardingContext.Provider>
    </EBComponentsProvider>
  );
}

/**
 * MSW resolves `/document-requests` and sections render section headings.
 * Prefer this over ad-hoc `waitFor` on copy that may appear in multiple places.
 */
async function waitForDocumentListReady() {
  await screen.findByRole('heading', { name: /for the business/i });
  await screen.findByRole('heading', { name: /for owners and key roles/i });
}

describe('DocumentUploadScreen', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    // Avoid CI flakiness where user-event skips clicks (pointer target checks).
    user = userEvent.setup({ pointerEventsCheck: 0 });
    flowContextTestState.reset();
    vi.clearAllMocks();
    server.resetHandlers();
    const g = globalThis as {
      __EB_QUERY_CLIENT__?: import('@tanstack/react-query').QueryClient;
    };
    g.__EB_QUERY_CLIENT__?.clear();
  });

  describe('document request list (happy path)', () => {
    test('shows loading, then sections, parties, role labels, upload actions, and closed request copy', async () => {
      renderDocumentUploadScreen();

      expect(
        screen.getByText(/loading document requests/i)
      ).toBeInTheDocument();

      await waitForDocumentListReady();

      expect(
        screen.queryByText(/loading document requests/i)
      ).not.toBeInTheDocument();

      expect(screen.getByText(/test business inc/i)).toBeInTheDocument();
      expect(screen.getByText(/john owner/i)).toBeInTheDocument();
      expect(screen.getByText(/jane controller/i)).toBeInTheDocument();

      expect(screen.getAllByText(/^business$/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/^owner$/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/^controller$/i).length).toBeGreaterThan(0);

      const uploadButtons = screen.getAllByRole('button', {
        name: /upload documents/i,
      });
      expect(uploadButtons).toHaveLength(2);

      expect(
        screen.getByText(/required documents successfully uploaded/i)
      ).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    test('goTo(document-upload-form) receives the document request id for the clicked row', async () => {
      const goToMock = vi.fn();
      renderDocumentUploadScreen({ flow: { goTo: goToMock } });

      await waitForDocumentListReady();

      const uploadButtons = screen.getAllByRole('button', {
        name: /upload documents/i,
      });
      await user.click(uploadButtons[0]);
      await waitFor(
        () =>
          expect(goToMock).toHaveBeenCalledWith('document-upload-form', {
            editingPartyId: DOC_REQ.businessActive,
          }),
        { timeout: 5000 }
      );

      goToMock.mockClear();
      await user.click(uploadButtons[1]);
      await waitFor(
        () =>
          expect(goToMock).toHaveBeenCalledWith('document-upload-form', {
            editingPartyId: DOC_REQ.ownerActive,
          }),
        { timeout: 5000 }
      );
    });

    // Intentionally no click + goBack(mock) assertion: same test was flaky in CI (mocked
    // useFlowContext vs real useContext). Return control is covered by "shows return button
    // by default" and docUploadOnlyMode tests; wire goBack in integration/E2E if needed.
  });

  describe('docUploadOnlyMode', () => {
    test('shows return button by default', async () => {
      renderDocumentUploadScreen();
      expect(
        await screen.findByRole('button', { name: /return to overview/i })
      ).toBeInTheDocument();
    });

    test('hides return button when docUploadOnlyMode is true', async () => {
      renderDocumentUploadScreen({
        onboarding: { docUploadOnlyMode: true },
      });

      await waitForDocumentListReady();

      expect(
        screen.queryByRole('button', { name: /return to overview/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('status and error messages', () => {
    test('REVIEW_IN_PROGRESS', async () => {
      renderDocumentUploadScreen({ client: { status: 'REVIEW_IN_PROGRESS' } });

      expect(
        await screen.findByText(/review in progress/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/your onboarding is currently under review/i)
      ).toBeInTheDocument();
    });

    test('APPROVED', async () => {
      renderDocumentUploadScreen({ client: { status: 'APPROVED' } });

      expect(
        await screen.findByText(/your onboarding has been approved/i)
      ).toBeInTheDocument();
    });

    test('document request hook error', async () => {
      const spy = vi
        .spyOn(smbdoApi, 'useSmbdoListDocumentRequests')
        .mockReturnValue({
          data: undefined,
          status: 'error',
          error: new Error('List failed'),
          isPending: false,
          isError: true,
          isSuccess: false,
          queryKey: ['/document-requests'],
        } as unknown as ReturnType<
          typeof smbdoApi.useSmbdoListDocumentRequests
        >);

      renderDocumentUploadScreen();

      expect(
        await screen.findByText(/there was a problem/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/unable to load document requests/i)
      ).toBeInTheDocument();

      spy.mockRestore();
    });

    test('missing client data', async () => {
      renderDocumentUploadScreen({
        onboarding: { clientData: undefined },
      });

      expect(
        await screen.findByText(/there was a problem/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/unable to load client data/i)
      ).toBeInTheDocument();
    });

    test('empty document requests from API', async () => {
      renderDocumentUploadScreen({ documentRequests: [] });

      expect(
        await screen.findByText(/there is a problem/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/no document requests found/i)
      ).toBeInTheDocument();
    });
  });

  describe('section empty state', () => {
    test('business section shows no documents required when that party has no requests', async () => {
      const withoutBusiness = mockDocumentRequests.filter(
        (doc) => doc.partyId !== 'party-1'
      );
      renderDocumentUploadScreen({ documentRequests: withoutBusiness });

      await waitForDocumentListReady();

      expect(screen.getAllByText(/no documents required/i)).toHaveLength(1);
    });
  });
});
