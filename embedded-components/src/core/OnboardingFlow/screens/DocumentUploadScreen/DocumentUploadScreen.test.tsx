import { server } from '@/msw/server';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { http, HttpResponse } from 'msw';

import * as smbdoApi from '@/api/generated/smbdo';
import {
  ClientResponse,
  DocumentRequestResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import { OnboardingContext } from '@/core/OnboardingFlow/contexts/OnboardingContext';
import * as FlowContext from '@/core/OnboardingFlow/contexts/FlowContext';

import { DocumentUploadScreen } from './DocumentUploadScreen';

// Mock data setup
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
    id: 'doc-req-1',
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
    id: 'doc-req-2',
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
    id: 'doc-req-3',
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

// Default flow context mock
const mockFlowContext = {
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

// Mock onboarding context (extended via renderComponent)
const mockOnboardingBase = {
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY' as const,
  docUploadOnlyMode: false,
  showLinkAccountStep: false,
  showDownloadChecklist: false,
};

let flowContextSpy: ReturnType<typeof vi.spyOn>;

// Component rendering helper
const renderComponent = (
  clientOverride?: Partial<ClientResponse>,
  documentRequests = mockDocumentRequests,
  flowContextOverride: Record<string, unknown> = {},
  onboardingContextOverride: Partial<OnboardingContextType> = {}
) => {
  flowContextSpy.mockReturnValue({
    ...mockFlowContext,
    ...flowContextOverride,
  } as unknown as ReturnType<typeof FlowContext.useFlowContext>);

  const client = { ...mockClient, ...clientOverride };
  const onboardingContext: OnboardingContextType = {
    ...mockOnboardingBase,
    clientGetStatus: 'success',
    clientData: client,
    availableJurisdictions: ['US'],
    availableProducts: ['EMBEDDED_PAYMENTS'],
    ...onboardingContextOverride,
  };

  server.use(
    http.get('/document-requests', () => {
      return HttpResponse.json({
        documentRequests,
      });
    })
  );

  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{ name: 'enUS' }}
      reactQueryDefaultOptions={{
        queries: {
          retry: false,
        },
      }}
    >
      <OnboardingContext.Provider value={onboardingContext}>
        <DocumentUploadScreen />
      </OnboardingContext.Provider>
    </EBComponentsProvider>
  );
};

describe('DocumentUploadScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    server.resetHandlers();
    const g = globalThis as {
      __EB_QUERY_CLIENT__?: import('@tanstack/react-query').QueryClient;
    };
    g.__EB_QUERY_CLIENT__?.clear();
    flowContextSpy = vi
      .spyOn(FlowContext, 'useFlowContext')
      .mockReturnValue(
        mockFlowContext as unknown as ReturnType<typeof FlowContext.useFlowContext>
      );
  });

  afterEach(() => {
    flowContextSpy.mockRestore();
  });

  test('renders loading state while fetching document requests', async () => {
    renderComponent();

    expect(screen.getByText(/loading document requests/i)).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText(/loading document requests/i)
      ).not.toBeInTheDocument();
    });
  });

  test('renders business and owners/controllers sections with document cards', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/for the business/i)).toBeInTheDocument();
      expect(screen.getByText(/for owners and key roles/i)).toBeInTheDocument();
      expect(screen.getByText(/test business inc/i)).toBeInTheDocument();
      expect(screen.getByText(/john owner/i)).toBeInTheDocument();
      expect(screen.getByText(/jane controller/i)).toBeInTheDocument();
    });
  });

  test('renders correct badges for different party roles', async () => {
    renderComponent();

    await waitFor(() => {
      const businessBadges = screen.getAllByText(/business/i);
      expect(businessBadges.length).toBeGreaterThan(0);

      const ownerBadges = screen.getAllByText(/owner/i);
      expect(ownerBadges.length).toBeGreaterThan(0);

      const controllerBadges = screen.getAllByText(/controller/i);
      expect(controllerBadges.length).toBeGreaterThan(0);
    });
  });

  test('shows upload button for active document requests', async () => {
    renderComponent();

    await waitFor(() => {
      const uploadButtons = screen.getAllByText(/upload documents/i);
      expect(uploadButtons.length).toBe(2); // Should have 2 active document requests
    });
  });

  test('shows completed status for closed document requests', async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/required documents successfully uploaded/i)
      ).toBeInTheDocument();
    });
  });

  test('navigates to document upload form when upload button is clicked', async () => {
    const goToMock = vi.fn();
    renderComponent(undefined, undefined, { goTo: goToMock });

    await waitFor(() => {
      expect(screen.getAllByText(/upload documents/i).length).toBeGreaterThan(
        0
      );
    });

    const uploadButton = screen.getAllByText(/upload documents/i)[0];
    await userEvent.click(uploadButton);

    expect(goToMock).toHaveBeenCalledWith('document-upload-form', {
      editingPartyId: expect.any(String),
    });
  });

  test('shows return to overview button when not in docUploadOnlyMode', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/return to overview/i)).toBeInTheDocument();
    });
  });

  test('hides return to overview button when in docUploadOnlyMode', async () => {
    renderComponent(undefined, undefined, undefined, {
      docUploadOnlyMode: true,
    });

    await waitFor(() => {
      expect(screen.queryByText(/return to overview/i)).not.toBeInTheDocument();
    });
  });

  test('calls goBack with overview fallback when return button is clicked', async () => {
    const goBackMock = vi.fn();
    renderComponent(undefined, undefined, { goBack: goBackMock });

    await waitFor(() => {
      expect(screen.getByText(/return to overview/i)).toBeInTheDocument();
    });

    const returnButton = screen.getByText(/return to overview/i);
    await userEvent.click(returnButton);

    expect(goBackMock).toHaveBeenCalledWith({
      fallbackScreenId: 'overview',
    });
  });

  test('shows review in progress message when client status is REVIEW_IN_PROGRESS', async () => {
    renderComponent({ status: 'REVIEW_IN_PROGRESS' });

    await waitFor(() => {
      expect(screen.getByText(/review in progress/i)).toBeInTheDocument();
      expect(
        screen.getByText(/your onboarding is currently under review/i)
      ).toBeInTheDocument();
    });
  });

  test('shows approved message when client status is APPROVED', async () => {
    renderComponent({ status: 'APPROVED' });

    await waitFor(() => {
      expect(
        screen.getByText(/your onboarding has been approved/i)
      ).toBeInTheDocument();
    });
  });

  test('shows error message when document request API fails', async () => {
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
      } as unknown as ReturnType<typeof smbdoApi.useSmbdoListDocumentRequests>);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/there was a problem/i)).toBeInTheDocument();
      expect(
        screen.getByText(/unable to load document requests/i)
      ).toBeInTheDocument();
    });

    spy.mockRestore();
  });

  test('shows error message when no client data is available', async () => {
    renderComponent(undefined, undefined, undefined, {
      clientData: undefined,
    });

    await waitFor(
      () => {
        expect(screen.getByText(/there was a problem/i)).toBeInTheDocument();
        expect(
          screen.getByText(/unable to load client data/i)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  test('shows message when no document requests are found', async () => {
    renderComponent(undefined, []);

    await waitFor(() => {
      expect(screen.getByText(/there is a problem/i)).toBeInTheDocument();
      expect(
        screen.getByText(/no document requests found/i)
      ).toBeInTheDocument();
    });
  });

  test('shows no documents required message when specific party has no document requests', async () => {
    // Remove business document requests
    const filteredRequests = mockDocumentRequests.filter(
      (doc) => doc.partyId !== 'party-1'
    );

    renderComponent(undefined, filteredRequests);

    await waitFor(() => {
      // Should display "No documents required" in the business section
      expect(screen.getAllByText(/no documents required/i).length).toBe(1);
    });
  });
});
