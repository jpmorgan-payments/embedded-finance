import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  getSmbdoGetDocumentRequestQueryKey,
  getSmbdoListDocumentRequestsQueryKey,
} from '@/api/generated/smbdo';

import { useDocumentRequestUpload } from './useDocumentRequestUpload';

const uploadDocument = vi.fn();
const submitDocumentRequest = vi.fn();

vi.mock('@/api/generated/smbdo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/generated/smbdo')>()),
  useSmbdoUploadDocument: () => ({
    mutateAsync: uploadDocument,
    error: null,
    reset: vi.fn(),
  }),
  useSmbdoSubmitDocumentRequest: () => ({
    mutateAsync: submitDocumentRequest,
    error: null,
    reset: vi.fn(),
  }),
}));

const listKey = getSmbdoListDocumentRequestsQueryKey({ clientId: 'client-1' });
const detailKey = getSmbdoGetDocumentRequestQueryKey('request-1');

function setup() {
  const queryClient = new QueryClient();
  const listFetch = vi.fn().mockResolvedValue({ documentRequests: [] });
  const detailFetch = vi.fn().mockResolvedValue({ id: 'request-1' });
  queryClient.setQueryDefaults(listKey, { queryFn: listFetch });
  queryClient.setQueryDefaults(detailKey, { queryFn: detailFetch });
  queryClient.setQueryData(listKey, { documentRequests: [] });
  queryClient.setQueryData(detailKey, { id: 'request-1' });
  const refreshClient = vi.fn().mockResolvedValue(undefined);
  const { result } = renderHook(
    () => useDocumentRequestUpload({ refreshClient }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    }
  );
  return { queryClient, result, refreshClient, listFetch, detailFetch };
}

describe('useDocumentRequestUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadDocument.mockResolvedValue({});
    submitDocumentRequest.mockResolvedValue({});
  });

  test('uploads each file with its type, submits, then refreshes what changed', async () => {
    const { queryClient, result, refreshClient, listFetch, detailFetch } =
      setup();
    const license = new File(['license'], 'license.pdf');
    const articles = new File(['articles'], 'articles.pdf');

    await act(() =>
      result.current.uploadAndSubmit('request-1', [
        { documentType: 'BUSINESS_LICENSE', file: license },
        { documentType: 'ARTICLES_OF_INCORPORATION', file: articles },
      ])
    );

    expect(uploadDocument.mock.calls.map(([request]) => request)).toEqual([
      {
        data: {
          documentData: JSON.stringify({
            documentType: 'BUSINESS_LICENSE',
            documentRequestId: 'request-1',
          }),
          file: license,
        },
      },
      {
        data: {
          documentData: JSON.stringify({
            documentType: 'ARTICLES_OF_INCORPORATION',
            documentRequestId: 'request-1',
          }),
          file: articles,
        },
      },
    ]);
    expect(submitDocumentRequest).toHaveBeenCalledWith({ id: 'request-1' });
    expect(refreshClient).toHaveBeenCalledTimes(1);
    // Lists refetch even with no screen showing them.
    expect(listFetch).toHaveBeenCalledTimes(1);
    // The request itself is only marked stale, for its next visit.
    expect(detailFetch).not.toHaveBeenCalled();
    expect(queryClient.getQueryState(detailKey)?.isInvalidated).toBe(true);
  });

  test('submits a request that needs no new files', async () => {
    const { result, refreshClient } = setup();

    await act(() => result.current.uploadAndSubmit('request-1', []));

    expect(uploadDocument).not.toHaveBeenCalled();
    expect(submitDocumentRequest).toHaveBeenCalledWith({ id: 'request-1' });
    expect(refreshClient).toHaveBeenCalledTimes(1);
  });

  test('stops before submitting or refreshing when an upload fails', async () => {
    uploadDocument.mockRejectedValueOnce(new Error('Upload failed'));
    const { result, refreshClient, listFetch } = setup();

    await expect(
      act(() =>
        result.current.uploadAndSubmit('request-1', [
          { documentType: 'BUSINESS_LICENSE', file: new File(['a'], 'a.pdf') },
        ])
      )
    ).rejects.toThrow('Upload failed');

    expect(submitDocumentRequest).not.toHaveBeenCalled();
    expect(refreshClient).not.toHaveBeenCalled();
    expect(listFetch).not.toHaveBeenCalled();
  });
});
