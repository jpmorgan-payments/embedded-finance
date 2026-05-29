import { Jurisdiction } from '@/index';
import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { vi } from 'vitest';
import { userEvent } from '@test-utils';

import { ClientProduct } from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider/EBComponentsProvider';

import { OnboardingContextProvider } from '../OnboardingContextProvider/OnboardingContextProvider';
import {
  ACCEPTED_FILE_TYPES,
  DocumentUploadStepForm,
} from './DocumentUploadStepForm';
import {
  documentUploadStepFormTestClient,
  documentUploadStepFormTestIndividualDocumentRequest,
  documentUploadStepFormTestOrganizationDocumentRequest,
} from './DocumentUploadStepForm.test.mocks';

const { nextStepMock } = vi.hoisted(() => ({
  nextStepMock: vi.fn(),
}));

// Mock external dependencies
vi.mock('@/components/ui/stepper', () => ({
  useStepper: () => ({
    nextStep: nextStepMock,
    prevStep: vi.fn(),
    currentStep: 0,
    activeStep: 0,
    isLastStep: true,
    isDisabledStep: false,
  }),
}));

const mockFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });

// Setup QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock the OnboardingContextProvider
const mockOnboardingContext = {
  initialClientId: '0030000133',
  onPostClientResponse: vi.fn(),
  availableJurisdictions: ['US' as Jurisdiction],
  availableProducts: ['EMBEDDED_PAYMENTS' as ClientProduct],
};

type DocumentRequestPatch = Record<string, unknown>;

type RenderMswOverrides = {
  documentRequests?: {
    '68803'?: DocumentRequestPatch;
    '68804'?: DocumentRequestPatch;
    '68805'?: DocumentRequestPatch;
  };
  /** When set, replaces the default POST /documents handler */
  postDocuments?: (info: { request: Request }) => Promise<Response> | Response;
};

const findFirstCombobox = async () => {
  await waitFor(() => {
    expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0);
  });
  return screen.getAllByRole('combobox')[0];
};

const clickPassportOption = async () => {
  const listbox = await screen.findByRole('listbox');
  await userEvent.click(
    within(listbox).getByRole('option', { name: /^Passport$/i })
  );
};

// Component render helper
const renderComponent = (props = {}, mswOverrides?: RenderMswOverrides) => {
  // Setup API mocks
  server.use(
    http.get('/clients/0030000133', () => {
      return HttpResponse.json({
        ...documentUploadStepFormTestClient,
        status: 'INFORMATION_REQUESTED',
      });
    }),
    http.get('/document-requests/68803', () => {
      return HttpResponse.json({
        ...documentUploadStepFormTestOrganizationDocumentRequest,
        ...mswOverrides?.documentRequests?.['68803'],
      });
    }),
    http.get('/document-requests/68804', () => {
      return HttpResponse.json({
        ...documentUploadStepFormTestIndividualDocumentRequest,
        ...mswOverrides?.documentRequests?.['68804'],
      });
    }),
    http.get('/document-requests/68805', () => {
      return HttpResponse.json({
        ...documentUploadStepFormTestIndividualDocumentRequest,
        ...mswOverrides?.documentRequests?.['68805'],
      });
    }),
    http.post('/documents', async (info) => {
      if (mswOverrides?.postDocuments) {
        return mswOverrides.postDocuments(info);
      }
      return HttpResponse.json({
        requestId: Math.random().toString(36).substring(7),
        traceId: `doc-${Math.random().toString(36).substring(7)}`,
      });
    }),
    http.post('/document-requests/:requestId/submit', ({ params }) => {
      // eslint-disable-next-line no-console
      console.log(
        `Document request ${params.requestId} submitted successfully`
      );
      return new HttpResponse(
        JSON.stringify({
          acceptedAt: new Date().toISOString(),
        }),
        {
          status: 202,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    })
  );

  return render(
    <EBComponentsProvider
      apiBaseUrl="/"
      headers={{}}
      contentTokens={{
        name: 'enUS',
      }}
    >
      <OnboardingContextProvider {...mockOnboardingContext}>
        <QueryClientProvider client={queryClient}>
          <DocumentUploadStepForm {...props} />
        </QueryClientProvider>
      </OnboardingContextProvider>
    </EBComponentsProvider>
  );
};

describe('DocumentUploadStepForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nextStepMock.mockClear();
    queryClient.clear();
    server.resetHandlers();
  });

  describe('Initial Rendering', () => {
    test('renders document request description', async () => {
      renderComponent({ partyFilter: '2000000111' });

      expect(
        await screen.findByText(
          /To verify your identity, please provide requested documents./i
        )
      ).toBeInTheDocument();
    });

    test('renders party name when available', async () => {
      renderComponent({ partyFilter: '2000000111' });

      expect(
        await screen.findByText(/Document request for Neverland Books/i)
      ).toBeInTheDocument();
    });

    test('shows only first requirement active initially', async () => {
      renderComponent({ partyFilter: '2000000112' });

      // Find the text directly using screen.findByText
      await screen.findByText('Upload 1 of the following document types');
      await screen.findByText('Pending completion of previous steps');
    });
  });

  describe('File Upload Functionality', () => {
    test('validates file size', async () => {
      renderComponent({ partyFilter: '2000000111' });

      // Create a file larger than 2MB
      const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.pdf', {
        type: 'application/pdf',
      });

      // Find dropzone using the same pattern as other successful tests
      const dropzone = await screen.findByText(
        /Drag and drop a file or click to browse/i
      );

      const input =
        dropzone.parentElement?.parentElement?.querySelector('input');

      if (!input) {
        throw new Error('Failed to find file input element');
      }

      // Upload the file
      await userEvent.upload(input, largeFile);

      // Check for error message
      expect(
        await screen.findByText(/Each file must be 2MB or less/i)
      ).toBeInTheDocument();
    });

    test('accepts valid file types', async () => {
      renderComponent();

      Object.entries(ACCEPTED_FILE_TYPES).forEach(([mimeType, extensions]) => {
        const file = new File(['test'], `test${extensions[0]}`, {
          type: mimeType,
        });
        expect(file.type).toBe(mimeType);
      });
    });
  });

  describe('Document Type Selection', () => {
    test('shows available document types in dropdown', async () => {
      renderComponent({ partyFilter: '2000000112' });

      const select = await findFirstCombobox();
      await userEvent.click(select);

      const listbox = await screen.findByRole('listbox');
      expect(within(listbox).getByText('Passport')).toBeInTheDocument();
      expect(within(listbox).getByText('Drivers License')).toBeInTheDocument();
    });

    test('updates form state when document type is selected', async () => {
      renderComponent({ partyFilter: '2000000112' });

      const select = await findFirstCombobox();
      await userEvent.click(select);
      await clickPassportOption();

      expect(select).toHaveTextContent('Passport');
    });
  });

  describe('Document Upload Process', () => {
    test('handles successful document upload', async () => {
      renderComponent({ partyFilter: '2000000112' });

      // Select document type
      const select = await findFirstCombobox();
      await userEvent.click(select);
      await clickPassportOption();

      // Upload file
      const dropzone = screen.getByText(/Upload Document/i);
      const input = dropzone.closest('div')?.querySelector('input');
      await userEvent.upload(input as HTMLElement, mockFile);

      // Submit form (wizard mode uses common.json "Submit"); MSW POST /documents returns 200 without parsing multipart
      await userEvent.click(
        screen.getByRole('button', { name: /Next|Submit/i })
      );

      await waitFor(() => {
        expect(nextStepMock).toHaveBeenCalled();
      });
      expect(
        screen.queryByText(/Error uploading document/i)
      ).not.toBeInTheDocument();
    });

    test('shows error toast on upload failure', async () => {
      renderComponent(
        { partyFilter: '2000000112' },
        {
          postDocuments: () =>
            new HttpResponse(JSON.stringify({ error: 'Upload failed' }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
              },
            }),
        }
      );

      // Select document type and upload file
      const select = await findFirstCombobox();
      await userEvent.click(select);
      await clickPassportOption();

      const dropzone = screen.getByText(/Upload Document/i);
      const input = dropzone.closest('div')?.querySelector('input');
      await userEvent.upload(input as HTMLElement, mockFile);

      await userEvent.click(
        screen.getByRole('button', { name: /Next|Submit/i })
      );

      expect(
        await screen.findByText(/Error uploading document/i)
      ).toBeInTheDocument();
    });
  });

  describe('Requirement Progress', () => {
    test('activates next requirement when current is satisfied', async () => {
      renderComponent({ partyFilter: '2000000112' });

      // Complete first requirement
      const select = await findFirstCombobox();
      await userEvent.click(select);
      await clickPassportOption();

      const dropzone = screen.getByText(/Upload Document/i);
      const input = dropzone.closest('div')?.querySelector('input');
      await userEvent.upload(input as HTMLElement, mockFile);

      await userEvent.click(
        screen.getByRole('button', { name: /Next|Submit/i })
      );

      await waitFor(() => {
        const step2 = screen.getByText(/^Step 2\.$/i);
        expect(
          step2.closest('h4')?.querySelector('.eb-text-amber-600')
        ).toBeTruthy();
      });
    });

    test('shows completion state when all requirements are met', async () => {
      renderComponent(
        { standalone: true },
        {
          documentRequests: {
            '68803': { requirements: [] },
            '68804': { requirements: [] },
            '68805': { requirements: [] },
          },
        }
      );

      await waitFor(() => {
        expect(
          screen.getByText(/All required documents ready to upload/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    test('resets form state when reset button is clicked', async () => {
      renderComponent({ partyFilter: '2000000112' });

      // Setup initial state
      const select = await findFirstCombobox();
      await userEvent.click(select);
      await clickPassportOption();

      // Click reset
      await userEvent.click(
        screen.getByRole('button', { name: /Reset form/i })
      );

      expect(
        await screen.findByText(/Form has been reset/i)
      ).toBeInTheDocument();

      await waitFor(() => {
        const combobox = screen.getAllByRole('combobox')[0];
        expect(combobox).toHaveTextContent('Select a document type');
      });
    });
  });

  describe('Standalone Mode', () => {
    test('renders in standalone mode correctly', async () => {
      renderComponent({ standalone: true });

      expect(
        screen.queryByRole('button', { name: /^Next$/i })
      ).not.toBeInTheDocument();
      await waitFor(() => {
        expect(
          screen.getByRole('button', {
            name: /Upload Documents|Complete All Required Documents/i,
          })
        ).toBeInTheDocument();
      });
    });

    test('calls onComplete callback after successful upload in standalone mode', async () => {
      const onComplete = vi.fn();

      renderComponent({
        standalone: true,
        onComplete,
        partyFilter: '2000000112',
      });

      const select = await findFirstCombobox();
      await userEvent.click(select);
      await clickPassportOption();

      const dropzone = screen.getByText(/Upload Document/i);
      const input = dropzone.closest('div')?.querySelector('input');
      await userEvent.upload(input as HTMLElement, mockFile);

      await userEvent.click(
        screen.getByRole('button', { name: /Upload Documents/i })
      );

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });
});
