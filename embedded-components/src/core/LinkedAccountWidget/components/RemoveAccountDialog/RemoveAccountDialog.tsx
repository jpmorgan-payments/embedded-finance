import { FC, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangleIcon, Loader2Icon } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { getRecipientDisplayName } from '@/lib/recipientHelpers';
import {
  getGetAllRecipientsQueryKey,
  useAmendRecipient,
} from '@/api/generated/ep-recipients';
import {
  ApiError,
  ListRecipientsResponse,
  Recipient,
} from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

type RemoveAccountDialogTriggerProps = {
  children: ReactNode;
  recipient: Recipient;
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;
  onRemoveSuccess?: (recipient: Recipient) => void;
};

/**
 * RemoveAccountDialogTrigger - Confirmation dialog for removing a linked bank account
 * Sets the recipient status to 'INACTIVE' using amendRecipient
 *
 * The success state is now handled at the LinkedAccountWidget level via onRemoveSuccess callback
 * to ensure the success dialog persists after the account card is removed.
 */
export const RemoveAccountDialogTrigger: FC<
  RemoveAccountDialogTriggerProps
> = ({ children, recipient, onLinkedAccountSettled, onRemoveSuccess }) => {
  const { t } = useTranslation('linked-accounts');
  const [isDialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    mutate: amendRecipient,
    reset: resetAmendRecipient,
    status: amendRecipientStatus,
    error: amendRecipientError,
  } = useAmendRecipient({
    mutation: {
      onSuccess: (response) => {
        const queryKey = getGetAllRecipientsQueryKey({
          type: 'LINKED_ACCOUNT',
        });
        queryClient.setQueryData(
          queryKey,
          (oldData: ListRecipientsResponse | undefined) => {
            if (!oldData?.recipients) return null;

            return {
              ...oldData,
              recipients: oldData.recipients.filter(
                (r) => r.id !== response.id
              ),
            };
          }
        );
        queryClient.invalidateQueries({
          queryKey,
        });
        onLinkedAccountSettled?.(response);
        // Close the confirmation dialog and trigger parent success dialog
        setDialogOpen(false);
        onRemoveSuccess?.(response);
      },
      onError: (error) => {
        const apiError = error.response?.data as ApiError;
        onLinkedAccountSettled?.(undefined, apiError);
      },
    },
  });

  const handleRemove = () => {
    // Set status to INACTIVE to remove the account
    amendRecipient({
      id: recipient.id,
      data: {
        status: 'INACTIVE',
      },
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
      <DialogContent className="eb-max-w-md eb-space-y-4">
        <DialogHeader className="eb-space-y-3">
          <div className="eb-flex eb-items-center eb-gap-3 eb-font-header">
            <div className="eb-flex eb-h-10 eb-w-10 eb-items-center eb-justify-center eb-rounded-full eb-bg-destructive/10">
              <AlertTriangleIcon className="eb-h-5 eb-w-5 eb-text-destructive" />
            </div>
            <DialogTitle className="eb-text-xl">
              {t('forms.removeAccount.title')}
            </DialogTitle>
          </div>
          <DialogDescription>
            <Trans
              i18nKey="forms.removeAccount.description"
              ns="linked-accounts"
              values={{ name: getRecipientDisplayName(recipient) }}
              components={{ strong: <strong /> }}
            />
          </DialogDescription>
        </DialogHeader>

        {amendRecipientStatus === 'error' && (
          <ServerErrorAlert
            error={amendRecipientError}
            showDetails
            customTitle={t('forms.removeAccount.error.title')}
          />
        )}

        <DialogFooter className="eb-gap-2 sm:eb-gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={amendRecipientStatus === 'pending'}
          >
            {t('forms.removeAccount.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={amendRecipientStatus === 'pending'}
            className="eb-gap-2"
          >
            {amendRecipientStatus === 'pending' && (
              <Loader2Icon className="eb-h-4 eb-w-4 eb-animate-spin" />
            )}
            {amendRecipientStatus === 'pending'
              ? t('forms.removeAccount.removing')
              : t('forms.removeAccount.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
