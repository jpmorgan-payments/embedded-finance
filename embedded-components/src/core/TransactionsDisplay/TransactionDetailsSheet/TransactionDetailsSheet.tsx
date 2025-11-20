import { FC, useState } from 'react';
import { CopyIcon } from 'lucide-react';

import { useGetTransactionV2 } from '@/api/generated/ep-transactions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import { formatNumberToCurrency } from '../utils';

export type TransactionDetailsDialogTriggerProps = {
  children: React.ReactNode;
  transactionId: string;
};

export const TransactionDetailsDialogTrigger: FC<
  TransactionDetailsDialogTriggerProps
> = ({ children, transactionId }) => {
  const [open, setOpen] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(true);
  const {
    data: transaction,
    status,
    error,
    refetch,
  } = useGetTransactionV2(transactionId, { query: { enabled: open } });

  // Helper function to check if a field has a value
  const hasValue = (val: any): boolean => {
    return val !== null && val !== undefined && val !== '';
  };

  // Helper function to render a field conditionally
  const renderField = (
    label: string,
    value: any,
    formatter?: (val: any) => string
  ) => {
    const isEmpty = !hasValue(value);
    if (hideEmpty && isEmpty) return null;

    const displayValue = formatter ? formatter(value) : value || 'N/A';

    return (
      <div>
        <span className="eb-text-muted-foreground">{label}</span>
        <div>{displayValue}</div>
      </div>
    );
  };

  // Helper to format dates
  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Helper to format date-time
  const formatDateTime = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-scrollable-dialog eb-max-w-2xl">
        <DialogHeader>
          <DialogTitle className="eb-group eb-flex eb-items-center eb-gap-2 eb-text-lg">
            Transaction: {transactionId}
            <Button
              size="icon"
              variant="outline"
              className="eb-h-6 eb-w-6 eb-opacity-0 eb-transition-opacity group-hover:eb-opacity-100"
              onClick={() => navigator.clipboard.writeText(transactionId)}
            >
              <CopyIcon className="eb-h-3 eb-w-3" />
              <span className="eb-sr-only">Copy transaction ID</span>
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="eb--mt-2 eb-mb-3 eb-flex eb-items-center eb-justify-end eb-gap-2">
          <Switch
            id="show-all"
            checked={!hideEmpty}
            onCheckedChange={(checked) => setHideEmpty(!checked)}
          />
          <Label
            htmlFor="show-all"
            className="eb-text-xs eb-text-muted-foreground"
          >
            Show all fields
          </Label>
        </div>
        <div className="eb-scrollable-content eb-space-y-6 eb-text-sm">
          {status === 'pending' && (
            <div className="eb-py-8 eb-text-center eb-text-gray-500">
              Loading transaction details...
            </div>
          )}
          {status === 'error' && (
            <ServerErrorAlert
              error={error as any}
              customTitle="Failed to load transaction details"
              customErrorMessage={{
                '400': 'Invalid transaction ID. Please check and try again.',
                '401': 'Please log in and try again.',
                '403': 'You do not have permission to view this transaction.',
                '404': 'Transaction not found.',
                '500':
                  'An unexpected error occurred while loading transaction details. Please try again later.',
                '503':
                  'The service is currently unavailable. Please try again later.',
                default:
                  'Failed to load transaction details. Please try again.',
              }}
              tryAgainAction={() => {
                refetch();
              }}
              showDetails={false}
            />
          )}
          {status === 'success' && transaction && (
            <>
              {/* Amount Section */}
              <div className="eb-space-y-2">
                <div className="eb-text-base eb-font-semibold">Amount</div>
                <div className="eb-text-2xl eb-font-bold">
                  {transaction.amount
                    ? formatNumberToCurrency(
                        transaction.amount,
                        transaction.currency ?? 'USD'
                      )
                    : 'N/A'}
                </div>
                {renderField('Currency', transaction.currency)}
              </div>

              {/* General Section */}
              {(!hideEmpty ||
                hasValue(transaction.type) ||
                hasValue(transaction.status) ||
                hasValue(transaction.feeType)) && (
                <div className="eb-space-y-2">
                  <div className="eb-text-base eb-font-semibold">General</div>
                  <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                    {renderField('Type', transaction.type)}
                    {renderField('Status', transaction.status)}
                    {renderField('Fee Type', transaction.feeType)}
                  </div>
                </div>
              )}

              {/* Identifiers Section */}
              {(!hideEmpty ||
                hasValue(transaction.id) ||
                hasValue(transaction.transactionReferenceId) ||
                hasValue(transaction.originatingId) ||
                hasValue(transaction.originatingTransactionType)) && (
                <div className="eb-space-y-2">
                  <div className="eb-text-base eb-font-semibold">
                    Identifiers
                  </div>
                  <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                    {renderField('Transaction ID', transaction.id)}
                    {renderField(
                      'Transaction Reference ID',
                      transaction.transactionReferenceId
                    )}
                    {renderField('Originating ID', transaction.originatingId)}
                    {renderField(
                      'Originating Type',
                      transaction.originatingTransactionType
                    )}
                  </div>
                </div>
              )}

              {/* Dates & Versioning Section */}
              {(!hideEmpty ||
                hasValue(transaction.createdAt) ||
                hasValue(transaction.paymentDate) ||
                hasValue(transaction.effectiveDate) ||
                hasValue(transaction.postingVersion)) && (
                <div className="eb-space-y-2">
                  <div className="eb-text-base eb-font-semibold">
                    Dates & Versioning
                  </div>
                  <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                    {renderField(
                      'Created At',
                      transaction.createdAt,
                      formatDateTime
                    )}
                    {renderField(
                      'Payment Date',
                      transaction.paymentDate,
                      formatDate
                    )}
                    {renderField(
                      'Effective Date',
                      transaction.effectiveDate,
                      formatDateTime
                    )}
                    {renderField('Posting Version', transaction.postingVersion)}
                  </div>
                </div>
              )}

              {/* Debtor Section */}
              {(!hideEmpty ||
                hasValue(transaction.debtorName) ||
                hasValue(transaction.debtorAccountId) ||
                hasValue(transaction.debtorAccountNumber) ||
                hasValue(transaction.debtorClientId)) && (
                <div className="eb-space-y-2">
                  <div className="eb-text-base eb-font-semibold">Debtor</div>
                  <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                    {renderField('Name', transaction.debtorName)}
                    {renderField('Account ID', transaction.debtorAccountId)}
                    {renderField(
                      'Account Number',
                      transaction.debtorAccountNumber
                    )}
                    {renderField('Client ID', transaction.debtorClientId)}
                  </div>
                </div>
              )}

              {/* Creditor Section */}
              {(!hideEmpty ||
                hasValue(transaction.creditorName) ||
                hasValue(transaction.creditorAccountId) ||
                hasValue(transaction.creditorAccountNumber) ||
                hasValue(transaction.creditorClientId)) && (
                <div className="eb-space-y-2">
                  <div className="eb-text-base eb-font-semibold">Creditor</div>
                  <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                    {renderField('Name', transaction.creditorName)}
                    {renderField('Account ID', transaction.creditorAccountId)}
                    {renderField(
                      'Account Number',
                      transaction.creditorAccountNumber
                    )}
                    {renderField('Client ID', transaction.creditorClientId)}
                  </div>
                </div>
              )}

              {/* Financial Section */}
              {(!hideEmpty ||
                hasValue(transaction.ledgerBalance) ||
                hasValue(transaction.memo) ||
                hasValue(transaction.recipientId)) && (
                <div className="eb-space-y-2">
                  <div className="eb-text-base eb-font-semibold">Financial</div>
                  <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                    {renderField(
                      'Ledger Balance',
                      transaction.ledgerBalance,
                      (val) =>
                        formatNumberToCurrency(
                          val,
                          transaction.currency ?? 'USD'
                        )
                    )}
                    {renderField('Memo', transaction.memo)}
                    {renderField('Recipient ID', transaction.recipientId)}
                  </div>
                </div>
              )}

              {/* Error Section (conditional) */}
              {transaction.error && (
                <div className="eb-space-y-2 eb-rounded-md eb-border eb-border-red-200 eb-bg-red-50 eb-p-3">
                  <div className="eb-text-base eb-font-semibold eb-text-red-700">
                    Error Details
                  </div>
                  <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                    {renderField('Title', transaction.error.title)}
                    {renderField('HTTP Status', transaction.error.httpStatus)}
                    {renderField('Trace ID', transaction.error.traceId)}
                    {renderField('Request ID', transaction.error.requestId)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
