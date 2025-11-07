import { FC, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangleIcon } from 'lucide-react';

import { getRecipientDisplayName } from '@/lib/recipientHelpers';
import { useAmendRecipient } from '@/api/generated/ep-recipients';
import { ApiError, Recipient } from '@/api/generated/ep-recipients.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
        queryClient.invalidateQueries({ queryKey: ['getAllRecipients'] });
        onLinkedAccountSettled?.(response);
        // Close dialog after successful removal
        setTimeout(() => {
          setDialogOpen(false);
        }, 1500);
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
            <div className="eb-flex eb-h-10 eb-w-10 eb-items-center eb-justify-center eb-rounded-full eb-bg-destructive/10">
              <AlertTriangleIcon className="eb-h-5 eb-w-5 eb-text-destructive" />
            </div>
            <DialogTitle className="eb-text-xl">Remove Account</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to remove{' '}
            <b>{getRecipientDisplayName(recipient)}</b> from your linked
            accounts?
          </DialogDescription>
        </DialogHeader>

        {amendRecipientStatus === 'success' && (
          <Alert className="eb-border-green-200 eb-bg-green-50">
            <AlertDescription className="eb-text-green-800">
              Account has been successfully removed.
            </AlertDescription>
          </Alert>
        )}

        {amendRecipientStatus === 'error' && (
          <ServerErrorAlert
            error={amendRecipientError}
            showDetails
            customTitle="Unable to remove account"
          />
        )}

        <DialogFooter className="eb-gap-2 sm:eb-gap-0">
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
            disabled={
              amendRecipientStatus === 'pending' ||
              amendRecipientStatus === 'success'
            }
          >
            {amendRecipientStatus === 'pending'
              ? 'Removing...'
              : amendRecipientStatus === 'success'
                ? 'Removed'
                : 'Remove Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
