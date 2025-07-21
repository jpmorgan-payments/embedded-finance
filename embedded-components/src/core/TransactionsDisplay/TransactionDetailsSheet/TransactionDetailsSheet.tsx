import { FC, useState } from 'react';
import { CopyIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui';

import { formatNumberToCurrency } from '../utils/formatNumberToCurrency';
import { ModifiedTransaction } from '../utils/modifyTransactionsData';

export type TransactionDetailsDialogTriggerProps = {
  children: React.ReactNode;
  transaction: ModifiedTransaction;
};

export const TransactionDetailsDialogTrigger: FC<
  TransactionDetailsDialogTriggerProps
> = ({ children, transaction }) => {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="eb-scrollable-dialog eb-max-w-2xl">
        <DialogHeader>
          <DialogTitle className="eb-group eb-flex eb-items-center eb-gap-2 eb-text-lg">
            Transaction: {transaction.id}
            <Button
              size="icon"
              variant="outline"
              className="eb-h-6 eb-w-6 eb-opacity-0 eb-transition-opacity group-hover:eb-opacity-100"
              onClick={() =>
                navigator.clipboard.writeText(transaction.id ?? '')
              }
            >
              <CopyIcon className="eb-h-3 eb-w-3" />
              <span className="eb-sr-only">Copy transaction ID</span>
            </Button>
          </DialogTitle>
          <DialogDescription>
            Date:{' '}
            {transaction.paymentDate === undefined
              ? 'N/A'
              : new Date(transaction.paymentDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
          </DialogDescription>
          <DialogDescription>Status: {transaction.status}</DialogDescription>
        </DialogHeader>
        <div className="eb-scrollable-content eb-text-sm">
          <div className="eb-grid eb-gap-3">
            <div className="eb-font-semibold">Transaction Details</div>
            <ul className="eb-grid eb-gap-3">
              <li className="eb-flex eb-items-center eb-justify-between">
                <span className="eb-text-muted-foreground">Amount</span>
                <span>
                  {transaction.amount
                    ? formatNumberToCurrency(
                        transaction.amount,
                        transaction.currency ?? 'USD'
                      )
                    : 'N/A'}
                </span>
              </li>
              <li className="eb-flex eb-items-center eb-justify-between">
                <span className="eb-text-muted-foreground">Currency</span>
                <span>{transaction.currency}</span>
              </li>
              <li className="eb-flex eb-items-center eb-justify-between">
                <span className="eb-text-muted-foreground">Type</span>
                <span>{transaction.type}</span>
              </li>
            </ul>
          </div>

          <Separator className="eb-my-4" />
        </div>
        <DialogClose asChild>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
