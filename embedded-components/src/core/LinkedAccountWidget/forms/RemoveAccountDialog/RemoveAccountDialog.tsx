import { FC, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangleIcon, CheckCircle2Icon, Loader2Icon } from 'lucide-react';

import { getRecipientDisplayName } from '@/lib/recipientHelpers';
import {
  getGetAllRecipientsQueryKey,
  useAmendRecipient,
} from '@/api/generated/ep-recipients';
import { ApiError, Recipient } from '@/api/generated/ep-recipients.schemas';
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
};

/**
 * RemoveAccountDialogTrigger - Confirmation dialog for removing a linked bank account
 * Sets the recipient status to 'INACTIVE' using amendRecipient
 */
export const RemoveAccountDialogTrigger: FC<
  RemoveAccountDialogTriggerProps
> = ({ children, recipient, onLinkedAccountSettled }) => {
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
          <div className="eb-flex eb-items-center eb-gap-3">
            {amendRecipientStatus === 'success' ? (
              <div className="eb-flex eb-h-10 eb-w-10 eb-items-center eb-justify-center eb-rounded-full eb-bg-green-100">
                <CheckCircle2Icon className="eb-h-5 eb-w-5 eb-text-green-600" />
              </div>
            ) : (
              <div className="eb-flex eb-h-10 eb-w-10 eb-items-center eb-justify-center eb-rounded-full eb-bg-destructive/10">
                <AlertTriangleIcon className="eb-h-5 eb-w-5 eb-text-destructive" />
              </div>
            )}
            <DialogTitle className="eb-text-xl">
              {amendRecipientStatus === 'success'
                ? 'Account Removed'
                : 'Remove Account'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {amendRecipientStatus === 'success' ? (
              <>
                <b>{getRecipientDisplayName(recipient)}</b> has been
                successfully removed from your linked accounts.
              </>
            ) : (
              <>
                Are you sure you want to remove{' '}
                <b>{getRecipientDisplayName(recipient)}</b> from your linked
                accounts?
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {amendRecipientStatus === 'error' && (
          <ServerErrorAlert
            error={amendRecipientError}
            showDetails
            customTitle="Unable to remove account"
          />
        )}

        <DialogFooter className="eb-gap-2 sm:eb-gap-0">
          {amendRecipientStatus === 'success' ? (
            <Button onClick={handleCancel} className="eb-w-full sm:eb-w-auto">
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={amendRecipientStatus === 'pending'}
              >
                Cancel
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
                  ? 'Removing...'
                  : 'Remove Account'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
