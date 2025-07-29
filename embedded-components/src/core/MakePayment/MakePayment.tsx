'use client';

import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '@/i18n/useTranslation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  useGetAccountBalance,
  useGetAccounts,
} from '@/api/generated/ep-accounts';
import { AccountResponse } from '@/api/generated/ep-accounts.schemas';
import { useGetAllRecipients } from '@/api/generated/ep-recipients';
import { useCreateTransactionV2 } from '@/api/generated/ep-transactions';
import {
  ApiErrorV2,
  TransactionResponseV2,
} from '@/api/generated/ep-transactions.schemas';
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
  DialogTitle,
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
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
  triggerButtonVariant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  accounts?: Account[];
  paymentMethods?: PaymentMethod[];
  icon?: string;
  recipientId?: string; // Optional recipient ID to pre-select
  onTransactionSettled?: (
    response?: TransactionResponseV2,
    error?: ApiErrorV2
  ) => void;
}

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
  onTransactionSettled,
}) => {
  const { t } = useTranslation(['make-payment']);
  const { form, resetForm } = usePaymentForm();
  const [isOpen, setIsOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Fetch recipients from API
  const {
    data: recipientsData,
    status: recipientsStatus,
    refetch: refetchRecipients,
  } = useGetAllRecipients(undefined);

  const {
    data: accounts,
    status: accountsStatus,
    refetch: refetchAccounts,
  } = useGetAccounts(undefined);

  const recipients = recipientsData?.recipients || [];

  // Fetch account balance when account is selected
  const selectedAccountId = form.watch('from');
  const { data: accountBalance, isLoading: isBalanceLoading } =
    useGetAccountBalance(selectedAccountId || '');

  // Get selected account details
  const selectedAccount = useMemo(() => {
    return accounts?.items.find(
      (account: AccountResponse) => account.id === selectedAccountId
    );
  }, [accounts?.items, selectedAccountId]);

  // Get available balance (ITAV) for validation
  const availableBalance =
    accountBalance?.balanceTypes?.find((b) => b.typeCode === 'ITAV')?.amount ||
    0;

  // Filter recipients based on selected account category
  const filteredRecipients = useMemo(() => {
    return recipients.filter((recipient: any) => {
      // If no account is selected, show no recipients
      if (!selectedAccount) return false;

      // If account is LIMITED_DDA, only show active linked accounts
      if (selectedAccount.category === 'LIMITED_DDA') {
        return (
          recipient.type === 'LINKED_ACCOUNT' && recipient.status === 'ACTIVE'
        );
      }

      // For other account types, show all recipients
      return true;
    });
  }, [recipients, selectedAccount]);

  // Preselect values when there's only a single option available
  useEffect(() => {
    if (
      accounts &&
      accounts.items.length === 1 &&
      form.getValues('from') !== accounts.items[0].id
    ) {
      form.setValue('from', accounts.items[0].id);
    }
  }, [accounts?.items, form]);

  // Compute available payment methods for the selected recipient
  const selectedRecipient = useMemo(() => {
    return filteredRecipients.find((r: any) => r.id === form.watch('to'));
  }, [filteredRecipients, form.watch('to')]);

  const availableRoutingTypes = useMemo(() => {
    return (
      selectedRecipient?.account?.routingInformation?.map((ri: any) =>
        typeof ri.transactionType === 'string'
          ? ri.transactionType.toUpperCase()
          : String(ri.transactionType)
      ) || []
    );
  }, [selectedRecipient?.account?.routingInformation]);

  const dynamicPaymentMethods = useMemo(() => {
    return paymentMethods.filter((pm) =>
      availableRoutingTypes.includes(pm.id.toUpperCase())
    );
  }, [paymentMethods, availableRoutingTypes]);

  // Auto-selection logic for form fields
  useEffect(() => {
    // Auto-select single account if only one is available
    if (accounts?.items.length === 1) {
      const currentAccount = form.getValues('from');
      if (currentAccount !== accounts.items[0].id) {
        form.setValue('from', accounts.items[0].id);
      }
    }

    // Auto-select single recipient if only one is available after account selection
    if (selectedAccount && filteredRecipients.length === 1) {
      const currentRecipient = form.getValues('to');
      if (currentRecipient !== filteredRecipients[0].id) {
        form.setValue('to', filteredRecipients[0].id);
      }
    }

    // Auto-select single payment method if only one is available
    if (paymentMethods.length === 1) {
      const currentMethod = form.getValues('method');
      if (currentMethod !== paymentMethods[0].id) {
        form.setValue('method', paymentMethods[0].id);
      }
    }

    // Auto-select payment method if only one is available for the selected recipient
    if (dynamicPaymentMethods.length === 1) {
      const currentMethod = form.getValues('method');
      if (currentMethod !== dynamicPaymentMethods[0].id) {
        form.setValue('method', dynamicPaymentMethods[0].id);
      }
    }

    // Reset payment method if not available for the new recipient
    if (
      form.getValues('method') &&
      !dynamicPaymentMethods.some((pm) => pm.id === form.getValues('method'))
    ) {
      form.setValue('method', '');
    }

    // Reset recipient when account changes
    if (selectedAccount) {
      const currentRecipient = form.getValues('to');
      const isRecipientStillValid = filteredRecipients.some(
        (r: any) => r.id === currentRecipient
      );

      if (!isRecipientStillValid) {
        form.setValue('to', '');
      }
    }
  }, [
    accounts?.items,
    selectedAccount,
    filteredRecipients,
    paymentMethods,
    dynamicPaymentMethods,
    form,
  ]);

  // Derived state for recipient selection and warning
  const recipientSelectionState = useMemo(() => {
    if (!recipientId || filteredRecipients.length === 0) {
      return { shouldSelectRecipient: false, recipientNotFound: false };
    }

    const recipientExists = filteredRecipients.some(
      (r: any) => r.id === recipientId
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
  }, [recipientId, filteredRecipients, form]);

  const { recipientNotFound } = recipientSelectionState;

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
    const recipient = filteredRecipients.find((r: any) => r.id === values.to);
    const fromAccount = accounts?.items.find(
      (a: { id: any }) => a.id === values.from
    );
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
      resetForm(); // Reset the form when dialog closes
    }
  }, [dialogOpen, resetPayment, resetForm]);

  // Restore pre-selected values when dialog opens
  useEffect(() => {
    if (dialogOpen) {
      // If there's a recipientId and accounts are loaded, restore pre-selection
      if (recipientId && accounts?.items) {
        // Auto-select single account if only one is available
        if (accounts.items.length === 1) {
          form.setValue('from', accounts.items[0].id);
        }
      }
    }
  }, [dialogOpen, recipientId, accounts?.items, form]);

  // Restore recipient selection when recipients are loaded and dialog is open
  useEffect(() => {
    if (dialogOpen && recipientId && filteredRecipients.length > 0) {
      const recipientExists = filteredRecipients.some(
        (r: any) => r.id === recipientId
      );
      if (recipientExists) {
        const currentRecipient = form.getValues('to');
        if (!currentRecipient) {
          form.setValue('to', recipientId);
        }
      }
    }
  }, [dialogOpen, recipientId, filteredRecipients, form]);

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
  const totalAmount = amount + fee;
  const isAmountValid = amount > fee && totalAmount <= availableBalance;

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
            variant={triggerButtonVariant}
            className="eb-flex eb-items-center eb-gap-2"
          >
            {IconComponent && <IconComponent className="eb-h-4 eb-w-4" />}
            {t('buttons.makePayment')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="eb-p-0 sm:eb-max-w-[600px]">
        <DialogTitle className="eb-sr-only">{t('title')}</DialogTitle>
        <Card className="eb-rounded-none eb-border-none eb-shadow-none sm:eb-rounded-lg">
          <CardHeader>
            <CardTitle className="eb-text-xl eb-font-semibold">
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="eb-space-y-4 eb-pt-0">
            <DialogDescription>{t('description')}</DialogDescription>

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
                          {accountsStatus === 'pending' && (
                            <div className="eb-py-2 eb-text-xs eb-text-muted-foreground">
                              Loading accounts...
                            </div>
                          )}
                          {accountsStatus === 'error' && (
                            <div className="eb-py-2 eb-text-xs eb-text-destructive">
                              Failed to load accounts.{' '}
                              <Button
                                variant="link"
                                size="sm"
                                onClick={() => refetchAccounts()}
                              >
                                Retry
                              </Button>
                            </div>
                          )}
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={accountsStatus !== 'success'}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={t('fields.from.placeholder')}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accounts?.items.map(
                                (account: AccountResponse) => (
                                  <SelectItem
                                    key={account.id}
                                    value={account.id}
                                  >
                                    {account.label} ({account.category})
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Account Balance Display */}
                    {selectedAccountId && (
                      <div className="eb-mt-2 eb-rounded-md eb-bg-muted eb-p-3">
                        {isBalanceLoading ? (
                          <div className="eb-text-sm eb-text-muted-foreground">
                            Loading balance...
                          </div>
                        ) : accountBalance?.balanceTypes?.length ? (
                          <div className="eb-space-y-1">
                            {(() => {
                              const availableBalanceData =
                                accountBalance.balanceTypes.find(
                                  (balance) => balance.typeCode === 'ITAV'
                                );
                              return availableBalanceData ? (
                                <div className="eb-flex eb-items-center eb-justify-between eb-text-sm">
                                  <span className="eb-text-muted-foreground">
                                    Available Balance
                                  </span>
                                  <span className="eb-font-mono eb-font-medium">
                                    ${availableBalanceData.amount.toFixed(2)}{' '}
                                    {accountBalance.currency}
                                  </span>
                                </div>
                              ) : (
                                <div className="eb-text-sm eb-text-muted-foreground">
                                  No available balance information
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="eb-text-sm eb-text-muted-foreground">
                            No balance information available
                          </div>
                        )}
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="to"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('fields.to.label')}</FormLabel>
                          {!selectedAccount && (
                            <div className="eb-py-2 eb-text-xs eb-text-muted-foreground">
                              Please select an account first
                            </div>
                          )}
                          {selectedAccount &&
                            recipientsStatus === 'pending' && (
                              <div className="eb-py-2 eb-text-xs eb-text-muted-foreground">
                                Loading recipients...
                              </div>
                            )}
                          {selectedAccount && recipientsStatus === 'error' && (
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
                          {selectedAccount &&
                            filteredRecipients.length === 0 && (
                              <div className="eb-py-2 eb-text-xs eb-text-muted-foreground">
                                {selectedAccount.category === 'LIMITED_DDA'
                                  ? 'No active linked accounts available for this account type'
                                  : 'No recipients available'}
                              </div>
                            )}
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                            disabled={
                              !selectedAccount ||
                              recipientsStatus !== 'success' ||
                              filteredRecipients.length === 0
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    !selectedAccount
                                      ? 'Select account first'
                                      : selectedAccount.category ===
                                          'LIMITED_DDA'
                                        ? 'Select active linked account'
                                        : t('fields.to.placeholder')
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="eb-max-h-60">
                              {/* Group recipients by type */}
                              {(() => {
                                const linkedAccounts =
                                  filteredRecipients.filter(
                                    (r: any) => r.type === 'LINKED_ACCOUNT'
                                  );
                                const regularRecipients =
                                  filteredRecipients.filter(
                                    (r: any) => r.type === 'RECIPIENT'
                                  );

                                return (
                                  <>
                                    {/* Linked Accounts Group */}
                                    {linkedAccounts.length > 0 && (
                                      <SelectGroup>
                                        <SelectLabel className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                                          Linked Accounts
                                        </SelectLabel>
                                        {linkedAccounts.map(
                                          (recipient: any) => (
                                            <SelectItem
                                              key={recipient.id}
                                              value={recipient.id}
                                            >
                                              {recipient.partyDetails?.type ===
                                              'INDIVIDUAL'
                                                ? `${recipient.partyDetails?.firstName} ${recipient.partyDetails?.lastName}`
                                                : recipient.partyDetails
                                                    ?.businessName ||
                                                  'Recipient'}
                                              {' - '}
                                              {recipient.account?.number
                                                ? `****${recipient.account.number.slice(-4)}`
                                                : ''}
                                            </SelectItem>
                                          )
                                        )}
                                      </SelectGroup>
                                    )}

                                    {/* Separator if both groups have items */}
                                    {linkedAccounts.length > 0 &&
                                      regularRecipients.length > 0 && (
                                        <SelectSeparator />
                                      )}

                                    {/* Regular Recipients Group */}
                                    {regularRecipients.length > 0 && (
                                      <SelectGroup>
                                        <SelectLabel className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                                          Recipients
                                        </SelectLabel>
                                        {regularRecipients.map(
                                          (recipient: any) => (
                                            <SelectItem
                                              key={recipient.id}
                                              value={recipient.id}
                                            >
                                              {recipient.partyDetails?.type ===
                                              'INDIVIDUAL'
                                                ? `${recipient.partyDetails?.firstName} ${recipient.partyDetails?.lastName}`
                                                : recipient.partyDetails
                                                    ?.businessName ||
                                                  'Recipient'}
                                              {' - '}
                                              {recipient.account?.number
                                                ? `****${recipient.account.number.slice(-4)}`
                                                : ''}
                                            </SelectItem>
                                          )
                                        )}
                                      </SelectGroup>
                                    )}

                                    {/* Fallback if no grouping is possible */}
                                    {linkedAccounts.length === 0 &&
                                      regularRecipients.length === 0 && (
                                        <>
                                          {filteredRecipients.map(
                                            (recipient: any) => (
                                              <SelectItem
                                                key={recipient.id}
                                                value={recipient.id}
                                              >
                                                {recipient.partyDetails
                                                  ?.type === 'INDIVIDUAL'
                                                  ? `${recipient.partyDetails?.firstName} ${recipient.partyDetails?.lastName}`
                                                  : recipient.partyDetails
                                                      ?.businessName ||
                                                    'Recipient'}
                                                {' - '}
                                                {recipient.account?.number
                                                  ? `****${recipient.account.number.slice(-4)}`
                                                  : ''}
                                              </SelectItem>
                                            )
                                          )}
                                        </>
                                      )}
                                  </>
                                );
                              })()}
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
                          {!isAmountValid && amount > 0 && (
                            <div className="eb-text-sm eb-text-destructive">
                              {totalAmount > availableBalance
                                ? `Insufficient funds. Available balance: $${availableBalance.toFixed(2)}`
                                : t('fields.amount.validation.greaterThanFee')}
                            </div>
                          )}
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
                          <div className="eb-text-xs eb-text-muted-foreground">
                            Available payment methods for the selected recipient
                          </div>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                              className="eb-flex eb-flex-row eb-flex-wrap eb-gap-3"
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
                                  className="eb-relative eb-min-w-[120px] eb-max-w-[160px] eb-flex-1"
                                >
                                  <RadioGroupItem
                                    value={paymentMethod.id}
                                    id={paymentMethod.id.toLowerCase()}
                                    className="eb-sr-only"
                                  />
                                  <Label
                                    htmlFor={paymentMethod.id.toLowerCase()}
                                    className={cn(
                                      'eb-flex eb-min-h-[80px] eb-cursor-pointer eb-flex-col eb-items-center eb-justify-center eb-rounded-lg eb-border-2 eb-p-3 eb-transition-all eb-duration-200 eb-ease-in-out',
                                      'eb-border-border eb-bg-card eb-text-card-foreground',
                                      'hover:eb-border-primary hover:eb-shadow-md',
                                      'focus-within:eb-ring-2 focus-within:eb-ring-ring focus-within:eb-ring-offset-2',
                                      field.value === paymentMethod.id
                                        ? 'eb-border-primary eb-bg-primary/5 eb-shadow-md'
                                        : 'eb-border-border hover:eb-border-primary/50'
                                    )}
                                  >
                                    <div className="eb-flex eb-flex-col eb-items-center eb-space-y-2 eb-text-center">
                                      <div
                                        className={cn(
                                          'eb-flex eb-h-6 eb-w-6 eb-items-center eb-justify-center eb-rounded-full eb-text-xs eb-font-semibold',
                                          field.value === paymentMethod.id
                                            ? 'eb-bg-primary eb-text-primary-foreground'
                                            : 'eb-bg-muted eb-text-muted-foreground'
                                        )}
                                      >
                                        {paymentMethod.id.charAt(0)}
                                      </div>
                                      <div className="eb-space-y-1">
                                        <div className="eb-text-xs eb-font-medium">
                                          {t(
                                            `paymentMethods.${paymentMethod.id}`,
                                            {
                                              defaultValue: paymentMethod.name,
                                            }
                                          )}
                                        </div>
                                        <div className="eb-text-xs eb-text-muted-foreground">
                                          ${paymentMethod.fee.toFixed(2)} fee
                                        </div>
                                      </div>
                                    </div>
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
