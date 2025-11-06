import { FC, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useCreateRecipient } from '@/api/generated/ep-recipients';
import { ApiError, Recipient } from '@/api/generated/ep-recipients.schemas';
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
import {
  BankAccountForm,
  linkedAccountConfig,
  transformBankAccountFormToRecipientPayload,
  type BankAccountFormData,
} from '@/components/BankAccountForm';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import { RECIPIENT_STATUS_MESSAGES } from '../../LinkedAccountWidget.constants';
import { LinkAccountConfirmation } from './LinkAccountConfirmation';

type LinkAccountFormDialogTriggerProps = {
  children: ReactNode;
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;
};

/**
 * LinkAccountFormDialogTrigger - Dialog for linking a new bank account
 * Follows OnboardingFlow patterns for form structure and validation
 */
export const LinkAccountFormDialogTrigger: FC<
  LinkAccountFormDialogTriggerProps
> = ({ children, onLinkedAccountSettled }) => {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    mutate: createRecipient,
    reset: resetCreateRecipient,
    status: createRecipientStatus,
    data: createRecipientResponse,
    error: createRecipientError,
  } = useCreateRecipient({
    mutation: {
      onSuccess: (response) => {
        queryClient.invalidateQueries({ queryKey: ['getAllRecipients'] });
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
      'RECIPIENT'
    );

    createRecipient({ data: payload });
  };

  const handleDialogChange = (open: boolean) => {
    if (open) {
      resetCreateRecipient();
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
            {createRecipientStatus === 'success'
              ? 'Account Linked Successfully'
              : linkedAccountConfig.content.title}
          </DialogTitle>
          <DialogDescription>
            {createRecipientStatus === 'success'
              ? (RECIPIENT_STATUS_MESSAGES[
                  createRecipientResponse?.status ?? ''
                ] ?? linkedAccountConfig.content.successDescription)
              : linkedAccountConfig.content.description}
          </DialogDescription>
        </DialogHeader>

        {/* Success State */}
        {createRecipientStatus === 'success' && (
          <div className="eb-px-6 eb-pb-6">
            <LinkAccountConfirmation recipient={createRecipientResponse} />
            <DialogFooter className="eb-mt-6">
              <DialogClose asChild>
                <Button className="eb-w-full">Done</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        )}

        {/* Form State */}
        {(createRecipientStatus === 'idle' ||
          createRecipientStatus === 'error' ||
          createRecipientStatus === 'pending') && (
          <>
            <div className="eb-px-6">
              <ServerErrorAlert
                className="eb-mt-4"
                error={createRecipientError}
                showDetails
                customTitle="Unable to link account"
              />
            </div>
            <BankAccountForm
              config={linkedAccountConfig}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={createRecipientStatus === 'pending'}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
