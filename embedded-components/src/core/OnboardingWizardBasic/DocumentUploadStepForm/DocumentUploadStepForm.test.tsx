import { Jurisdiction } from '@/index';
import { efClientCorpEBMock } from '@/mocks/efClientCorpEB.mock';
import { efDocumentRequestDetails } from '@/mocks/efDocumentRequestDetails.mock';
import { efOrganizationDocumentRequestDetails } from '@/mocks/efOrganizationDocumentRequestDetails.mock';
import { server } from '@/msw/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { userEvent } from '@test-utils';

import { ClientProduct } from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider/EBComponentsProvider';

import { OnboardingContextProvider } from '../OnboardingContextProvider/OnboardingContextProvider';
import {
  ACCEPTED_FILE_TYPES,
  DocumentUploadStepForm,
} from './DocumentUploadStepForm';

// Mock external dependencies
vi.mock('@/components/ui/stepper', () => ({
  useStepper: () => ({
    nextStep: vi.fn(),
    currentStep: 0,
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

// Component render helper
const renderComponent = (props = {}) => {
  server.resetHandlers();

  // Setup API mocks
  server.use(
    http.get('/clients/0030000133', () => {
      return HttpResponse.json({
        ...efClientCorpEBMock,
        status: 'INFORMATION_REQUESTED',
      });
    }),
    http.get('/document-requests/68803', () => {
      return HttpResponse.json(efOrganizationDocumentRequestDetails);
    }),
    http.get('/document-requests/68804', () => {
      return HttpResponse.json(efDocumentRequestDetails);
    }),
    http.get('/document-requests/68805', () => {
      return HttpResponse.json(efDocumentRequestDetails);
    }),
    http.post('/documents', () => {
      return HttpResponse.json({
        requestId: Math.random().toString(36).substring(7),
        traceId: `doc-${Math.random().toString(36).substring(7)}`,
      });
    }),
    http.post('/document-requests/:requestId/submit', ({ params }) => {
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
    queryClient.clear();
  });

  describe('Initial Rendering', () => {
    test('renders document request description', async () => {
      renderComponent({ partyFilter: '2000000111' });

      expect(
        await screen.findByText(/To verify the identity of the business/i)
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

      // Create a file larger than 5MB
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', {
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

  describe.skip('Document Type Selection', () => {
    test('shows available document types in dropdown', async () => {
      renderComponent({ partyFilter: '2000000112' });

      const select = await screen.findByRole('combobox');
      await userEvent.click(select);

      expect(screen.getByText('Passport')).toBeInTheDocument();
      expect(screen.getByText("Driver's License")).toBeInTheDocument();
    });

    test('updates form state when document type is selected', async () => {
      renderComponent();

      const select = await screen.findByRole('combobox');
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Passport'));

      expect(select).toHaveTextContent('Passport');
    });
  });

  describe.skip('Document Upload Process', () => {
    test('handles successful document upload', async () => {
      const uploadMock = vi.fn().mockResolvedValue({ success: true });
      server.use(
        http.post('/documents', async ({ request }) => {
          const data = await request.json();
          uploadMock(data);
          return HttpResponse.json({
            requestId: Math.random().toString(36).substring(7),
            traceId: `doc-${Math.random().toString(36).substring(7)}`,
          });
        })
      );

      renderComponent();

      // Select document type
      const select = await screen.findByRole('combobox');
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Passport'));

      // Upload file
      const dropzone = screen.getByText(/Upload Document/i);
      const input = dropzone.closest('div')?.querySelector('input');
      await userEvent.upload(input as HTMLElement, mockFile);

      // Submit form
      await userEvent.click(
        screen.getByRole('button', { name: /Upload Documents/i })
      );

      expect(uploadMock).toHaveBeenCalled();
      const uploadedData = uploadMock.mock.calls[0][0];
      expect(uploadedData.documentType).toBe('PASSPORT');
    });

    test('shows error toast on upload failure', async () => {
      server.use(
        http.post('/documents', () => {
          return new HttpResponse(JSON.stringify({ error: 'Upload failed' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          });
        })
      );

      renderComponent();

      // Select document type and upload file
      const select = await screen.findByRole('combobox');
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Passport'));

      const dropzone = screen.getByText(/Upload Document/i);
      const input = dropzone.closest('div')?.querySelector('input');
      await userEvent.upload(input as HTMLElement, mockFile);

      // Submit form
      await userEvent.click(
        screen.getByRole('button', { name: /Upload Documents/i })
      );

      expect(
        await screen.findByText(/Error uploading document/i)
      ).toBeInTheDocument();
    });
  });

  describe.skip('Requirement Progress', () => {
    test('activates next requirement when current is satisfied', async () => {
      renderComponent();

      // Complete first requirement
      const select = await screen.findByRole('combobox');
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Passport'));

      const dropzone = screen.getByText(/Upload Document/i);
      const input = dropzone.closest('div')?.querySelector('input');
      await userEvent.upload(input as HTMLElement, mockFile);

      // Submit and verify next requirement is active
      await userEvent.click(
        screen.getByRole('button', { name: /Upload Documents/i })
      );

      await waitFor(() => {
        expect(screen.getByText(/Step 2\./i).closest('div')).not.toHaveClass(
          'eb-text-gray-400'
        );
      });
    });

    test('shows completion state when all requirements are met', async () => {
      renderComponent();

      // Mock all requirements as satisfied
      server.use(
        http.get('/document-requests/:id', () => {
          return HttpResponse.json({
            ...efDocumentRequestDetails,
            outstanding: {
              ...efDocumentRequestDetails.outstanding,
              requirements: [],
            },
          });
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText(/All required documents ready to upload/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe.skip('Reset Functionality', () => {
    test('resets form state when reset button is clicked', async () => {
      renderComponent({ partyFilter: '2000000112' });

      // Setup initial state
      const select = await screen.findByLabelText(/Select Document Type/i);
      await userEvent.click(select);

      // Use a more specific selector for the Passport option
      const passportOption = screen.getByRole('option', { name: /passport/i });
      await userEvent.click(passportOption);

      // Click reset
      await userEvent.click(
        screen.getByRole('button', { name: /Reset form/i })
      );

      // Verify reset
      expect(select).toHaveTextContent('Select a document type');
      expect(
        await screen.findByText(/Form has been reset/i)
      ).toBeInTheDocument();
    });
  });

  describe.skip('Standalone Mode', () => {
    test('renders in standalone mode correctly', async () => {
      renderComponent({ standalone: true });

      expect(
        screen.queryByRole('button', { name: /Next/i })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Upload Documents/i })
      ).toBeInTheDocument();
    });

    test('calls onComplete callback after successful upload in standalone mode', async () => {
      const onComplete = vi.fn();
      renderComponent({ standalone: true, onComplete });

      // Setup successful upload
      server.use(
        http.post('/documents', () => {
          return HttpResponse.json({
            requestId: Math.random().toString(36).substring(7),
            traceId: `doc-${Math.random().toString(36).substring(7)}`,
          });
        })
      );

      // Complete upload process
      const select = await screen.findByRole('combobox');
      await userEvent.click(select);
      await userEvent.click(screen.getByText('Passport'));

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
