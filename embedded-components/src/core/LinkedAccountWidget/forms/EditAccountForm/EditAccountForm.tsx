import { FC, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  getGetAllRecipientsQueryKey,
  useAmendRecipient,
} from '@/api/generated/ep-recipients';
import { ApiError, Recipient } from '@/api/generated/ep-recipients.schemas';
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
  transformBankAccountFormToRecipientPayload,
  useLinkedAccountEditConfig,
  type BankAccountFormData,
} from '@/components/BankAccountForm';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import { AccountConfirmation } from '../../components/AccountConfirmation';

type EditAccountFormDialogTriggerProps = {
  children: ReactNode;
  recipient: Recipient;
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;
};

/**
 * EditAccountFormDialogTrigger - Dialog for editing an existing linked bank account
 */
export const EditAccountFormDialogTrigger: FC<
  EditAccountFormDialogTriggerProps
> = ({ children, recipient, onLinkedAccountSettled }) => {
  const { t } = useTranslation('linked-accounts');
  const linkedAccountEditConfig = useLinkedAccountEditConfig();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    mutate: amendRecipient,
    reset: resetAmendRecipient,
    status: amendRecipientStatus,
    data: amendRecipientResponse,
    error: amendRecipientError,
  } = useAmendRecipient({
    mutation: {
      onSuccess: (response) => {
        queryClient.invalidateQueries({
          queryKey: getGetAllRecipientsQueryKey({}),
        });
        onLinkedAccountSettled?.(response);
      },
      onError: (error) => {
        const apiError = error.response?.data as ApiError;
        onLinkedAccountSettled?.(undefined, apiError);
      },
    },
  });

  const handleSubmit = (data: BankAccountFormData) => {
    // Transform form data to API payload
    const payload = transformBankAccountFormToRecipientPayload(
      data,
      'LINKED_ACCOUNT'
    );

    // Call amendRecipient with recipient ID and payload
    amendRecipient({
      id: recipient.id,
      data: payload,
    });
  };

  const handleDialogChange = (open: boolean) => {
    if (open) {
      resetAmendRecipient();
    }
    setDialogOpen(open);
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-max-h-[90vh] eb-max-w-2xl eb-overflow-hidden eb-p-0">
        <DialogHeader className="eb-space-y-2 eb-border-b eb-p-6 eb-py-4">
          <DialogTitle className="eb-text-xl">
            {amendRecipientStatus === 'success'
              ? t('forms.editAccount.titleSuccess')
              : t('forms.editAccount.title')}
          </DialogTitle>
          <DialogDescription>
            {amendRecipientStatus === 'success'
              ? amendRecipientResponse?.status
                ? t(`status.messages.${amendRecipientResponse.status}`)
                : t('forms.editAccount.descriptionSuccess')
              : t('forms.editAccount.description')}
          </DialogDescription>
        </DialogHeader>

        {/* Success State */}
        {amendRecipientStatus === 'success' && (
          <div className="eb-p-6">
            <AccountConfirmation recipient={amendRecipientResponse} />
          </div>
        )}

        {/* Form State */}
        {(amendRecipientStatus === 'idle' ||
          amendRecipientStatus === 'error' ||
          amendRecipientStatus === 'pending') && (
          <BankAccountForm
            config={linkedAccountEditConfig}
            recipient={recipient}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={amendRecipientStatus === 'pending'}
            alert={
              <ServerErrorAlert
                error={amendRecipientError}
                showDetails
                customTitle={t('forms.editAccount.error.title')}
              />
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
