import { useQueryClient } from '@tanstack/react-query';

import {
  useAmendRecipient,
  useCreateRecipient,
} from '@/api/generated/ep-recipients';
import { ApiError, Recipient } from '@/api/generated/ep-recipients.schemas';

import {
  BankAccountFormData,
  transformBankAccountFormToRecipientPayload,
} from '../components/BankAccountForm';
import { SupportedRecipientType } from '../types';
import { invalidateRecipientQueries } from '../utils';

/**
 * Mode for the recipient form - create new or edit existing
 */
export type RecipientFormMode = 'create' | 'edit';

/**
 * Hook options for recipient form
 */
export interface UseRecipientFormOptions {
  /** Mode - create or edit */
  mode: RecipientFormMode;

  /** Recipient ID (required for edit mode) */
  recipientId?: string;

  /**
   * Type of recipient to create/edit (required)
   */
  recipientType: SupportedRecipientType;

  /** Callback when operation succeeds */
  onSuccess?: (recipient?: Recipient) => void;

  /** Callback when operation fails */
  onError?: (error?: ApiError) => void;

  /** Callback when operation is settled (success or error) */
  onSettled?: (recipient?: Recipient, error?: ApiError) => void;
}

/**
 * Return type for useRecipientForm hook
 */
export interface UseRecipientFormReturn {
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
 * Custom hook for managing recipient form state and mutations
 *
 * This hook encapsulates the common logic between creating and editing recipients
 * of any supported type (LINKED_ACCOUNT, RECIPIENT, and future SETTLEMENT_ACCOUNT).
 *
 * @example
 * ```tsx
 * const { submit, status, error } = useRecipientForm({
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
 * // Submit automatically includes the configured type
 * submit(formData);
 *
 * // Or create a RECIPIENT type
 * const { submit } = useRecipientForm({
 *   mode: 'create',
 *   recipientType: 'RECIPIENT',
 * });
 * ```
 */
export function useRecipientForm({
  mode,
  recipientId,
  recipientType,
  onSuccess,
  onError,
  onSettled,
}: UseRecipientFormOptions): UseRecipientFormReturn {
  const queryClient = useQueryClient();

  // Create mutation for recipients
  const createMutation = useCreateRecipient({
    mutation: {
      onSuccess: (response) => {
        // Invalidate queries for the recipient type
        invalidateRecipientQueries(queryClient, recipientType);
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

  // Edit mutation for recipients
  const editMutation = useAmendRecipient({
    mutation: {
      onSuccess: (response) => {
        // Invalidate queries for the recipient type
        invalidateRecipientQueries(queryClient, recipientType);
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

  // Submit handler - uses the specified recipient type
  const submit = (data: BankAccountFormData) => {
    if (mode === 'create') {
      // Create: Use full RecipientRequest with type field
      const createPayload = transformBankAccountFormToRecipientPayload(
        data,
        recipientType
      );
      createMutation.mutate({ data: createPayload });
    } else if (mode === 'edit' && recipientId) {
      // Edit: Use UpdateRecipientRequest (no type field, only account/partyDetails)
      const updatePayload = transformBankAccountFormToRecipientPayload(
        data,
        recipientType
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
