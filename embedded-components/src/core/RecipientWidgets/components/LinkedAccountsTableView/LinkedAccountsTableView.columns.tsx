import { ColumnDef } from '@tanstack/react-table';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

import {
  getAccountHolderType,
  getMaskedAccountNumber,
  getSupportedPaymentMethods,
} from '@/lib/recipientHelpers';
import { Recipient } from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { StatusBadge } from '../StatusBadge/StatusBadge';

/**
 * Format date for display
 */
const formatDate = (date?: string, naText = 'N/A'): string => {
  if (!date) return naText;
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get account holder name from recipient
 */
const getAccountHolderName = (recipient: Recipient): string => {
  if (recipient.partyDetails?.type === 'INDIVIDUAL') {
    return [recipient.partyDetails?.firstName, recipient.partyDetails?.lastName]
      .filter(Boolean)
      .join(' ');
  }
  return recipient.partyDetails?.businessName || 'N/A';
};

/**
 * Account number cell component with show/hide toggle
 */
interface AccountNumberCellProps {
  recipient: Recipient;
  showFullNumber: boolean;
  onToggle: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, options?: any) => string;
}

export const AccountNumberCell: React.FC<AccountNumberCellProps> = ({
  recipient,
  showFullNumber,
  onToggle,
  t,
}) => {
  const masked = getMaskedAccountNumber(recipient);
  const fullNumber = recipient.account?.number || masked;

  return (
    <div className="eb-flex eb-items-center eb-gap-2">
      <span className="eb-font-mono eb-text-sm">
        {showFullNumber ? fullNumber : masked}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="eb-h-6 eb-w-6"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(recipient.id);
        }}
        aria-label={
          showFullNumber
            ? t('table.hideAccountNumber', {
                defaultValue: 'Hide account number',
              })
            : t('table.showAccountNumber', {
                defaultValue: 'Show account number',
              })
        }
      >
        {showFullNumber ? (
          <EyeOffIcon className="eb-h-3.5 eb-w-3.5" />
        ) : (
          <EyeIcon className="eb-h-3.5 eb-w-3.5" />
        )}
      </Button>
    </div>
  );
};

/**
 * Options for column generation
 */
export interface GetLinkedAccountsColumnsOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, options?: any) => string;
  /** Render the combined actions cell (includes pay, verify, edit, details, remove) */
  renderActionsCell?: (recipient: Recipient) => React.ReactNode;
  visibleAccountNumbers: Set<string>;
  onToggleAccountNumber: (id: string) => void;
}

/**
 * Column definitions for the linked accounts table
 */
export const getLinkedAccountsColumns = ({
  t,
  renderActionsCell,
  visibleAccountNumbers,
  onToggleAccountNumber,
}: GetLinkedAccountsColumnsOptions): ColumnDef<Recipient, unknown>[] => {
  const naText = 'N/A';

  return [
    // Account Holder Name
    {
      id: 'accountHolder',
      accessorFn: (row) => getAccountHolderName(row),
      header: () => (
        <span className="eb-font-medium">
          {t('table.columns.accountHolder', { defaultValue: 'Account Holder' })}
        </span>
      ),
      cell: ({ row }) => {
        const recipient = row.original;
        const name = getAccountHolderName(recipient);
        const type = getAccountHolderType(recipient);

        return (
          <div className="eb-flex eb-flex-col eb-gap-0.5">
            <span className="eb-font-medium">{name}</span>
            <span className="eb-text-xs eb-text-muted-foreground">{type}</span>
          </div>
        );
      },
    },

    // Account Number (with show/hide toggle)
    {
      id: 'accountNumber',
      accessorFn: (row) => getMaskedAccountNumber(row),
      header: () => (
        <span className="eb-font-medium">
          {t('table.columns.accountNumber', { defaultValue: 'Account Number' })}
        </span>
      ),
      cell: ({ row }) => {
        const recipient = row.original;
        const showFull = visibleAccountNumbers.has(recipient.id);

        return (
          <AccountNumberCell
            recipient={recipient}
            showFullNumber={showFull}
            onToggle={onToggleAccountNumber}
            t={t}
          />
        );
      },
    },

    // Status
    {
      id: 'status',
      accessorKey: 'status',
      header: () => (
        <span className="eb-font-medium">
          {t('table.columns.status', { defaultValue: 'Status' })}
        </span>
      ),
      cell: ({ row }) => {
        const { status } = row.original;
        if (!status)
          return <span className="eb-text-muted-foreground">{naText}</span>;
        return <StatusBadge status={status} showIcon />;
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },

    // Payment Methods
    {
      id: 'paymentMethods',
      accessorFn: (row) => getSupportedPaymentMethods(row).join(', '),
      header: () => (
        <span className="eb-font-medium">
          {t('table.columns.paymentMethods', {
            defaultValue: 'Payment Methods',
          })}
        </span>
      ),
      cell: ({ row }) => {
        const methods = getSupportedPaymentMethods(row.original);
        if (methods.length === 0) {
          return <span className="eb-text-muted-foreground">{naText}</span>;
        }
        return (
          <div className="eb-flex eb-flex-wrap eb-gap-1">
            {methods.map((method) => (
              <Badge key={method} variant="outline" className="eb-text-xs">
                {method}
              </Badge>
            ))}
          </div>
        );
      },
    },

    // Created Date
    {
      id: 'createdAt',
      accessorKey: 'createdAt',
      header: () => (
        <span className="eb-font-medium">
          {t('table.columns.createdAt', { defaultValue: 'Created' })}
        </span>
      ),
      cell: ({ getValue }) => {
        const date = getValue<string>();
        return (
          <span className="eb-text-sm eb-text-muted-foreground">
            {formatDate(date, naText)}
          </span>
        );
      },
    },

    // Combined Actions column (includes pay, verify, edit, details, remove)
    {
      id: 'actions',
      header: () => (
        <span className="eb-sr-only">
          {t('table.columns.actions', { defaultValue: 'Actions' })}
        </span>
      ),
      cell: ({ row }) => {
        if (renderActionsCell) {
          return renderActionsCell(row.original);
        }
        return null;
      },
      enableHiding: false,
    },
  ];
};
