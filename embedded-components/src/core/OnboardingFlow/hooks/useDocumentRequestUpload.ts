import { useQueryClient } from '@tanstack/react-query';

import {
  getSmbdoListDocumentRequestsQueryKey,
  useSmbdoSubmitDocumentRequest,
  useSmbdoUploadDocument,
} from '@/api/generated/smbdo';

export type DocumentRequestUpload = {
  documentType: string;
  file: File;
};

type UseDocumentRequestUploadOptions = {
  /** Refreshes the request's client, which each flow caches under its own key. */
  refreshClient: () => Promise<unknown>;
};

/**
 * Uploads documents to one document request, submits it, then refreshes what
 * that changed. The API applies a submit before answering, so a single refresh
 * shows the closed request and the client's new status.
 */
export function useDocumentRequestUpload({
  refreshClient,
}: UseDocumentRequestUploadOptions) {
  const queryClient = useQueryClient();
  const uploadMutation = useSmbdoUploadDocument();
  const submitMutation = useSmbdoSubmitDocumentRequest();

  const uploadAndSubmit = async (
    documentRequestId: string,
    uploads: DocumentRequestUpload[]
  ) => {
    for (const { documentType, file } of uploads) {
      await uploadMutation.mutateAsync({
        data: {
          documentData: JSON.stringify({ documentType, documentRequestId }),
          file,
        },
      });
    }
    await submitMutation.mutateAsync({ id: documentRequestId });

    // Resolves once fresh data is in, so callers can leave without unmounting
    // a refetch mid-flight, which cancels it.
    await Promise.all([
      refreshClient(),
      // Lists refetch even when no screen shows them, so they're current on return.
      queryClient.invalidateQueries({
        queryKey: getSmbdoListDocumentRequestsQueryKey(),
        refetchType: 'all',
      }),
      // The request's own page and its documents refetch when next opened.
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          typeof queryKey[0] === 'string' &&
          (queryKey[0].startsWith('/document-requests/') ||
            queryKey[0].startsWith('/documents')),
        refetchType: 'none',
      }),
    ]);
  };

  const reset = () => {
    uploadMutation.reset();
    submitMutation.reset();
  };

  return {
    uploadAndSubmit,
    uploadError: uploadMutation.error,
    submitError: submitMutation.error,
    reset,
  };
}
