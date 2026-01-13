'use client';

import React, { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';

import { trackUserEvent, useUserEventTracking } from '@/lib/utils/userTracking';
import { useCreateRecipient } from '@/api/generated/ep-recipients';
import type { RecipientRequest } from '@/api/generated/ep-recipients.schemas';
import { useCreateTransactionV2 } from '@/api/generated/ep-transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';

import {
  AccountSelector,
  AdditionalInformation,
  AmountInput,
  ManualRecipientFields,
  PaymentMethodSelector,
  PaymentSuccess,
  RecipientDetails,
  RecipientModeToggle,
  RecipientSelector,
  ReviewPanel,
} from './components';
import {
  usePaymentAutoSelection,
  usePaymentData,
  usePaymentForm,
  usePaymentValidation,
} from './hooks';
import { MAKE_PAYMENT_USER_JOURNEYS } from './MakePayment.constants';
import type { PaymentComponentProps } from './types';

// Utility to generate a unique transaction reference ID
function generateTransactionReferenceId(): string {
  const prefix = 'PHUI_';
  const uuid = uuidv4().replace(/-/g, ''); // Remove dashes to fit within the character limit
  const maxLength = 35;
  const randomPart = uuid.substring(0, maxLength - prefix.length);

  return prefix + randomPart;
}

export const MakePayment: React.FC<PaymentComponentProps> = ({
  triggerButton,
  triggerButtonVariant = 'default',
  paymentMethods = [
    { id: 'ACH', name: 'ACH' },
    { id: 'RTP', name: 'RTP' },
    { id: 'WIRE', name: 'WIRE' },
  ],
  icon,
  recipientId,
  showPreviewPanel = true, // Default to true for backward compatibility
  onTransactionSettled,
  userEventsHandler,
  userEventsLifecycle,
}) => {
  const { t } = useTranslation(['make-payment']);
  const { form, resetForm } = usePaymentForm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(false);

  // Set up automatic event tracking for data-user-event attributes
  useUserEventTracking({
    containerId: 'make-payment-container',
    userEventsHandler,
    userEventsLifecycle,
  });

  // Get payment data using custom hook
  const paymentData = usePaymentData(paymentMethods, form, recipientId);

  // Get payment validation using custom hook
  const validation = usePaymentValidation(
    paymentMethods,
    paymentData.availableBalance,
    form
  );

  // Auto-selection logic
  usePaymentAutoSelection(
    paymentData.accounts,
    paymentData.selectedAccount,
    paymentData.filteredRecipients,
    paymentMethods,
    form
  );

  // Transaction mutation
  const {
    mutate: createTransaction,
    isPending: isSubmitting,
    isError: isPaymentError,
    error: paymentError,
    reset: resetPayment,
  } = useCreateTransactionV2({
    mutation: {
      onSuccess: (data) => {
        trackUserEvent({
          actionName: MAKE_PAYMENT_USER_JOURNEYS.PAYMENT_COMPLETED,
          metadata: { transactionId: data.id, status: data.status },
          userEventsHandler,
        });
      },
      onError: (error) => {
        trackUserEvent({
          actionName: MAKE_PAYMENT_USER_JOURNEYS.PAYMENT_FAILED,
          metadata: {
            errorType: error?.name || 'UnknownError',
            // Don't include error.message as it may contain PII
          },
          userEventsHandler,
        });
      },
    },
  });

  // Recipient creation mutation
  const { mutate: createRecipient, isPending: isCreatingRecipient } =
    useCreateRecipient({
      mutation: {
        onSuccess: () => {
          // Refetch recipients after creating
          paymentData.refetchRecipients();
        },
      },
    });

  // Derived state for recipient selection and warning
  const recipientSelectionState = React.useMemo(() => {
    if (!recipientId) {
      return { shouldSelectRecipient: false, recipientNotFound: false };
    }

    const {
      preselectedRecipientStatus,
      preselectedRecipient: fetchedRecipient,
    } = paymentData;

    // Wait for preselected recipient fetch to complete if it's still pending
    // This includes when the query hasn't started yet (interceptor not ready)
    if (preselectedRecipientStatus === 'pending') {
      return { shouldSelectRecipient: false, recipientNotFound: false };
    }

    // If preselected recipient fetch failed (404, network error, etc), show warning
    if (preselectedRecipientStatus === 'error') {
      return { shouldSelectRecipient: false, recipientNotFound: true };
    }

    // If preselected recipient was successfully fetched, it exists (even if filtered out)
    // Check if the fetched recipient data exists
    if (preselectedRecipientStatus === 'success' && fetchedRecipient) {
      // Recipient was found via GET /recipients/:id
      // Check if recipient exists in filtered recipients (may be filtered out by account)
      const recipientExists = paymentData.filteredRecipients?.some(
        (r) => r.id === recipientId
      );

      if (recipientExists) {
        // Auto-select the recipient if it exists and no recipient is currently selected
        const currentRecipient = form.getValues('to');
        if (!currentRecipient) {
          form.setValue('to', recipientId);
        }
      }
      // Recipient was found via GET /recipients/:id, don't show warning
      // (even if filtered out by account selection - that's a different UX concern)
      return { shouldSelectRecipient: false, recipientNotFound: false };
    }

    // Fallback: If status is 'success' but no recipient data (shouldn't happen in normal flow)
    // or if status is something unexpected, show warning as safety measure
    // This handles edge cases where the query completed but returned no data
    return { shouldSelectRecipient: false, recipientNotFound: true };
  }, [
    recipientId,
    paymentData.filteredRecipients,
    paymentData.preselectedRecipient,
    paymentData.preselectedRecipientStatus,
    form,
  ]);

  const { recipientNotFound } = recipientSelectionState;

  // On submit, build payload and call mutation
  const handlePaymentSubmit = (values: any) => {
    const fromAccount = paymentData.accounts?.items.find(
      (a: { id: any }) => a.id === values.from
    );
    if (!fromAccount) return;

    const common = {
      amount: Number(values.amount),
      currency: 'USD',
      debtorAccountId: fromAccount.id,
      transactionReferenceId: generateTransactionReferenceId(),
      type: values.method,
      ...(values.memo?.trim() && { memo: values.memo.trim() }),
    } as any;

    if (values.recipientMode === 'manual') {
      const routingInfo = [
        {
          routingCodeType: 'USABA' as const,
          routingNumber: values.routingNumber,
          transactionType: values.method,
        },
      ];
      const partyDetails =
        values.partyType === 'INDIVIDUAL'
          ? {
              type: 'INDIVIDUAL' as const,
              firstName: values.firstName,
              lastName: values.lastName,
              address:
                values.method === 'RTP' || values.method === 'WIRE'
                  ? {
                      addressLine1: values.addressLine1,
                      city: values.city,
                      state: values.state,
                      countryCode: 'US' as const,
                      postalCode: values.postalCode,
                    }
                  : undefined,
            }
          : {
              type: 'ORGANIZATION' as const,
              businessName: values.businessName,
              address:
                values.method === 'RTP' || values.method === 'WIRE'
                  ? {
                      addressLine1: values.addressLine1,
                      city: values.city,
                      state: values.state,
                      countryCode: 'US' as const,
                      postalCode: values.postalCode,
                    }
                  : undefined,
            };

      // If saveRecipient is checked, create the recipient first
      if (values.saveRecipient) {
        const recipientRequest: RecipientRequest = {
          type: 'RECIPIENT',
          account: {
            countryCode: 'US' as const,
            number: values.accountNumber,
            type: values.accountType,
            routingInformation: routingInfo.map((info) => ({
              routingCodeType: 'USABA' as const,
              routingNumber: info.routingNumber,
              transactionType: info.transactionType,
            })),
          },
          partyDetails,
        };

        createRecipient(
          { data: recipientRequest },
          {
            onSuccess: () => {
              // After recipient is created, proceed with transaction
              createTransaction(
                {
                  data: {
                    ...common,
                    recipient: {
                      account: {
                        countryCode: 'US',
                        number: values.accountNumber,
                        type: values.accountType,
                        routingInformation: routingInfo,
                      },
                      partyDetails,
                    },
                  },
                },
                {
                  onSuccess: () => {
                    setLocalSuccess(true);
                    // Tracking is handled at hook level to avoid duplicates
                  },
                  onSettled: () => onTransactionSettled?.(),
                }
              );
            },
            onError: (error) => {
              console.error('Failed to create recipient:', error);
              // Still proceed with transaction even if saving recipient fails
              createTransaction(
                {
                  data: {
                    ...common,
                    recipient: {
                      account: {
                        countryCode: 'US',
                        number: values.accountNumber,
                        type: values.accountType,
                        routingInformation: routingInfo,
                      },
                      partyDetails,
                    },
                  },
                },
                {
                  onSuccess: () => {
                    setLocalSuccess(true);
                    // Tracking is handled at hook level to avoid duplicates
                  },
                  onSettled: () => onTransactionSettled?.(),
                }
              );
            },
          }
        );
        return;
      }

      // If not saving recipient, proceed directly with transaction
      createTransaction(
        {
          data: {
            ...common,
            recipient: {
              account: {
                countryCode: 'US',
                number: values.accountNumber,
                type: values.accountType,
                routingInformation: routingInfo,
              },
              partyDetails,
            },
          },
        },
        {
          onSuccess: () => {
            setLocalSuccess(true);
            // Tracking is handled at hook level to avoid duplicates
          },
          onSettled: () => onTransactionSettled?.(),
        }
      );
      return;
    }

    const recipient = paymentData.filteredRecipients?.find(
      (r) => r.id === values.to
    );
    if (!recipient) return;

    createTransaction(
      {
        data: {
          ...common,
          recipientId: recipient.id,
        },
      },
      {
        onSuccess: () => {
          setLocalSuccess(true);
          // Tracking is handled at hook level to avoid duplicates
        },
        onSettled: () => onTransactionSettled?.(),
      }
    );
  };

  // Reset local success when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setLocalSuccess(false);
      resetPayment();
      resetForm();
    }
  }, [dialogOpen, resetPayment, resetForm]);

  // Restore pre-selected values when dialog opens (only on initial open, not when data changes)
  useEffect(() => {
    if (dialogOpen) {
      // Track form started
      trackUserEvent({
        actionName: MAKE_PAYMENT_USER_JOURNEYS.FORM_STARTED,
        userEventsHandler,
      });

      // Auto-select single account only if no account is currently selected
      if (paymentData.accounts?.items?.length === 1) {
        const currentAccount = form.getValues('from');
        if (!currentAccount) {
          form.setValue('from', paymentData.accounts.items[0].id);
        }
      }

      // Auto-select single recipient only if no recipient is currently selected
      // This should only happen on initial dialog open, not when filteredRecipients changes
      if (paymentData.filteredRecipients?.length === 1) {
        const currentRecipient = form.getValues('to');
        if (!currentRecipient) {
          form.setValue('to', paymentData.filteredRecipients[0].id);
        }
      }
    }
    // Only run when dialog opens/closes, not when data changes
  }, [dialogOpen, userEventsHandler]);

  // Restore recipient selection when recipients are loaded and dialog is open
  useEffect(() => {
    if (
      dialogOpen &&
      recipientId &&
      paymentData.filteredRecipients?.length > 0
    ) {
      const recipientExists = paymentData.filteredRecipients.some(
        (r) => r.id === recipientId
      );
      if (recipientExists) {
        const currentRecipient = form.getValues('to');
        if (!currentRecipient) {
          form.setValue('to', recipientId);
        }
      }
    }
  }, [dialogOpen, recipientId, paymentData.filteredRecipients, form]);

  const handleMakeAnotherPayment = () => {
    setLocalSuccess(false);
    resetForm();
  };

  // Get the icon component if it exists in Lucide
  const IconComponent =
    icon &&
    (LucideIcons[icon as keyof typeof LucideIcons] as
      | React.FC<React.SVGProps<SVGSVGElement>>
      | undefined);

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button
            data-user-event={MAKE_PAYMENT_USER_JOURNEYS.FORM_STARTED}
            onClick={() => setDialogOpen(true)}
            variant={triggerButtonVariant}
            className="eb-component eb-flex eb-items-center eb-gap-2"
          >
            {IconComponent && <IconComponent className="eb-h-4 eb-w-4" />}
            {t('buttons.makePayment')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent
        id="make-payment-container"
        className="eb-p-0 sm:eb-max-w-[1200px]"
      >
        <DialogTitle className="eb-sr-only">{t('title')}</DialogTitle>
        <Card className="eb-rounded-none eb-border-none eb-shadow-none sm:eb-rounded-lg">
          <CardHeader className="eb-border-b eb-bg-muted/30 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
            <CardTitle className="eb-h-8 eb-truncate eb-font-header eb-text-lg eb-font-semibold eb-leading-8 @md:eb-text-xl">
              {t('title', { defaultValue: 'Make a payment' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-space-y-4 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
            <DialogDescription>
              {t('description', {
                defaultValue:
                  'All fields are required unless specified optional.',
              })}
            </DialogDescription>

            {/* Show recipient warning immediately if recipientId is invalid */}
            {recipientNotFound && recipientId && (
              <div className="eb-rounded-md eb-border eb-border-destructive/20 eb-bg-destructive/10 eb-p-2.5 @md:eb-p-3">
                <div className="eb-text-sm eb-text-destructive">
                  {t('warnings.recipientNotFound', { recipientId })}
                </div>
              </div>
            )}

            {/* Make the form content scrollable if it grows */}
            <div className="eb-max-h-[70vh] eb-overflow-y-auto eb-pr-1">
              {localSuccess ? (
                <PaymentSuccess
                  onMakeAnotherPayment={handleMakeAnotherPayment}
                  filteredRecipients={paymentData.filteredRecipients}
                  accounts={paymentData.accounts}
                  formData={form.getValues()}
                />
              ) : (
                <FormProvider {...form}>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(handlePaymentSubmit)}
                      className="eb-space-y-0"
                    >
                      <div
                        className={`eb-grid eb-grid-cols-1 eb-gap-3 ${showPreviewPanel ? 'md:eb-grid-cols-2' : ''}`}
                      >
                        <div className="eb-space-y-3">
                          {/* Recipient section */}
                          <Card className="eb-p-2.5 @md:eb-p-3 @lg:eb-p-4">
                            <CardContent className="eb-space-y-4 eb-p-0">
                              <div className="eb-space-y-4">
                                <h3 className="eb-text-base eb-font-semibold">
                                  {t('fields.to.label', {
                                    defaultValue: 'Who are you paying?',
                                  })}
                                </h3>
                                <RecipientModeToggle />
                              </div>

                              {form.watch('recipientMode') !== 'manual' ? (
                                <>
                                  <RecipientSelector
                                    filteredRecipients={
                                      paymentData.filteredRecipients
                                    }
                                    selectedAccount={
                                      paymentData.selectedAccount
                                    }
                                    recipientsStatus={
                                      paymentData.recipientsStatus
                                    }
                                    refetchRecipients={
                                      paymentData.refetchRecipients
                                    }
                                    recipientDisabledMap={
                                      paymentData.recipientDisabledMap
                                    }
                                    allRecipients={paymentData.recipients}
                                  />
                                  {paymentData.filteredRecipients?.length !==
                                    1 && (
                                    <RecipientDetails
                                      selectedRecipient={
                                        paymentData.selectedRecipient
                                      }
                                    />
                                  )}
                                </>
                              ) : (
                                <>
                                  {/* Payment method becomes first control in section when manual */}
                                  <PaymentMethodSelector
                                    paymentMethods={paymentMethods}
                                    isFormFilled={validation.isFormFilled}
                                    fee={validation.fee}
                                  />
                                  <ManualRecipientFields />
                                </>
                              )}
                            </CardContent>
                          </Card>

                          {/* Section 2: Which account are you paying from? */}
                          <Card className="eb-p-2.5 @md:eb-p-3 @lg:eb-p-4">
                            <CardContent className="eb-p-0">
                              <AccountSelector
                                accounts={paymentData.accounts}
                                accountsStatus={paymentData.accountsStatus}
                                refetchAccounts={paymentData.refetchAccounts}
                                selectedAccountId={form.watch('from')}
                                accountBalance={paymentData.accountBalance}
                                isBalanceLoading={paymentData.isBalanceLoading}
                                isBalanceError={paymentData.isBalanceError}
                                balanceError={paymentData.balanceError}
                                refetchBalance={paymentData.refetchBalance}
                                accountDisabledMap={
                                  paymentData.accountDisabledMap
                                }
                              />
                            </CardContent>
                          </Card>

                          {/* Section 3: How much are you paying? */}
                          <Card className="eb-p-2.5 @md:eb-p-3 @lg:eb-p-4">
                            <CardContent className="eb-p-0">
                              <AmountInput
                                isAmountValid={validation.isAmountValid}
                                totalAmount={validation.totalAmount}
                                availableBalance={validation.availableBalance}
                              />
                            </CardContent>
                          </Card>

                          {/* Section 4: How do you want to pay? */}
                          {form.watch('recipientMode') !== 'manual' &&
                            form.watch('to') && (
                              <Card className="eb-p-2.5 @md:eb-p-3 @lg:eb-p-4">
                                <CardContent className="eb-p-0">
                                  <PaymentMethodSelector
                                    paymentMethods={
                                      paymentData.dynamicPaymentMethods
                                    }
                                    isFormFilled={validation.isFormFilled}
                                    fee={validation.fee}
                                    accountsStatus={paymentData.accountsStatus}
                                  />
                                </CardContent>
                              </Card>
                            )}

                          {/* Section 5: Additional Information (optional) */}
                          <Card className="eb-p-2.5 @md:eb-p-3 @lg:eb-p-4">
                            <CardContent className="eb-p-0">
                              <AdditionalInformation />
                            </CardContent>
                          </Card>

                          {isPaymentError && (
                            <div className="eb-text-sm eb-text-destructive">
                              {paymentError?.message ||
                                'Payment failed. Please try again.'}
                            </div>
                          )}
                        </div>

                        {showPreviewPanel && (
                          <div className="eb-order-last md:eb-order-none">
                            <ReviewPanel
                              filteredRecipients={
                                paymentData.filteredRecipients
                              }
                              accounts={paymentData.accounts}
                              accountsStatus={paymentData.accountsStatus}
                              paymentMethods={paymentMethods}
                            />
                          </div>
                        )}

                        {/* Submit button placed as a grid child to control ordering and column placement */}
                        <div
                          className={`eb-order-last md:eb-order-none ${showPreviewPanel ? 'md:eb-col-start-1 md:eb-col-end-2' : ''}`}
                        >
                          <Button
                            type="submit"
                            data-user-event={
                              MAKE_PAYMENT_USER_JOURNEYS.FORM_SUBMITTED
                            }
                            className="eb-w-full"
                            disabled={
                              isSubmitting ||
                              isCreatingRecipient ||
                              !validation.isFormFilled ||
                              !validation.isAmountValid
                            }
                          >
                            {isSubmitting
                              ? t('buttons.processing')
                              : t('buttons.confirmPayment')}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </FormProvider>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
