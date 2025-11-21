import { useCallback } from 'react';

import {
  useAmendRecipient,
  useCreateRecipient,
} from '@/api/generated/ep-recipients';
import type {
  Recipient,
  RecipientRequest,
  UpdateRecipientRequest,
} from '@/api/generated/ep-recipients.schemas';

export interface UseRecipientsMutationsOptions {
  onRecipientCreated?: (recipient: Recipient) => void;
  onRecipientUpdated?: (recipient: Recipient) => void;
  onRecipientDeactivated?: (recipient: Recipient) => void;
  userEventsHandler?: ({ actionName }: { actionName: string }) => void;
  onSuccess?: () => void;
  refetch?: () => void;
}

export interface UseRecipientsMutationsReturn {
  createRecipient: (data: RecipientRequest) => void;
  updateRecipient: (id: string, data: UpdateRecipientRequest) => void;
  deactivateRecipient: (id: string) => void;
  isCreating: boolean;
  isUpdating: boolean;
  isDeactivating: boolean;
}

/**
 * Hook for managing recipient mutations (create, update, deactivate)
 */
export function useRecipientsMutations(
  options: UseRecipientsMutationsOptions = {}
): UseRecipientsMutationsReturn {
  const {
    onRecipientCreated,
    onRecipientUpdated,
    onRecipientDeactivated,
    userEventsHandler,
    onSuccess,
    refetch,
  } = options;

  const createRecipientMutation = useCreateRecipient({
    mutation: {
      onSuccess: (data) => {
        refetch?.();
        onSuccess?.();
        onRecipientCreated?.(data);
        userEventsHandler?.({ actionName: 'recipient_created' });
      },
      onError: (error) => {
        console.error('Failed to create recipient:', error);
      },
    },
  });

  const updateRecipientMutation = useAmendRecipient({
    mutation: {
      onSuccess: (data) => {
        refetch?.();
        onSuccess?.();
        onRecipientUpdated?.(data);
        userEventsHandler?.({ actionName: 'recipient_updated' });
      },
      onError: (error) => {
        console.error('Failed to update recipient:', error);
      },
    },
  });

  const deactivateRecipientMutation = useAmendRecipient({
    mutation: {
      onSuccess: (data) => {
        refetch?.();
        onSuccess?.();
        onRecipientDeactivated?.(data);
        userEventsHandler?.({ actionName: 'recipient_deactivated' });
      },
      onError: (error) => {
        console.error('Failed to deactivate recipient:', error);
      },
    },
  });

  const createRecipient = useCallback(
    (data: RecipientRequest) => {
      createRecipientMutation.mutate({ data });
    },
    [createRecipientMutation]
  );

  const updateRecipient = useCallback(
    (id: string, data: UpdateRecipientRequest) => {
      updateRecipientMutation.mutate({ id, data });
    },
    [updateRecipientMutation]
  );

  const deactivateRecipient = useCallback(
    (id: string) => {
      deactivateRecipientMutation.mutate({
        id,
        data: { status: 'INACTIVE' },
      });
    },
    [deactivateRecipientMutation]
  );

  return {
    createRecipient,
    updateRecipient,
    deactivateRecipient,
    isCreating: createRecipientMutation.isPending,
    isUpdating: updateRecipientMutation.isPending,
    isDeactivating: deactivateRecipientMutation.isPending,
  };
}
