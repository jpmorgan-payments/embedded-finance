/**
 * RTL coverage for {@link DocumentUploadForm}: form progression, navigation,
 * and API orchestration (also exercises {@link DocumentRequestCard}, {@link RequirementStep}, {@link DocumentUploadField}).
 *
 * Document upload uses multipart FormData; MSW's default `/documents` handler expects JSON, so we stub the React Query hooks here and assert `mutateAsync` payloads plus `goTo` / `goBack`.
 */
import { server } from '@/msw/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import type { OnboardingContextType } from '@/core/OnboardingFlow/contexts';
import { OnboardingContext } from '@/core/OnboardingFlow/contexts/OnboardingContext';

import { DocumentUploadForm } from './DocumentUploadForm';

const docFormTestCtx = vi.hoisted(() => {
  const DOC_REQ_ID = 'doc-upload-form-int-1';
  const goTo = vi.fn();
  const goBack = vi.fn();
  const uploadMutateAsync = vi.fn().mockResolvedValue({
    id: 'uploaded-doc-1',
    status: 'ACTIVE',
    documentType: 'BUSINESS_LICENSE',
  });
  const submitMutateAsync = vi.fn().mockResolvedValue({});
  const uploadMutationReset = vi.fn();
  const submitMutationReset = vi.fn();

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

  let editingPartyIds: Record<string, string | undefined> = {
    'document-upload-form': DOC_REQ_ID,
  };

  return {
    DOC_REQ_ID,
    mockDocRequest,
    goTo,
    goBack,
    uploadMutateAsync,
    submitMutateAsync,
    uploadMutationReset,
    submitMutationReset,
    resetEditingPartyIds() {
      editingPartyIds = { 'document-upload-form': DOC_REQ_ID };
    },
    useFlowContextMock() {
      return {
        goTo,
        goBack,
        editingPartyIds,
        setFlowUnsavedChanges: vi.fn(),
      };
    },
  };
});

vi.mock('@/core/OnboardingFlow/contexts', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@/core/OnboardingFlow/contexts')>();
  return {
    ...actual,
    useFlowContext: () => docFormTestCtx.useFlowContextMock(),
  };
});

vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  const { DOC_REQ_ID, mockDocRequest, uploadMutateAsync, submitMutateAsync } =
    docFormTestCtx;

  return {
    ...actual,
    useSmbdoGetDocumentRequest: (id: string | undefined) =>
      ({
        data: id === DOC_REQ_ID ? mockDocRequest : undefined,
        status: id === DOC_REQ_ID ? 'success' : 'pending',
        fetchStatus: id === DOC_REQ_ID ? 'idle' : 'fetching',
        isPending: id !== DOC_REQ_ID,
        isError: false,
        error: null,
        isFetching: false,
        isSuccess: id === DOC_REQ_ID,
      }) as unknown as ReturnType<typeof actual.useSmbdoGetDocumentRequest>,
    useSmbdoUploadDocument: () =>
      ({
        mutateAsync: uploadMutateAsync,
        reset: docFormTestCtx.uploadMutationReset,
        error: null,
        isPending: false,
        isError: false,
        isSuccess: false,
      }) as unknown as ReturnType<typeof actual.useSmbdoUploadDocument>,
    useSmbdoSubmitDocumentRequest: () =>
      ({
        mutateAsync: submitMutateAsync,
        reset: docFormTestCtx.submitMutationReset,
        error: null,
        isPending: false,
        isError: false,
        isSuccess: false,
      }) as unknown as ReturnType<typeof actual.useSmbdoSubmitDocumentRequest>,
  };
});

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
    docFormTestCtx.goTo.mockClear();
    docFormTestCtx.goBack.mockClear();
    docFormTestCtx.uploadMutateAsync.mockClear();
    docFormTestCtx.submitMutateAsync.mockClear();
    docFormTestCtx.uploadMutationReset.mockClear();
    docFormTestCtx.submitMutationReset.mockClear();
    docFormTestCtx.resetEditingPartyIds();
    server.resetHandlers();
    const g = globalThis as {
      __EB_QUERY_CLIENT__?: import('@tanstack/react-query').QueryClient;
    };
    g.__EB_QUERY_CLIENT__?.clear();
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

    expect(docFormTestCtx.goBack).toHaveBeenCalledWith({
      fallbackScreenId: 'upload-documents-section',
    });
  });

  test('select type, upload file, submit calls upload + submit mutations then navigates', async () => {
    renderDocumentUploadForm();

    await screen.findByRole('heading', {
      name: /acme upload fixtures llc/i,
    });

    await user.click(screen.getByRole('combobox'));

    await screen.findByRole('listbox');
    await user.click(screen.getByRole('option', { name: /business license/i }));

    const uploadHeading = screen.getAllByText(/upload document/i)[0];
    const fileInput = uploadHeading
      .closest('div')
      ?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
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
        expect(docFormTestCtx.uploadMutateAsync).toHaveBeenCalled();
      },
      { timeout: 15_000 }
    );

    expect(docFormTestCtx.uploadMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          file: expect.any(File),
          documentData: expect.stringContaining(docFormTestCtx.DOC_REQ_ID),
        }),
      })
    );

    await waitFor(() => {
      expect(docFormTestCtx.submitMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ id: docFormTestCtx.DOC_REQ_ID })
      );
    });

    await waitFor(() => {
      expect(docFormTestCtx.goTo).toHaveBeenCalledWith(
        'upload-documents-section'
      );
    });
  });

  test('Reset form triggers upload and submit mutation reset()', async () => {
    renderDocumentUploadForm();

    await screen.findByRole('heading', {
      name: /acme upload fixtures llc/i,
    });

    await user.click(screen.getByRole('button', { name: /reset form/i }));

    expect(docFormTestCtx.uploadMutationReset).toHaveBeenCalled();
    expect(docFormTestCtx.submitMutationReset).toHaveBeenCalled();
  });
});
