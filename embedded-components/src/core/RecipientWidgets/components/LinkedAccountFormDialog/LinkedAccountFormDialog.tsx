import { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Recipient } from '@/api/generated/ep-recipients.schemas';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { useClientId } from '@/core/EBComponentsProvider/EBComponentsProvider';

import { useLinkedAccountForm, type LinkedAccountFormMode } from '../../hooks';
import { RecipientI18nNamespace, SupportedRecipientType } from '../../types';
import {
  BankAccountForm,
  useLinkedAccountConfig,
  useLinkedAccountEditConfig,
  useRecipientConfig,
  useRecipientEditConfig,
  type BankAccountFormData,
} from '../BankAccountForm';
import { RecipientAccountDisplayCard } from '../RecipientAccountDisplayCard/RecipientAccountDisplayCard';

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

  /** Whether dialog is open (controlled mode) */
  open?: boolean;

  /** Callback when dialog open state changes (controlled mode) */
  onOpenChange?: (open: boolean) => void;

  /** Callback when form submission is settled */
  onLinkedAccountSettled?: (recipient?: Recipient, error?: any) => void;

  /**
   * Type of recipient to create/edit
   */
  recipientType: SupportedRecipientType;

  /**
   * i18n namespace to use for translations
   */
  i18nNamespace: RecipientI18nNamespace;
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
  open,
  onOpenChange,
  onLinkedAccountSettled,
  recipientType,
  i18nNamespace,
}) => {
  const { t } = useTranslation(i18nNamespace);
  const clientId = useClientId();

  // Fetch client data using the client ID
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');

  // Get appropriate config based on recipientType and mode
  const linkedAccountCreateConfig = useLinkedAccountConfig();
  const linkedAccountEditConfig = useLinkedAccountEditConfig();
  const recipientCreateConfig = useRecipientConfig();
  const recipientEditConfig = useRecipientEditConfig();

  // Select config based on recipientType and mode
  const config =
    recipientType === 'RECIPIENT'
      ? mode === 'create'
        ? recipientCreateConfig
        : recipientEditConfig
      : mode === 'create'
        ? linkedAccountCreateConfig
        : linkedAccountEditConfig;

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
    recipientType,
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

  // Get title based on status
  const getTitle = (): string => {
    if (status === 'success') {
      if (responseData?.status) {
        const statusKey =
          `forms.${translationKey}.titleSuccessByStatus.${responseData.status}` as any;
        return t(statusKey);
      }
      // Fallback to descriptionSuccess if no status
      return t(`forms.${translationKey}.descriptionSuccess`);
    }
    return t(`forms.${translationKey}.title`);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-max-h-full eb-max-w-2xl eb-overflow-hidden eb-p-0 sm:eb-max-h-[90vh]">
        <DialogHeader className="eb-shrink-0 eb-space-y-2 eb-border-b eb-p-6 eb-py-4">
          <DialogTitle className="eb-font-header eb-text-xl">
            {getTitle()}
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
          <div className="eb-space-y-6 eb-p-6">
            <RecipientAccountDisplayCard recipient={responseData} />

            <DialogFooter>
              <DialogClose asChild>
                <Button className="eb-w-full">Done</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        )}

        {/* Form State */}
        {(status === 'idle' || status === 'error' || status === 'pending') && (
          <BankAccountForm
            config={config}
            recipient={recipient}
            client={clientData}
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
