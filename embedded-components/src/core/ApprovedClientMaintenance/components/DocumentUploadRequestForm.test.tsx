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
    expect(resetButton.closest('footer')).toBeNull();
    const cancelButton = screen.getByRole('button', {
      name: 'Cancel upload',
    });
    const footer = cancelButton.closest('footer');
    expect(footer).toHaveClass('eb-border-t', 'eb-py-3');
    expect(footer).not.toHaveClass('eb--mb-4', '@[40rem]:eb--mb-5');
    expect(footer?.closest('form')?.parentElement).toHaveClass(
      'eb-pt-4',
      '@[40rem]:eb-pt-5'
    );
    expect(footer?.closest('form')?.parentElement).not.toHaveClass(
      'eb-p-4',
      '@[40rem]:eb-p-5'
    );
    expect(cancelButton).toHaveClass('eb-border');
    // The only allowed type is shown as a fact, not as a choice.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-document-type-fixed]')
    ).toHaveTextContent(/Document type\s*Business License/);
    expect(resetButton).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Add another document' })
    ).not.toBeInTheDocument();
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

  test('adds optional documents of other allowed types and uploads each with its own type', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(
      <DocumentUploadRequestForm
        documentRequest={{
          id: 'document-request-2',
          status: 'ACTIVE',
          requirements: [
            {
              documentTypes: [
                'BUSINESS_LICENSE',
                'ARTICLES_OF_INCORPORATION',
                'PASSPORT',
              ],
              minRequired: 1,
            },
          ],
        }}
        onCancel={vi.fn()}
        onComplete={vi.fn()}
      />
    );

    // Nothing to add until the required document has a type.
    expect(
      screen.queryByRole('button', { name: 'Add another document' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox'));
    await user.click(
      await screen.findByRole('option', { name: 'Business License' })
    );

    await user.click(
      screen.getByRole('button', { name: 'Add another document' })
    );
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    await user.click(screen.getAllByRole('combobox')[1]);
    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'Articles Of Incorporation',
      'Passport',
    ]);
    await user.click(options[0]);

    // One type left, so the third document takes it without asking.
    await user.click(
      screen.getByRole('button', { name: 'Add another document' })
    );
    const thirdDocument = screen
      .getByRole('button', { name: 'Remove document 3' })
      .closest('div')?.parentElement;
    expect(
      thirdDocument?.querySelector('[data-document-type-fixed]')
    ).toHaveTextContent('Passport');
    expect(screen.getAllByRole('combobox')).toHaveLength(2);
    expect(
      screen.queryByRole('button', { name: 'Add another document' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove document 1' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove document 3' }));
    expect(screen.getAllByRole('combobox')).toHaveLength(2);

    const fileInputs =
      document.querySelectorAll<HTMLInputElement>('input[type="file"]');
    await user.upload(
      fileInputs[0],
      new File(['license'], 'license.pdf', { type: 'application/pdf' })
    );
    await user.upload(
      fileInputs[1],
      new File(['articles'], 'articles.pdf', { type: 'application/pdf' })
    );
    const submitButton = screen.getByRole('button', {
      name: /upload documents/i,
    });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    await waitFor(() => expect(uploadDocument).toHaveBeenCalledTimes(2));
    const uploadedTypes = uploadDocument.mock.calls.map(
      ([request]) => JSON.parse(request.data.documentData).documentType
    );
    expect(uploadedTypes).toEqual([
      'BUSINESS_LICENSE',
      'ARTICLES_OF_INCORPORATION',
    ]);
  });
});
