import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Recipient } from '@/api/generated/ep-recipients.schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  BankAccountForm,
  useLinkedAccountConfig,
  useLinkedAccountEditConfig,
  type BankAccountFormData,
} from '@/components/BankAccountForm';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import { useLinkedAccountForm, type LinkedAccountFormMode } from '../../hooks';
import { AccountConfirmation } from '../AccountConfirmation/AccountConfirmation';

/**
 * Props for LinkedAccountFormDialog component
 */
export interface LinkedAccountFormDialogProps {
  /** Dialog trigger element */
  children: ReactNode;

  /** Form mode - create or edit */
  mode: LinkedAccountFormMode;

  /** Recipient data (required for edit mode) */
  recipient?: Recipient;

  /** Client ID for API requests */
  clientId?: string;

  /** Whether dialog is open (controlled mode) */
  open?: boolean;

  /** Callback when dialog open state changes (controlled mode) */
  onOpenChange?: (open: boolean) => void;

  /** Callback when form submission is settled */
  onLinkedAccountSettled?: (recipient?: Recipient, error?: any) => void;
}

/**
 * LinkedAccountFormDialog - Dialog component for creating and editing linked accounts
 *
 * This component consolidates the common logic between LinkAccountForm and EditAccountForm,
 * reducing code duplication and improving maintainability. It is SPECIFIC to LinkedAccountWidget
 * and automatically handles type='LINKED_ACCOUNT'.
 *
 * @example
 * ```tsx
 * // Create mode
 * <LinkedAccountFormDialog mode="create" onLinkedAccountSettled={handleSettled}>
 *   <Button>Create Account</Button>
 * </LinkedAccountFormDialog>
 *
 * // Edit mode
 * <LinkedAccountFormDialog
 *   mode="edit"
 *   recipient={existingRecipient}
 *   onLinkedAccountSettled={handleSettled}
 * >
 *   <Button>Edit Account</Button>
 * </LinkedAccountFormDialog>
 * ```
 */
export const LinkedAccountFormDialog: FC<LinkedAccountFormDialogProps> = ({
  children,
  mode,
  recipient,
  clientId,
  open,
  onOpenChange,
  onLinkedAccountSettled,
}) => {
  const { t } = useTranslation('linked-accounts');

  // Get appropriate config based on mode
  const createConfig = useLinkedAccountConfig();
  const editConfig = useLinkedAccountEditConfig();
  const config = mode === 'create' ? createConfig : editConfig;

  // Use the LinkedAccount-specific form hook
  const {
    submit,
    reset,
    status,
    data: responseData,
    error: formError,
  } = useLinkedAccountForm({
    mode,
    recipientId: recipient?.id,
    clientId,
    onSettled: onLinkedAccountSettled,
  });

  // Handle form submission - submit already transforms and adds type='LINKED_ACCOUNT'
  const handleSubmit = (data: BankAccountFormData) => {
    submit(data);
  };

  // Handle dialog open/close
  const handleDialogChange = (isOpen: boolean) => {
    if (isOpen) {
      reset();
    }
    onOpenChange?.(isOpen);
  };

  // Handle cancel action
  const handleCancel = () => {
    onOpenChange?.(false);
  };

  // Get translation keys based on mode
  const translationKey = mode === 'create' ? 'linkAccount' : 'editAccount';

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-max-h-[90vh] eb-max-w-2xl eb-overflow-hidden eb-p-0">
        <DialogHeader className="eb-space-y-2 eb-border-b eb-p-6 eb-py-4">
          <DialogTitle className="eb-text-xl">
            {status === 'success'
              ? t(`forms.${translationKey}.titleSuccess`)
              : t(`forms.${translationKey}.title`)}
          </DialogTitle>
          <DialogDescription>
            {status === 'success'
              ? responseData?.status
                ? t(`status.messages.${responseData.status}`)
                : t(`forms.${translationKey}.descriptionSuccess`)
              : t(`forms.${translationKey}.description`)}
          </DialogDescription>
        </DialogHeader>

        {/* Success State */}
        {status === 'success' && responseData && (
          <div className="eb-p-6">
            <AccountConfirmation recipient={responseData} />
          </div>
        )}

        {/* Form State */}
        {(status === 'idle' || status === 'error' || status === 'pending') && (
          <BankAccountForm
            config={config}
            recipient={mode === 'edit' ? recipient : undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={status === 'pending'}
            alert={
              formError ? (
                <ServerErrorAlert
                  error={formError as any}
                  showDetails
                  customTitle={t(`forms.${translationKey}.error.title`)}
                />
              ) : undefined
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
