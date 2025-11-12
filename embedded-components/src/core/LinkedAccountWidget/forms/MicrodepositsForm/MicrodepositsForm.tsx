import { FC, ReactNode, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2Icon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getRecipientDisplayName } from '@/lib/recipientHelpers';
import {
  getGetAllRecipientsQueryKey,
  useGetRecipient,
  useRecipientsVerification,
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
import { Form } from '@/components/ui/form';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { StandardFormField } from '@/components/StandardFormField';

import { AccountConfirmation } from '../../components/AccountConfirmation';
import {
  MicrodepositsFormDataType,
  useMicrodepositsFormSchema,
} from './MicrodepositsForm.schema';

type MicrodepositsFormDialogTriggerProps = {
  children: ReactNode;
  recipientId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onLinkedAccountSettled?: (recipient?: Recipient, error?: ApiError) => void;
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
  onLinkedAccountSettled,
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
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetAllRecipientsQueryKey({}),
        });
        queryClient.invalidateQueries({
          queryKey: ['getRecipient', recipientId],
        });
        // Pass the updated recipient after refetch
        onLinkedAccountSettled?.(recipient);
      },
      onError: (error) => {
        const apiError = error.response?.data as ApiError;
        onLinkedAccountSettled?.(undefined, apiError);
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

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-max-h-[90vh] eb-max-w-2xl eb-overflow-hidden eb-p-0">
        <DialogHeader className="eb-space-y-2 eb-border-b eb-p-6 eb-py-4">
          <DialogTitle className="eb-text-xl">
            {verifyStatus === 'success' && verifyResponse?.status === 'VERIFIED'
              ? t('forms.microdeposits.titleSuccess')
              : t('forms.microdeposits.title')}
          </DialogTitle>
          <DialogDescription>
            {verifyStatus === 'success' &&
            verifyResponse?.status === 'VERIFIED' ? (
              t('forms.microdeposits.descriptionSuccess')
            ) : (
              <span
                dangerouslySetInnerHTML={{
                  __html: t('forms.microdeposits.description', {
                    name: recipient ? getRecipientDisplayName(recipient) : '',
                  }),
                }}
              />
            )}
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

        {/* Error state if recipient fetch failed */}
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

        {/* Success State */}
        {!isRecipientLoading &&
          !recipientError &&
          verifyStatus === 'success' &&
          verifyResponse?.status === 'VERIFIED' &&
          recipient && (
            <div className="eb-p-6">
              <AccountConfirmation recipient={recipient} />
            </div>
          )}

        {/* Form State */}
        {!isRecipientLoading &&
          !recipientError &&
          (verifyStatus === 'idle' ||
            verifyStatus === 'error' ||
            verifyStatus === 'pending' ||
            (verifyStatus === 'success' &&
              verifyResponse?.status !== 'VERIFIED')) && (
            <>
              {verifyStatus === 'pending' ? (
                <div className="eb-flex eb-h-[25rem] eb-items-center eb-justify-center">
                  <Loader2Icon
                    className="eb-animate-spin eb-stroke-primary"
                    size={48}
                  />
                </div>
              ) : (
                <div className="eb-overflow-y-auto">
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handleSubmit)}
                      className="eb-space-y-6 eb-p-6"
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
                        <ServerErrorAlert
                          error={null}
                          customTitle={t(
                            'forms.microdeposits.errors.verificationFailed.title'
                          )}
                          customErrorMessage={t(
                            'forms.microdeposits.errors.verificationFailed.400'
                          )}
                        />
                      )}

                      {verifyResponse?.status ===
                        'FAILED_MAX_ATTEMPTS_EXCEEDED' && (
                        <ServerErrorAlert
                          error={null}
                          customTitle={t(
                            'forms.microdeposits.errors.maxAttemptsExceeded.title'
                          )}
                          customErrorMessage={t(
                            'forms.microdeposits.errors.maxAttemptsExceeded.message'
                          )}
                        />
                      )}

                      {/* Microdeposit Amounts Section */}
                      <div className="eb-space-y-4">
                        <div className="eb-grid eb-grid-cols-2 eb-gap-4">
                          <StandardFormField
                            control={form.control}
                            name="amount1"
                            type="number"
                            label={t('forms.microdeposits.amount1.label')}
                            placeholder={t(
                              'forms.microdeposits.amount1.placeholder'
                            )}
                            prefix="$"
                            required
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
                            placeholder={t(
                              'forms.microdeposits.amount2.placeholder'
                            )}
                            prefix="$"
                            required
                            inputProps={{
                              step: 0.01,
                              min: 0,
                            }}
                          />
                        </div>
                      </div>

                      <DialogFooter className="eb-gap-2">
                        <DialogClose asChild>
                          <Button
                            variant="outline"
                            type="button"
                            onClick={handleCancel}
                          >
                            {t('forms.removeAccount.cancel')}
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isVerifyPending}>
                          {t('actions.verifyAccount')}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </div>
              )}
            </>
          )}
      </DialogContent>
    </Dialog>
  );
};
