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

import { formatNumberToCurrency } from '../utils/formatNumberToCurrency';

export type TransactionDetailsDialogTriggerProps = {
  children: React.ReactNode;
  transactionId: string;
};

export const TransactionDetailsDialogTrigger: FC<
  TransactionDetailsDialogTriggerProps
> = ({ children, transactionId }) => {
  const [open, setOpen] = useState(false);
  const {
    data: transaction,
    status,
    error,
  } = useGetTransactionV2(transactionId, { query: { enabled: open } });

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
        <div className="eb-scrollable-content eb-space-y-6 eb-text-sm">
          {status === 'pending' && (
            <div className="eb-py-8 eb-text-center eb-text-gray-500">
              Loading transaction details...
            </div>
          )}
          {status === 'error' && (
            <div className="eb-py-8 eb-text-center eb-text-red-500">
              Error: {error?.message || 'Failed to load transaction.'}
            </div>
          )}
          {status === 'success' && transaction && (
            <>
              {/* Amount at the top */}
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
                <div className="eb-text-xs eb-text-muted-foreground">
                  Currency: {transaction.currency || 'N/A'}
                </div>
              </div>

              {/* General Info */}
              <div className="eb-space-y-2">
                <div className="eb-text-base eb-font-semibold">General</div>
                <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                  <div>
                    <span className="eb-text-muted-foreground">Type</span>
                    <div>{transaction.type || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">Status</span>
                    <div>{transaction.status || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">
                      Transaction Reference ID
                    </span>
                    <div>{transaction.transactionReferenceId || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">Memo</span>
                    <div>{transaction.memo || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">
                      Originating ID
                    </span>
                    <div>{transaction.originatingId || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">
                      Originating Type
                    </span>
                    <div>{transaction.originatingTransactionType || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">
                      Posting Version
                    </span>
                    <div>{transaction.postingVersion ?? 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">
                      Ledger Balance
                    </span>
                    <div>{transaction.ledgerBalance ?? 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">
                      Payment Date
                    </span>
                    <div>
                      {transaction.paymentDate
                        ? new Date(transaction.paymentDate).toLocaleDateString(
                            'en-US'
                          )
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">Created At</span>
                    <div>
                      {transaction.createdAt
                        ? new Date(transaction.createdAt).toLocaleString(
                            'en-US'
                          )
                        : 'N/A'}
                    </div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">
                      Effective Date
                    </span>
                    <div>
                      {transaction.effectiveDate
                        ? new Date(
                            transaction.effectiveDate
                          ).toLocaleDateString('en-US')
                        : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Debtor Party */}
              <div className="eb-space-y-2">
                <div className="eb-text-base eb-font-semibold">Debtor</div>
                <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                  <div>
                    <span className="eb-text-muted-foreground">Name</span>
                    <div>{transaction.debtorName || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">Account ID</span>
                    <div>{transaction.debtorAccountId || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">
                      Account Number
                    </span>
                    <div>{transaction.debtorAccountNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">Client ID</span>
                    <div>{transaction.debtorClientId || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Creditor Party */}
              <div className="eb-space-y-2">
                <div className="eb-text-base eb-font-semibold">Creditor</div>
                <div className="eb-grid eb-grid-cols-1 eb-gap-3 md:eb-grid-cols-2">
                  <div>
                    <span className="eb-text-muted-foreground">Name</span>
                    <div>{transaction.creditorName || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">Account ID</span>
                    <div>{transaction.creditorAccountId || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">
                      Account Number
                    </span>
                    <div>{transaction.creditorAccountNumber || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="eb-text-muted-foreground">Client ID</span>
                    <div>{transaction.creditorClientId || 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Recipient ID */}
              <div className="eb-space-y-2">
                <div className="eb-text-base eb-font-semibold">Recipient</div>
                <div>
                  <span className="eb-text-muted-foreground">Recipient ID</span>
                  <div>{transaction.recipientId || 'N/A'}</div>
                </div>
              </div>
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
