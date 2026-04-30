/**
 * RTL coverage for {@link DocumentUploadForm}: MSW upload/submit wiring, navigation,
 * and requirement UI (together exercises {@link DocumentRequestCard}, {@link RequirementStep}, {@link DocumentUploadField}).
 */
import { server } from '@/msw/server';
import { HttpResponse, http } from 'msw';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import { OnboardingContext } from '@/core/OnboardingFlow/contexts/OnboardingContext';

import { DocumentUploadForm } from './DocumentUploadForm';

const DOC_REQ_ID = 'doc-upload-form-int-1';

const uploadFlowCtx = vi.hoisted(() => {
  const goTo = vi.fn();
  const goBack = vi.fn();
  let editingPartyIds: Record<string, string | undefined> = {
    'document-upload-form': DOC_REQ_ID,
  };
  return {
    goTo,
    goBack,
    resetEditingPartyIds() {
      editingPartyIds = { 'document-upload-form': DOC_REQ_ID };
    },
    useFlowContextMock() {
      return {
        goTo,
        goBack,
        editingPartyIds,
      };
    },
  };
});

vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();
  return {
    ...actual,
    useFlowContext: () => uploadFlowCtx.useFlowContextMock(),
  };
});

const mockDocRequest = {
  id: DOC_REQ_ID,
  clientId: 'client-duf',
  partyId: 'party-org',
  status: 'ACTIVE' as const,
  createdAt: '2024-01-01T12:00:00Z',
  requirements: [
    {
      documentTypes: ['BUSINESS_LICENSE'] as const,
      level: 'PRIMARY' as const,
      minRequired: 1,
    },
  ],
};

const mockClient: ClientResponse = {
  id: 'client-duf',
  status: 'NEW',
  partyId: 'party-org',
  parties: [
    {
      id: 'party-org',
      roles: ['CLIENT'],
      partyType: 'ORGANIZATION',
      organizationDetails: {
        organizationName: 'Acme Upload Fixtures LLC',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        countryOfFormation: 'US',
        jurisdiction: 'US',
      },
      status: 'ACTIVE',
      validationResponse: [],
    },
  ],
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
};

function renderDocumentUploadForm() {
  const onboardingContext: OnboardingContextType = {
    setClientId: vi.fn(),
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    docUploadOnlyMode: false,
    showLinkAccountStep: false,
    showDownloadChecklist: false,
    clientGetStatus: 'success',
    clientData: mockClient,
    availableJurisdictions: ['US'],
    availableProducts: ['EMBEDDED_PAYMENTS'],
    docUploadMaxFileSizeBytes: 8 * 1024 * 1024,
  };

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
        <DocumentUploadForm />
      </OnboardingContext.Provider>
    </EBComponentsProvider>
  );
}

describe('DocumentUploadForm (integration)', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup({ pointerEventsCheck: 0 });
    uploadFlowCtx.goTo.mockClear();
    uploadFlowCtx.goBack.mockClear();
    uploadFlowCtx.resetEditingPartyIds();
    server.resetHandlers();
    const g = globalThis as {
      __EB_QUERY_CLIENT__?: import('@tanstack/react-query').QueryClient;
    };
    g.__EB_QUERY_CLIENT__?.clear();

    server.use(
      http.get(`/document-requests/${DOC_REQ_ID}`, () =>
        HttpResponse.json(mockDocRequest)
      ),
      http.post('/documents', async ({ request }) => {
        const ct = request.headers.get('content-type') ?? '';
        expect(ct).toMatch(/multipart\/form-data/i);
        const fd = await request.formData();
        expect(fd.get('file')).toBeInstanceOf(File);
        expect(typeof fd.get('documentData')).toBe('string');
        return HttpResponse.json(
          {
            id: 'uploaded-doc-1',
            status: 'ACTIVE',
            documentType: 'BUSINESS_LICENSE',
            fileName: 'license.pdf',
            mimeType: 'application/pdf',
            createdAt: new Date().toISOString(),
            metadata: {},
          },
          { status: 201 }
        );
      }),
      http.post(`/document-requests/${DOC_REQ_ID}/submit`, () =>
        HttpResponse.json({ submitted: true })
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('cancel invokes goBack with upload-documents-section fallback', async () => {
    renderDocumentUploadForm();

    await screen.findByRole('heading', {
      name: /acme upload fixtures llc/i,
    });

    await user.click(
      screen.getByRole('button', {
        name: /cancel/i,
      })
    );

    expect(uploadFlowCtx.goBack).toHaveBeenCalledWith({
      fallbackScreenId: 'upload-documents-section',
    });
  });

  test('select type, upload file, submit sends uploads then navigates to document list', async () => {
    renderDocumentUploadForm();

    await screen.findByRole('heading', {
      name: /acme upload fixtures llc/i,
    });

    const typeCombo = screen.getByRole('combobox', {
      name: /select document type/i,
    });
    await user.click(typeCombo);

    const listbox = await screen.findByRole('listbox');
    await user.click(
      screen.getByRole('option', { name: /business license/i })
    );

    const uploadHeading = screen.getByText(/upload document/i);
    const fileInput = uploadHeading
      .closest('div')
      ?.parentElement?.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const pdf = new File(['%PDF-1.4 minimal'], 'license.pdf', {
      type: 'application/pdf',
    });
    await user.upload(fileInput, pdf);

    const submitBtn = screen.getByRole('button', {
      name: /upload documents/i,
    });

    await waitFor(() => expect(submitBtn).not.toBeDisabled(), {
      timeout: 15_000,
    });

    await user.click(submitBtn);

    await waitFor(
      () => {
        expect(uploadFlowCtx.goTo).toHaveBeenCalledWith(
          'upload-documents-section'
        );
      },
      { timeout: 15_000 }
    );
  });
});
