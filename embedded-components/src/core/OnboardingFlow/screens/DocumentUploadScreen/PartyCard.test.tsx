/**
 * RTL coverage for {@link PartyCard}: loading skeleton, ACTIVE vs CLOSED actions,
 * and document rows with metadata (extension + formatted upload time).
 */
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent } from '@test-utils';

import type {
  DocumentRequestResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import { OnboardingContext } from '@/core/OnboardingFlow/contexts/OnboardingContext';
import { PartyCard } from '@/core/OnboardingFlow/screens/DocumentUploadScreen/PartyCard';

const partyCardCtx = vi.hoisted(() => ({
  docHookReturn: {
    data: undefined as { documentDetails?: unknown[] } | undefined,
    isLoading: true,
    isPending: true,
    isError: false,
    error: null,
    isFetching: false,
    isSuccess: false,
    fetchStatus: 'idle' as const,
    status: 'pending' as const,
  },
  reset() {
    partyCardCtx.docHookReturn = {
      data: undefined,
      isLoading: true,
      isPending: true,
      isError: false,
      error: null,
      isFetching: false,
      isSuccess: false,
      fetchStatus: 'idle',
      status: 'pending',
    };
  },
}));

vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    useSmbdoGetAllDocumentDetails: () =>
      partyCardCtx.docHookReturn as unknown as ReturnType<
        typeof actual.useSmbdoGetAllDocumentDetails
      >,
  };
});

const DOC_REQ_ID = 'doc-req-party-card';

const mockParty: PartyResponse = {
  id: 'party-1',
  roles: ['CLIENT'],
  partyType: 'ORGANIZATION',
  organizationDetails: {
    organizationName: 'Party Card Fixtures LLC',
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    countryOfFormation: 'US',
    jurisdiction: 'US',
  },
  status: 'ACTIVE',
  validationResponse: [],
};

const activeDocRequest: DocumentRequestResponse = {
  id: DOC_REQ_ID,
  clientId: 'client-pc',
  partyId: mockParty.id,
  status: 'ACTIVE',
  createdAt: '2024-01-01T12:00:00Z',
  requirements: [
    {
      documentTypes: ['BUSINESS_LICENSE'],
      level: 'PRIMARY',
      minRequired: 1,
    },
  ],
};

const closedDocRequest: DocumentRequestResponse = {
  ...activeDocRequest,
  status: 'CLOSED',
};

function renderPartyCard(
  docRequest: DocumentRequestResponse,
  overrides?: Partial<OnboardingContextType>
) {
  const onboarding: OnboardingContextType = {
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    clientGetStatus: 'success',
    setClientId: vi.fn(),
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    showLinkAccountStep: false,
    showDownloadChecklist: false,
    docUploadOnlyMode: false,
    docUploadMaxFileSizeBytes: 8 * 1024 * 1024,
    clientData: {
      id: 'client-pc',
      status: 'NEW',
      partyId: mockParty.id,
      parties: [mockParty],
      products: ['EMBEDDED_PAYMENTS'],
      outstanding: {
        partyIds: [],
        partyRoles: [],
        questionIds: [],
        documentRequestIds: [],
        attestationDocumentIds: [],
      },
    },
    ...overrides,
  };

  const onUploadClick = vi.fn();

  render(
    <OnboardingContext.Provider value={onboarding}>
      <PartyCard
        party={mockParty}
        docRequest={docRequest}
        onUploadClick={onUploadClick}
      />
    </OnboardingContext.Provider>
  );

  return { onUploadClick };
}

describe('PartyCard', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ pointerEventsCheck: 0 });
    partyCardCtx.reset();
    vi.clearAllMocks();
  });

  test('shows loading skeleton while document details are fetching', async () => {
    renderPartyCard(activeDocRequest);

    expect(await screen.findByText(/party card fixtures llc/i)).toBeTruthy();
    expect(document.querySelector('.eb-animate-pulse')).toBeTruthy();
  });

  test('ACTIVE request renders upload control and invokes onUploadClick', async () => {
    partyCardCtx.docHookReturn = {
      data: { documentDetails: [] },
      isLoading: false,
      isPending: false,
      isError: false,
      error: null,
      isFetching: false,
      isSuccess: true,
      fetchStatus: 'idle',
      status: 'success',
    };

    const { onUploadClick } = renderPartyCard(activeDocRequest);

    await user.click(
      await screen.findByRole('button', { name: /upload documents/i })
    );

    expect(onUploadClick).toHaveBeenCalledTimes(1);
  });

  test('CLOSED request shows success message instead of upload', async () => {
    partyCardCtx.docHookReturn = {
      data: { documentDetails: [] },
      isLoading: false,
      isPending: false,
      isError: false,
      error: null,
      isFetching: false,
      isSuccess: true,
      fetchStatus: 'idle',
      status: 'success',
    };

    renderPartyCard(closedDocRequest);

    expect(
      await screen.findByText(/required documents successfully uploaded/i)
    ).toBeTruthy();
    expect(
      screen.queryByRole('button', { name: /upload documents/i })
    ).toBeNull();
  });

  test('renders document type label and metadata badges when details load', async () => {
    partyCardCtx.docHookReturn = {
      data: {
        documentDetails: [
          {
            id: 'doc-1',
            documentType: 'BUSINESS_LICENSE',
            metadata: [
              { key: 'DOCUMENT_REQUEST_ID', value: DOC_REQ_ID },
              { key: 'FILE_EXTENSION', value: 'pdf' },
              { key: 'UPLOAD_TIME', value: '2024-06-15T14:30:00.000Z' },
            ],
          },
        ],
      },
      isLoading: false,
      isPending: false,
      isError: false,
      error: null,
      isFetching: false,
      isSuccess: true,
      fetchStatus: 'idle',
      status: 'success',
    };

    renderPartyCard(activeDocRequest);

    expect(await screen.findByText(/business license/i)).toBeTruthy();
    expect(screen.getByText('pdf')).toBeTruthy();
    expect(screen.getByText(/jun 15, 2024/i)).toBeTruthy();
  });
});
