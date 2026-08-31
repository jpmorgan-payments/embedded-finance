import { describe, expect, test } from 'vitest';

import type { DocumentRequestResponse } from '@/api/generated/smbdo.schemas';

import {
  getDocumentUploadSelections,
  isDocumentRequestReady,
} from './documentUploadTasks';

const request: DocumentRequestResponse = {
  id: 'document-request-1',
  requirements: [
    {
      documentTypes: ['DRIVERS_LICENSE', 'PASSPORT'],
      minRequired: 1,
    },
    {
      documentTypes: ['UTILITY_BILL'],
      minRequired: 0,
    },
  ],
};

describe('documentUploadTasks', () => {
  test('extracts selected document types and files by requirement', () => {
    const file = new File(['id'], 'license.png', { type: 'image/png' });
    const uploads = getDocumentUploadSelections(request, {
      'document-request-1': {
        requirement_0_docType: 'DRIVERS_LICENSE',
        requirement_0_files: [file],
      },
    });

    expect(uploads).toEqual([
      {
        documentType: 'DRIVERS_LICENSE',
        file,
        requirementIndex: 0,
      },
    ]);
  });

  test('requires every non-optional requirement', () => {
    expect(isDocumentRequestReady(request, [])).toBe(false);
    expect(
      isDocumentRequestReady(request, [
        {
          documentType: 'DRIVERS_LICENSE',
          file: new File(['id'], 'license.png'),
          requirementIndex: 0,
        },
      ])
    ).toBe(true);
  });
});
