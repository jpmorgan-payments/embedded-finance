'use client';

import React, { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

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
import type { PaymentComponentProps } from './types';

export const MakePayment: React.FC<PaymentComponentProps> = ({
  triggerButton,
  triggerButtonVariant = 'default',
  paymentMethods = [
    { id: 'ACH', name: 'ACH', fee: 2.5 },
    { id: 'RTP', name: 'RTP', fee: 1 },
    { id: 'WIRE', name: 'WIRE', fee: 25 },
  ],
  icon,
  recipientId,
  showPreviewPanel = true, // Default to true for backward compatibility
  onTransactionSettled,
}) => {
  const { t } = useTranslation(['make-payment']);
  const { form, resetForm } = usePaymentForm();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localSuccess, setLocalSuccess] = useState(false);

  // Get payment data using custom hook
  const paymentData = usePaymentData(paymentMethods, form);

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
    paymentData.dynamicPaymentMethods,
    form
  );

  // Transaction mutation
  const {
    mutate: createTransaction,
    isPending: isSubmitting,
    isError: isPaymentError,
    error: paymentError,
    reset: resetPayment,
  } = useCreateTransactionV2();

  // Derived state for recipient selection and warning
  const recipientSelectionState = React.useMemo(() => {
    if (!recipientId || paymentData.filteredRecipients?.length === 0) {
      return { shouldSelectRecipient: false, recipientNotFound: false };
    }

    const recipientExists = paymentData.filteredRecipients?.some(
      (r) => r.id === recipientId
    );

    if (recipientExists) {
      // Auto-select the recipient if it exists and no recipient is currently selected
      const currentRecipient = form.getValues('to');
      if (!currentRecipient) {
        form.setValue('to', recipientId);
      }
      return { shouldSelectRecipient: false, recipientNotFound: false };
    }

    // Show warning if recipientId is provided but not found in filtered recipients
    return { shouldSelectRecipient: false, recipientNotFound: true };
  }, [recipientId, paymentData.filteredRecipients, form]);

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
      transactionReferenceId: `PAY-${Date.now()}`,
      type: values.method,
      memo: values.memo || '',
    } as any;

    if (values.recipientMode === 'manual') {
      const routingInfo = [
        {
          routingCodeType: 'USABA',
          routingNumber: values.routingNumber,
          transactionType: values.method,
        },
      ];
      const partyDetails =
        values.partyType === 'INDIVIDUAL'
          ? {
              type: 'INDIVIDUAL',
              firstName: values.firstName,
              lastName: values.lastName,
              address:
                values.method === 'RTP'
                  ? {
                      addressLine1: values.addressLine1,
                      city: values.city,
                      state: values.state,
                      countryCode: 'US',
                      postalCode: values.postalCode,
                    }
                  : undefined,
            }
          : {
              type: 'ORGANIZATION',
              businessName: values.businessName,
              address:
                values.method === 'RTP'
                  ? {
                      addressLine1: values.addressLine1,
                      city: values.city,
                      state: values.state,
                      countryCode: 'US',
                      postalCode: values.postalCode,
                    }
                  : undefined,
            };

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
          onSuccess: () => setLocalSuccess(true),
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
        onSuccess: () => setLocalSuccess(true),
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

  // Restore pre-selected values when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      // Auto-select single account
      if (paymentData.accounts?.items?.length === 1) {
        form.setValue('from', paymentData.accounts.items[0].id);
      }

      // Auto-select single recipient
      if (paymentData.filteredRecipients?.length === 1) {
        form.setValue('to', paymentData.filteredRecipients[0].id);
      }
    }
  }, [
    dialogOpen,
    paymentData.accounts?.items,
    paymentData.filteredRecipients,
    form,
  ]);

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
            onClick={() => setDialogOpen(true)}
            variant={triggerButtonVariant}
            className="eb-component eb-flex eb-items-center eb-gap-2"
          >
            {IconComponent && <IconComponent className="eb-h-4 eb-w-4" />}
            {t('buttons.makePayment')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="eb-p-0 sm:eb-max-w-[1200px]">
        <DialogTitle className="eb-sr-only">{t('title')}</DialogTitle>
        <Card className="eb-rounded-none eb-border-none eb-shadow-none sm:eb-rounded-lg">
          <CardHeader>
            <CardTitle className="eb-text-xl eb-font-semibold">
              {t('title', { defaultValue: 'Make a payment' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-space-y-4 eb-pt-0">
            <DialogDescription>
              {t('description', {
                defaultValue:
                  'All fields are required unless specified optional.',
              })}
            </DialogDescription>

            {/* Show recipient warning immediately if recipientId is invalid */}
            {recipientNotFound && recipientId && (
              <div className="eb-rounded-md eb-border eb-border-destructive/20 eb-bg-destructive/10 eb-p-3">
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
                      className="eb-px-2 eb-py-2"
                    >
                      <div
                        className={`eb-grid eb-grid-cols-1 eb-gap-4 ${showPreviewPanel ? 'md:eb-grid-cols-2' : ''}`}
                      >
                        <div className="eb-space-y-6">
                          {/* Recipient section */}
                          <Card className="eb-p-4">
                            <CardContent className="eb-space-y-4 eb-p-0">
                              <div className="eb-flex eb-items-center eb-justify-end">
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
                                    dynamicPaymentMethods={
                                      paymentData.dynamicPaymentMethods
                                    }
                                    paymentMethods={paymentMethods}
                                    forceAllMethods
                                    isFormFilled={validation.isFormFilled}
                                    amount={validation.amount}
                                    fee={validation.fee}
                                  />
                                  <ManualRecipientFields />
                                </>
                              )}
                            </CardContent>
                          </Card>

                          {/* Section 2: Which account are you paying from? */}
                          <Card className="eb-p-4">
                            <CardContent className="eb-p-0">
                              <AccountSelector
                                accounts={paymentData.accounts}
                                accountsStatus={paymentData.accountsStatus}
                                refetchAccounts={paymentData.refetchAccounts}
                                selectedAccountId={form.watch('from')}
                                accountBalance={paymentData.accountBalance}
                                isBalanceLoading={paymentData.isBalanceLoading}
                              />
                            </CardContent>
                          </Card>

                          {/* Section 3: How much are you paying? */}
                          <Card className="eb-p-4">
                            <CardContent className="eb-p-0">
                              <AmountInput
                                isAmountValid={validation.isAmountValid}
                                totalAmount={validation.totalAmount}
                                availableBalance={validation.availableBalance}
                              />
                            </CardContent>
                          </Card>

                          {/* Section 4: How do you want to pay? (disappears in manual mode) */}
                          {form.watch('recipientMode') !== 'manual' && (
                            <Card className="eb-p-4">
                              <CardContent className="eb-p-0">
                                <PaymentMethodSelector
                                  dynamicPaymentMethods={
                                    paymentData.dynamicPaymentMethods
                                  }
                                  paymentMethods={paymentMethods}
                                  isFormFilled={validation.isFormFilled}
                                  amount={validation.amount}
                                  fee={validation.fee}
                                />
                              </CardContent>
                            </Card>
                          )}

                          {/* Section 5: Additional Information (optional) */}
                          <Card className="eb-p-4">
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
                            />
                          </div>
                        )}

                        {/* Submit button placed as a grid child to control ordering and column placement */}
                        <div
                          className={`eb-order-last md:eb-order-none ${showPreviewPanel ? 'md:eb-col-start-1 md:eb-col-end-2' : ''}`}
                        >
                          <Button
                            type="submit"
                            className="eb-w-full"
                            disabled={
                              isSubmitting ||
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
