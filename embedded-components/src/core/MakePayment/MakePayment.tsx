'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Info, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import { useCreateTransactionV2 } from '@/api/generated/ep-transactions';
import {
  ApiErrorV2,
  TransactionResponseV2,
} from '@/api/generated/ep-transactions.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import { usePaymentForm } from './usePaymentForm';

interface Account {
  id: string;
  name: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  fee: number;
  description?: string;
}

interface PaymentComponentProps {
  triggerButton?: React.ReactNode;
  accounts?: Account[];
  paymentMethods?: PaymentMethod[];
  icon?: string;
  onTransactionSettled?: (
    response?: TransactionResponseV2,
    error?: ApiErrorV2
  ) => void;
}

export const MakePayment: React.FC<PaymentComponentProps> = ({
  triggerButton,
  accounts = [{ id: 'account1', name: 'Main Account' }],
  paymentMethods = [
    { id: 'ACH', name: 'ACH', fee: 2.5 },
    { id: 'RTP', name: 'RTP', fee: 1 },
    { id: 'WIRE', name: 'WIRE', fee: 25 },
  ],
  icon = 'CirclePlus',
  onTransactionSettled,
}) => {
  const { t } = useTranslation(['make-payment']);
  const { form, resetForm } = usePaymentForm();
  const [showAd, setShowAd] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch recipients from API
  const {
    data: recipientsData,
    status: recipientsStatus,
    refetch: refetchRecipients,
  } = useGetAllRecipients(undefined);
  const recipients = recipientsData?.recipients || [];

  // Preselect values when there's only a single option available
  useEffect(() => {
    if (accounts.length === 1 && form.getValues('from') !== accounts[0].id) {
      form.setValue('from', accounts[0].id);
    }
    if (recipients.length === 1 && form.getValues('to') !== recipients[0].id) {
      form.setValue('to', recipients[0].id);
    }
    if (
      paymentMethods.length === 1 &&
      form.getValues('method') !== paymentMethods[0].id
    ) {
      form.setValue('method', paymentMethods[0].id);
    }
  }, [accounts, recipients, paymentMethods]);

  // Compute available payment methods for the selected recipient
  const selectedRecipient = recipients.find(
    (r: any) => r.id === form.watch('to')
  );
  const availableRoutingTypes =
    selectedRecipient?.account?.routingInformation?.map((ri: any) =>
      typeof ri.transactionType === 'string'
        ? ri.transactionType.toUpperCase()
        : String(ri.transactionType)
    ) || [];
  const dynamicPaymentMethods = paymentMethods.filter((pm) =>
    availableRoutingTypes.includes(pm.id.toUpperCase())
  );

  // Preselect payment method if only one is available for the selected recipient
  useEffect(() => {
    if (
      dynamicPaymentMethods.length === 1 &&
      form.getValues('method') !== dynamicPaymentMethods[0].id
    ) {
      form.setValue('method', dynamicPaymentMethods[0].id);
    }
  }, [selectedRecipient, paymentMethods]);

  // Reset payment method if not available for the new recipient
  useEffect(() => {
    if (
      form.getValues('method') &&
      !dynamicPaymentMethods.some((pm) => pm.id === form.getValues('method'))
    ) {
      form.setValue('method', '');
    }
  }, [dynamicPaymentMethods]);

  // Transaction mutation
  const {
    mutate: createTransaction,
    isPending: isSubmitting,
    isError: isPaymentError,
    error: paymentError,
    reset: resetPayment,
  } = useCreateTransactionV2();

  // Success state (local, to keep UI logic unchanged)
  const [localSuccess, setLocalSuccess] = useState(false);

  // On submit, build payload and call mutation
  const handlePaymentSubmit = (values: any) => {
    const recipient = recipients.find((r: any) => r.id === values.to);
    const fromAccount = accounts.find((a) => a.id === values.from);
    if (!recipient || !fromAccount) return;
    createTransaction(
      {
        data: {
          amount: Number(values.amount),
          currency: 'USD',
          debtorAccountId: fromAccount.id,
          creditorAccountId: recipient?.account?.number,
          recipientId: recipient.id,
          transactionReferenceId: `PAY-${Date.now()}`,
          type: values.method,
          memo: values.memo || '',
          // Add more fields as needed
        },
      },
      {
        onSuccess: () => {
          setLocalSuccess(true);
        },
        onSettled: (data, error) => {
          onTransactionSettled?.(data, error?.response?.data);
        },
      }
    );
  };

  // Reset local success when dialog closes
  useEffect(() => {
    if (!dialogOpen) {
      setLocalSuccess(false);
      resetPayment();
    }
  }, [dialogOpen, resetPayment]);

  const amount = Number.parseFloat(form.watch('amount') || '0');
  const from = form.watch('from');
  const to = form.watch('to');
  const method = form.watch('method');
  const isFormFilled = amount > 0 && from && to && method;

  const getFee = (paymentMethodId: string) => {
    const selectedMethod = paymentMethods.find((m) => m.id === paymentMethodId);
    return selectedMethod?.fee || 0;
  };

  const fee = getFee(method);
  const isAmountValid = amount > fee;

  const handleMakeAnotherPayment = () => {
    resetForm();
    setDialogOpen(true);
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
            className="eb-flex eb-items-center eb-gap-2"
          >
            {IconComponent && <IconComponent className="eb-h-4 eb-w-4" />}
            {t('buttons.makePayment')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="eb-p-0 sm:eb-max-w-[425px]">
        <Card className="eb-rounded-none eb-border-none eb-shadow-none sm:eb-rounded-lg">
          <CardHeader>
            <CardTitle className="eb-text-xl eb-font-semibold">
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-space-y-4 eb-pt-0">
            <DialogDescription>{t('description')}</DialogDescription>

            {!localSuccess && showAd && (
              <Alert variant="default" className="eb-mb-4">
                <Info className="eb-mt-0.5 eb-h-4 eb-w-4" />
                <AlertDescription className="eb-flex eb-items-center eb-justify-between">
                  <span>{t('alerts.newPayoutCapability')}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowAd(false)}
                    className="eb-h-6 eb-w-6 eb-p-0"
                  >
                    <X className="eb-h-4 eb-w-4" />
                    <span className="eb-sr-only">Close</span>
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Make the form content scrollable if it grows */}
            <div className="eb-max-h-[70vh] eb-overflow-y-auto eb-pr-1">
              {localSuccess ? (
                <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-space-y-4 eb-rounded-lg eb-bg-muted eb-p-6 eb-text-center">
                  <h2 className="eb-text-xl eb-font-semibold">
                    {t('success.title')}
                  </h2>
                  <p className="eb-text-muted-foreground">
                    {t('success.message')}
                  </p>
                  <Button onClick={handleMakeAnotherPayment}>
                    {t('buttons.makeAnotherPayment')}
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handlePaymentSubmit)}
                    className="eb-space-y-6 eb-px-2 eb-py-2"
                  >
                    <FormField
                      control={form.control}
                      name="from"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('fields.from.label')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t('fields.from.placeholder')}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts.map((account: Account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('fields.to.label')}</FormLabel>
                          {recipientsStatus === 'pending' && (
                            <div className="eb-py-2 eb-text-xs eb-text-muted-foreground">
                              Loading recipients...
                            </div>
                          )}
                          {recipientsStatus === 'error' && (
                            <div className="eb-py-2 eb-text-xs eb-text-destructive">
                              Failed to load recipients.{' '}
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => refetchRecipients()}
                              >
                                Retry
                              </Button>
                            </div>
                          )}
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={recipientsStatus !== 'success'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t('fields.to.placeholder')}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {recipients.map((recipient: any) => (
                                <SelectItem
                                  key={recipient.id}
                                  value={recipient.id}
                                >
                                  {recipient.partyDetails?.type === 'INDIVIDUAL'
                                    ? `${recipient.partyDetails?.firstName} ${recipient.partyDetails?.lastName}`
                                    : recipient.partyDetails?.businessName ||
                                      'Recipient'}
                                  {' - '}
                                  {recipient.account?.number
                                    ? `****${recipient.account.number.slice(-4)}`
                                    : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('fields.amount.label')}</FormLabel>
                          <FormControl>
                            <div className="eb-relative">
                              <span className="eb-absolute eb-left-3 eb-top-2.5 eb-text-muted-foreground">
                                $
                              </span>
                              <Input
                                {...field}
                                className="eb-pl-7"
                                placeholder={t('fields.amount.placeholder')}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Memo field */}
                    <FormField
                      control={form.control}
                      name="memo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Memo</FormLabel>
                          <FormControl>
                            <textarea
                              {...field}
                              className="eb-min-h-[64px] eb-w-full eb-resize-y eb-rounded-md eb-border eb-bg-background eb-p-2 eb-text-sm"
                              placeholder="Add a note or memo (optional)"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="method"
                      render={({ field }) => (
                        <FormItem className="eb-space-y-3">
                          <FormLabel>{t('fields.method.label')}</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                              className="eb-flex eb-flex-col eb-space-y-1"
                            >
                              {dynamicPaymentMethods.length === 0 && (
                                <div className="eb-py-2 eb-text-xs eb-text-muted-foreground">
                                  No payment methods available for this
                                  recipient.
                                </div>
                              )}
                              {dynamicPaymentMethods.map((paymentMethod) => (
                                <div
                                  key={paymentMethod.id}
                                  className="eb-flex eb-items-center eb-space-x-2"
                                >
                                  <RadioGroupItem
                                    value={paymentMethod.id}
                                    id={paymentMethod.id.toLowerCase()}
                                  />
                                  <Label
                                    htmlFor={paymentMethod.id.toLowerCase()}
                                    className="eb-cursor-pointer"
                                  >
                                    {t(`paymentMethods.${paymentMethod.id}`, {
                                      defaultValue: paymentMethod.name,
                                    })}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {isFormFilled && (
                      <>
                        <Separator className="eb-my-2" />
                        <div className="eb-space-y-3">
                          <Collapsible
                            open={isOpen}
                            onOpenChange={setIsOpen}
                            className="eb-w-full eb-rounded-md eb-border eb-border-input eb-px-3 eb-py-2"
                          >
                            <div className="eb-flex eb-items-center eb-justify-between eb-space-x-4">
                              <h4 className="eb-text-sm eb-font-medium">
                                {t('transferFee.label', {
                                  amount: fee.toFixed(2),
                                })}
                              </h4>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="eb-h-8 eb-w-8 eb-p-0"
                                >
                                  {isOpen ? (
                                    <ChevronUp className="eb-h-4 eb-w-4" />
                                  ) : (
                                    <ChevronDown className="eb-h-4 eb-w-4" />
                                  )}
                                  <span className="eb-sr-only">
                                    {t('transferFee.toggle')}
                                  </span>
                                </Button>
                              </CollapsibleTrigger>
                            </div>
                            <CollapsibleContent className="eb-mt-2">
                              <div className="eb-rounded-md eb-bg-muted eb-px-3 eb-py-2 eb-text-sm eb-text-muted-foreground">
                                {method &&
                                  t(`feeDescriptions.${method}`, {
                                    defaultValue:
                                      paymentMethods.find(
                                        (m) => m.id === method
                                      )?.description || '',
                                  })}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>

                          <div className="eb-text-sm eb-font-medium">
                            {t('recipientGets', {
                              amount: (amount - fee).toFixed(2),
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {!isAmountValid && amount > 0 && (
                      <div className="eb-text-sm eb-text-destructive">
                        {t('fields.amount.validation.greaterThanFee')}
                      </div>
                    )}

                    {isPaymentError && (
                      <div className="eb-text-sm eb-text-destructive">
                        {paymentError?.message ||
                          'Payment failed. Please try again.'}
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="eb-w-full"
                      disabled={isSubmitting || !isFormFilled || !isAmountValid}
                    >
                      {isSubmitting
                        ? t('buttons.processing')
                        : t('buttons.confirmPayment')}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};
