import { useQueryClient } from '@tanstack/react-query';

import {
  getGetAllRecipientsQueryKey,
  useAmendRecipient,
  useCreateRecipient,
} from '@/api/generated/ep-recipients';
import {
  ApiError,
  ListRecipientsResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';
import {
  BankAccountFormData,
  transformBankAccountFormToRecipientPayload,
} from '@/components/BankAccountForm';

/**
 * Mode for the linked account form - create new or edit existing
 */
export type LinkedAccountFormMode = 'create' | 'edit';

/**
 * Hook options for linked account form
 */
export interface UseLinkedAccountFormOptions {
  /** Mode - create or edit */
  mode: LinkedAccountFormMode;

  /** Recipient ID (required for edit mode) */
  recipientId?: string;

  /** Callback when operation succeeds */
  onSuccess?: (recipient?: Recipient) => void;

  /** Callback when operation fails */
  onError?: (error?: ApiError) => void;

  /** Callback when operation is settled (success or error) */
  onSettled?: (recipient?: Recipient, error?: ApiError) => void;
}

/**
 * Return type for useLinkedAccountForm hook
 */
export interface UseLinkedAccountFormReturn {
  /** Submit the form data - properly typed to accept BankAccountFormData */
  submit: (data: BankAccountFormData) => void;

  /** Reset the form state */
  reset: () => void;

  /** Current mutation status */
  status: 'idle' | 'pending' | 'success' | 'error';

  /** Response data if successful */
  data?: Recipient;

  /** Error if failed */
  error: Error | null;

  /** Whether the mutation is pending */
  isPending: boolean;

  /** Whether the mutation was successful */
  isSuccess: boolean;

  /** Whether the mutation resulted in an error */
  isError: boolean;
}

/**
 * Custom hook for managing linked account form state and mutations
 *
 * This hook is SPECIFIC to LinkedAccountWidget and always creates/edits
 * recipients with type='LINKED_ACCOUNT'. It encapsulates the common logic
 * between creating and editing linked accounts.
 *
 * @example
 * ```tsx
 * const { submit, status, error } = useLinkedAccountForm({
 *   mode: 'create',
 *   onSettled: (recipient, error) => {
 *     if (error) {
 *       console.error('Failed:', error);
 *     } else {
 *       console.log('Success:', recipient);
 *     }
 *   }
 * });
 *
 * // Submit automatically includes type: 'LINKED_ACCOUNT'
 * submit(formData);
 * ```
 */
export function useLinkedAccountForm({
  mode,
  recipientId,
  onSuccess,
  onError,
  onSettled,
}: UseLinkedAccountFormOptions): UseLinkedAccountFormReturn {
  const queryClient = useQueryClient();

  // Create mutation for linked accounts
  const createMutation = useCreateRecipient({
    mutation: {
      onSuccess: (response) => {
        // Optimistically add the new recipient to the list
        const queryKey = getGetAllRecipientsQueryKey({
          type: 'LINKED_ACCOUNT',
        });
        queryClient.setQueryData(
          queryKey,
          (oldData: ListRecipientsResponse | undefined) => {
            if (!oldData?.recipients) {
              return {
                recipients: [response],
              };
            }

            return {
              ...oldData,
              recipients: [...oldData.recipients, response],
            };
          }
        );
        queryClient.invalidateQueries({
          queryKey,
        });
        onSuccess?.(response);
        onSettled?.(response);
      },
      onError: (error) => {
        const apiError = error.response?.data as ApiError;
        onError?.(apiError);
        onSettled?.(undefined, apiError);
      },
    },
  });

  // Edit mutation for linked accounts
  const editMutation = useAmendRecipient({
    mutation: {
      onSuccess: (response) => {
        // Optimistically update the recipient in the list
        const queryKey = getGetAllRecipientsQueryKey({
          type: 'LINKED_ACCOUNT',
        });
        queryClient.setQueryData(
          queryKey,
          (oldData: ListRecipientsResponse | undefined) => {
            if (!oldData?.recipients) return oldData;

            return {
              ...oldData,
              recipients: oldData.recipients.map((r) =>
                r.id === response.id ? response : r
              ),
            };
          }
        );
        queryClient.invalidateQueries({
          queryKey,
        });
        onSuccess?.(response);
        onSettled?.(response);
      },
      onError: (error) => {
        const apiError = error.response?.data as ApiError;
        onError?.(apiError);
        onSettled?.(undefined, apiError);
      },
    },
  });

  // Select the appropriate mutation based on mode
  const mutation = mode === 'create' ? createMutation : editMutation;

  // Submit handler - ensures type is always LINKED_ACCOUNT
  const submit = (data: BankAccountFormData) => {
    if (mode === 'create') {
      // Create: Use full RecipientRequest with type field
      const createPayload = transformBankAccountFormToRecipientPayload(
        data,
        'LINKED_ACCOUNT'
      );
      createMutation.mutate({ data: createPayload });
    } else if (mode === 'edit' && recipientId) {
      // Edit: Use UpdateRecipientRequest (no type field, only account/partyDetails)
      const updatePayload = transformBankAccountFormToRecipientPayload(
        data,
        'LINKED_ACCOUNT'
      );

      // Extract only the fields allowed in UpdateRecipientRequest
      const { account, partyDetails } = updatePayload;

      editMutation.mutate({
        id: recipientId,
        data: { account, partyDetails },
      });
    } else {
      // eslint-disable-next-line no-console
      console.error('Edit mode requires recipientId');
    }
  };

  return {
    submit,
    reset: mutation.reset,
    status: mutation.status,
    data: mutation.data,
    error: mutation.error,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
  };
}
