import type {
  Recipient,
  RecipientRequest,
  UpdateRecipientRequest,
} from '@/api/generated/ep-recipients.schemas';

/**
 * Props for RecipientForm component
 *
 * This is a simplified wrapper around BankAccountForm,
 * configured specifically for recipient management.
 */
export interface RecipientFormProps {
  /** Form mode - create or edit */
  mode: 'create' | 'edit';
  /** Existing recipient data (for edit mode) */
  recipient?: Recipient;
  /** Callback when form is submitted */
  onSubmit: (data: RecipientRequest | UpdateRecipientRequest) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Whether the form is in loading state */
  isLoading?: boolean;
  /** Whether to render the Card wrapper (false for dialog usage) */
  showCardWrapper?: boolean;
}
