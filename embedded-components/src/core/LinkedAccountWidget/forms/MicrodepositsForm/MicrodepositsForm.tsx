import { FC, ReactNode, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import { getRecipientDisplayName } from '@/lib/recipientHelpers';
import {
  getGetAllRecipientsQueryKey,
  useGetRecipient,
  useRecipientsVerification,
} from '@/api/generated/ep-recipients';
import {
  ListRecipientsResponse,
  MicrodepositVerificationResponse,
} from '@/api/generated/ep-recipients.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { Form } from '@/components/ui/form';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { StandardFormField } from '@/components/StandardFormField';

import {
  MicrodepositsFormDataType,
  useMicrodepositsFormSchema,
} from './MicrodepositsForm.schema';

type MicrodepositsFormDialogTriggerProps = {
  children: ReactNode;
  recipientId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onVerificationSettled?: (
    response: MicrodepositVerificationResponse,
    recipient?: any
  ) => void;
};

/**
 * MicrodepositsFormDialogTrigger - Dialog for verifying microdeposits
 */
export const MicrodepositsFormDialogTrigger: FC<
  MicrodepositsFormDialogTriggerProps
> = ({
  children,
  recipientId,
  open: controlledOpen,
  onOpenChange,
  onVerificationSettled,
}) => {
  const { t } = useTranslation('linked-accounts');
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isDialogOpen = isControlled ? controlledOpen : uncontrolledOpen;
  const queryClient = useQueryClient();

  const MicrodepositsFormSchema = useMicrodepositsFormSchema();

  const {
    data: recipient,
    isLoading: isRecipientLoading,
    error: recipientError,
  } = useGetRecipient(recipientId);

  const form = useForm<MicrodepositsFormDataType>({
    mode: 'onBlur',
    resolver: zodResolver(MicrodepositsFormSchema),
    defaultValues: {
      amount1: 0,
      amount2: 0,
    },
  });

  const {
    mutate: verify,
    reset: resetVerify,
    status: verifyStatus,
    data: verifyResponse,
    error: verifyError,
    isPending: isVerifyPending,
  } = useRecipientsVerification({
    mutation: {
      onSuccess: (data) => {
        // Close dialog if verification succeeded or max attempts exceeded
        if (
          data.status === 'VERIFIED' ||
          data.status === 'FAILED_MAX_ATTEMPTS_EXCEEDED'
        ) {
          handleDialogChange(false);
        }

        // Optimistically update the recipients list
        const queryKey = getGetAllRecipientsQueryKey({
          type: 'LINKED_ACCOUNT',
        });
        queryClient.setQueryData(
          queryKey,
          (oldData: ListRecipientsResponse | undefined) => {
            if (!oldData?.recipients) return oldData;

            return {
              ...oldData,
              recipients: oldData.recipients.map((r) =>
                r.id === recipientId
                  ? { ...r, status: data.status === 'VERIFIED' ? 'ACTIVE' : r.status }
                  : r
              ),
            };
          }
        );
        queryClient.invalidateQueries({
          queryKey,
        });
        queryClient.invalidateQueries({
          queryKey: ['getRecipient', recipientId],
        });

        // Pass the response and recipient to parent - they can check the status
        onVerificationSettled?.(data, recipient);
      },
    },
  });

  const handleSubmit = (data: MicrodepositsFormDataType) => {
    verify({
      id: recipientId,
      data: {
        amounts: [data.amount1, data.amount2],
      },
    });
  };

  const handleDialogChange = (open: boolean) => {
    if (open) {
      resetVerify();
      form.reset();
    }
    if (isControlled) {
      onOpenChange?.(open);
    } else {
      setUncontrolledOpen(open);
    }
  };

  const handleCancel = () => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setUncontrolledOpen(false);
    }
  };

  const isDone =
    (verifyStatus === 'success' && verifyResponse?.status === 'VERIFIED') ||
    verifyResponse?.status === 'FAILED_MAX_ATTEMPTS_EXCEEDED';

  return (
    <Dialog open={isDialogOpen && !isDone} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-max-h-[90vh] eb-max-w-lg eb-overflow-hidden eb-p-0">
        <DialogHeader className="eb-space-y-2 eb-border-b eb-p-6 eb-py-4">
          <DialogTitle className="eb-text-xl">
            {t('forms.microdeposits.title')}
          </DialogTitle>
          <DialogDescription>
            <Trans
              i18nKey="forms.microdeposits.description"
              ns="linked-accounts"
              values={{
                name: recipient
                  ? getRecipientDisplayName(recipient)
                  : undefined,
              }}
            />
          </DialogDescription>
        </DialogHeader>

        {/* Loading state while fetching recipient */}
        {isRecipientLoading && (
          <div className="eb-flex eb-h-[25rem] eb-items-center eb-justify-center">
            <Loader2Icon
              className="eb-animate-spin eb-stroke-primary"
              size={48}
            />
          </div>
        )}

        {/* Error state if recipient fetch failed (but not due to max attempts) */}
        {!isRecipientLoading && recipientError && (
          <div className="eb-space-y-6 eb-p-6">
            <ServerErrorAlert
              error={recipientError}
              showDetails
              customTitle={t('forms.microdeposits.errors.loading.title')}
              customErrorMessage={t(
                'forms.microdeposits.errors.loading.message'
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">
                  {t('forms.removeAccount.cancel')}
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        )}

        {/* Form State */}
        {!isRecipientLoading && !recipientError && (
          <div className="eb-overflow-y-auto">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="eb-space-y-4 eb-p-6"
              >
                {/* API Error Alerts */}
                {verifyStatus === 'error' && verifyError && (
                  <ServerErrorAlert
                    error={verifyError}
                    showDetails
                    customTitle={t(
                      'forms.microdeposits.errors.verificationFailed.title'
                    )}
                    customErrorMessage={{
                      400: t(
                        'forms.microdeposits.errors.verificationFailed.400'
                      ),
                      default: t(
                        'forms.microdeposits.errors.verificationFailed.default'
                      ),
                    }}
                  />
                )}

                {verifyResponse?.status === 'FAILED' && (
                  <Alert variant="destructive">
                    <AlertCircle className="eb-h-4 eb-w-4" />
                    <AlertTitle>
                      {t('forms.microdeposits.errors.verificationFailed.title')}
                    </AlertTitle>
                    <AlertDescription>
                      {t('forms.microdeposits.errors.verificationFailed.400')}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Microdeposit Amounts Section */}
                <div className="eb-space-y-4">
                  <div className="eb-grid eb-grid-cols-2 eb-gap-4">
                    <StandardFormField
                      control={form.control}
                      name="amount1"
                      type="number"
                      label={t('forms.microdeposits.amount1.label')}
                      placeholder={t('forms.microdeposits.amount1.placeholder')}
                      prefix="$"
                      required
                      disabled={isVerifyPending}
                      inputProps={{
                        step: 0.01,
                        min: 0,
                      }}
                    />

                    <StandardFormField
                      control={form.control}
                      name="amount2"
                      type="number"
                      label={t('forms.microdeposits.amount2.label')}
                      placeholder={t('forms.microdeposits.amount2.placeholder')}
                      prefix="$"
                      required
                      disabled={isVerifyPending}
                      inputProps={{
                        step: 0.01,
                        min: 0,
                      }}
                    />
                  </div>
                </div>

                <DialogFooter className="eb-gap-2 eb-pt-8">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={handleCancel}
                      disabled={isVerifyPending}
                    >
                      {t('forms.microdeposits.cancel')}
                    </Button>
                  </DialogClose>
                  <Button type="submit" disabled={isVerifyPending}>
                    {isVerifyPending && (
                      <Loader2Icon className="eb-mr-2 eb-h-4 eb-w-4 eb-animate-spin" />
                    )}
                    {t('forms.microdeposits.confirm')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
