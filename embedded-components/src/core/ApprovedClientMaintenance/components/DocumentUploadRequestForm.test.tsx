import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { DocumentRequestResponse } from '@/api/generated/smbdo.schemas';

import { DocumentUploadRequestForm } from './DocumentUploadRequestForm';

const uploadDocument = vi.fn();
const submitDocumentRequest = vi.fn();
const resetUpload = vi.fn();
const resetSubmit = vi.fn();

vi.mock('@/api/generated/smbdo', () => ({
  useSmbdoUploadDocument: () => ({
    mutateAsync: uploadDocument,
    error: null,
    reset: resetUpload,
  }),
  useSmbdoSubmitDocumentRequest: () => ({
    mutateAsync: submitDocumentRequest,
    error: null,
    reset: resetSubmit,
  }),
}));

const documentRequest: DocumentRequestResponse = {
  id: 'document-request-1',
  status: 'ACTIVE',
  requirements: [
    {
      documentTypes: ['BUSINESS_LICENSE'],
      minRequired: 1,
    },
  ],
};

describe('DocumentUploadRequestForm', () => {
  beforeEach(() => vi.clearAllMocks());

  test('uploads selected files, submits the request, and completes inline', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onComplete = vi.fn();
    render(
      <DocumentUploadRequestForm
        documentRequest={documentRequest}
        onCancel={vi.fn()}
        onComplete={onComplete}
      />
    );

    const resetButton = screen.getByRole('button', { name: 'Reset form' });
    expect(resetButton).toBeDisabled();
    expect(resetButton.closest('.eb-border-t')).toHaveClass(
      'sm:eb-grid-cols-[auto_1fr]'
    );
    await user.click(screen.getByRole('combobox'));
    await user.click(
      await screen.findByRole('option', { name: /business license/i })
    );
    const uploadLabel = screen.getAllByText(/upload document/i)[0];
    const fileInput = uploadLabel
      .closest('div')
      ?.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(
      fileInput,
      new File(['document'], 'license.pdf', { type: 'application/pdf' })
    );
    expect(resetButton).toBeEnabled();

    const submitButton = screen.getByRole('button', {
      name: /upload documents/i,
    });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    await waitFor(() => expect(uploadDocument).toHaveBeenCalledTimes(1));
    expect(uploadDocument).toHaveBeenCalledWith({
      data: {
        documentData: expect.stringContaining('document-request-1'),
        file: expect.any(File),
      },
    });
    expect(submitDocumentRequest).toHaveBeenCalledWith({
      id: 'document-request-1',
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
