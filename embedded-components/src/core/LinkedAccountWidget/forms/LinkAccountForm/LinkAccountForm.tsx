import { FC, ReactNode, useState } from 'react';

import {
  useCreateRecipient,
  useGetAllRecipients,
} from '@/api/generated/ep-recipients';
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
  type BankAccountFormData,
} from '@/components/BankAccountForm';

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

  const {
    mutate: createRecipient,
    reset: resetCreateRecipient,
    status: createRecipientStatus,
    data: createRecipientResponse,
  } = useCreateRecipient();

  const { refetch: refetchRecipients } = useGetAllRecipients();

  const handleSubmit = async (data: BankAccountFormData) => {
    // Build routing information based on selected payment types
    const routingInformation = data.paymentTypes.map((type) => ({
      routingCodeType: type === 'WIRE' ? 'SWIFT' : 'USABA',
      routingNumber: data.routingNumber,
      transactionType: type,
    }));

    // Build request payload
    const payload: any = {
      type: 'LINKED_ACCOUNT',
      partyDetails: {
        type: data.accountType,
        ...(data.accountType === 'INDIVIDUAL'
          ? {
              firstName: data.firstName,
              lastName: data.lastName,
            }
          : {
              businessName: data.businessName,
            }),
      },
      account: {
        type: data.bankAccountType,
        number: data.accountNumber,
        routingInformation,
        countryCode: 'US',
      },
    };

    // Add address if provided (required for Wire/RTP)
    if (data.address) {
      payload.partyDetails.address = {
        addressLine1: data.address.primaryAddressLine,
        addressLine2: data.address.secondaryAddressLine,
        city: data.address.city,
        state: data.address.state,
        postalCode: data.address.postalCode,
        countryCode: data.address.countryCode,
      };
    }

    // Add contacts if provided
    if (data.contacts && data.contacts.length > 0) {
      payload.partyDetails.contacts = data.contacts;
    }

    return new Promise((resolve, reject) => {
      createRecipient(
        { data: payload },
        {
          onSuccess: (response) => {
            refetchRecipients();
            onLinkedAccountSettled?.(response);
            resolve(response);
          },
          onError: (error) => {
            const apiError = error.response?.data as ApiError;
            onLinkedAccountSettled?.(undefined, apiError);
            reject(apiError);
          },
        }
      );
    });
  };

  const handleSuccess = () => {
    // Success is already handled in handleSubmit
  };

  const handleError = () => {
    // Error is already handled in handleSubmit
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
          <BankAccountForm
            config={linkedAccountConfig}
            onSubmit={handleSubmit}
            onSuccess={handleSuccess}
            onError={handleError}
            onCancel={handleCancel}
            isLoading={createRecipientStatus === 'pending'}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
