import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { DocumentRequestResponse } from '@/api/generated/smbdo.schemas';

import { MaintenanceDocumentView } from './MaintenanceDocumentView';

const getDocumentRequest = vi.fn();

vi.mock('@/api/generated/smbdo', () => ({
  useSmbdoGetDocumentRequest: () => getDocumentRequest(),
  useSmbdoUploadDocument: () => ({
    mutateAsync: vi.fn(),
    error: null,
    reset: vi.fn(),
  }),
  useSmbdoSubmitDocumentRequest: () => ({
    mutateAsync: vi.fn(),
    error: null,
    reset: vi.fn(),
  }),
}));

const summary = {
  id: 'document-1',
  partyId: 'person-1',
  status: 'ACTIVE',
  description: 'Upload a clear identity document.',
  requirements: [
    {
      description: 'The document must include all pages.',
      documentTypes: ['PASSPORT'],
      minRequired: 1,
    },
  ],
} as unknown as DocumentRequestResponse;

describe('MaintenanceDocumentView', () => {
  beforeEach(() => {
    getDocumentRequest.mockReturnValue({
      data: {
        id: 'document-1',
        partyId: 'person-1',
        status: 'ACTIVE',
        requirements: [
          {
            documentTypes: ['PASSPORT'],
            minRequired: 1,
          },
        ],
      },
      error: null,
      isPending: false,
    });
  });

  test('preserves request and requirement descriptions from the list response', async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();

    render(
      <MaintenanceDocumentView
        documentRequestId="document-1"
        documentRequestSummary={summary}
        entityName="Jane Doe"
        breadcrumbs={[
          { label: 'Business profile', onSelect: vi.fn() },
          { label: 'Maintenance request details', onSelect: onBack },
          { label: 'Documents to upload' },
        ]}
        onBack={onBack}
        onComplete={vi.fn()}
      />
    );

    const requestDescription = screen.getByText(
      'Upload a clear identity document.'
    );
    const uploadGuidanceHeading = screen.getByRole('heading', {
      name: 'What you need to provide',
    });
    expect(uploadGuidanceHeading.closest('section')).toContainElement(
      requestDescription
    );
    expect(requestDescription).toBeInTheDocument();
    expect(requestDescription.parentElement).toHaveClass(
      'eb-leading-6',
      '[&>*:last-child]:eb-mb-0'
    );
    expect(requestDescription.parentElement?.parentElement).toHaveClass(
      'eb-py-3'
    );
    const requirementDescription = screen.getByRole('heading', {
      name: 'The document must include all pages.',
    });
    expect(requirementDescription).toBeInTheDocument();
    expect(uploadGuidanceHeading.closest('section')).not.toContainElement(
      requirementDescription
    );

    await user.click(
      screen.getByRole('button', { name: 'Maintenance request details' })
    );
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
