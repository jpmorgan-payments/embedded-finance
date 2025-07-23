import React, { FC, useMemo } from 'react';
import { AlertCircle, Info } from 'lucide-react';

import {
  useGetAccountBalance,
  useGetAccounts,
} from '@/api/generated/ep-accounts';
import type { AccountResponse } from '@/api/generated/ep-accounts.schemas';
import { Card } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORY_LABELS: Record<string, string> = {
  LIMITED_DDA: 'Limited DDA',
  LIMITED_DDA_PAYMENTS: 'Limited DDA (Payments)',
  // Add more mappings as needed
};

const BALANCE_TYPE_LABELS: Record<
  string,
  { label: string; description: string }
> = {
  ITAV: {
    label: 'Available Balance',
    description:
      'Interim available balance: the available balance at the time of the request.',
  },
  ITBD: {
    label: 'Booked Balance',
    description:
      'Interim booked balance: the booked or cleared balance at the time of the request.',
  },
};

export interface AccountsProps {
  allowedCategories: string[];
  clientId?: string;
}

export const Accounts: FC<AccountsProps> = ({
  allowedCategories,
  clientId,
}) => {
  const { data, isLoading, isError } = useGetAccounts(
    clientId ? { clientId } : undefined
  );

  const filteredAccounts = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((account: AccountResponse) =>
      allowedCategories.includes(account.category)
    );
  }, [data, allowedCategories]);

  if (isLoading) {
    return (
      <div className="eb-space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="eb-w-full">
            <div className="eb-p-4">
              <Skeleton className="eb-h-6 eb-w-1/3" />
              <Skeleton className="eb-mb-2 eb-h-4 eb-w-1/2" />
              <Skeleton className="eb-h-4 eb-w-1/4" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="eb-flex eb-items-center eb-gap-2 eb-text-red-600">
        <AlertCircle className="eb-h-5 eb-w-5" />
        <span>Failed to load accounts.</span>
      </div>
    );
  }

  if (!filteredAccounts.length) {
    return <div className="eb-text-muted-foreground">No accounts found.</div>;
  }

  // If more than one account, wrap each in its own Card for visual separation
  if (filteredAccounts.length > 1) {
    return (
      <div className="eb-flex eb-flex-col eb-flex-wrap eb-gap-6">
        {filteredAccounts.map((account: AccountResponse) => (
          <div
            key={account.id}
            className="eb-w-full eb-min-w-[500px] sm:eb-flex-1"
          >
            <AccountCard account={account} />
          </div>
        ))}
      </div>
    );
  }

  // Single account, no extra wrapper
  return <AccountCard account={filteredAccounts[0]} />;
};

interface AccountCardProps {
  account: AccountResponse;
}

const AccountCard: FC<AccountCardProps> = ({ account }) => {
  const { data: balanceData, isLoading: isBalanceLoading } =
    useGetAccountBalance(account.id);

  return (
    <Card className="eb-mb-4 eb-flex eb-flex-col eb-items-center eb-justify-between eb-gap-4 eb-p-4 eb-shadow-sm eb-border-2 eb-border-gray-200 sm:eb-flex-row">
      {/* Left: Main Info */}
      <div className="eb-flex eb-min-w-0 eb-flex-1 eb-flex-col eb-gap-1">
        <div className="eb-flex eb-items-center eb-gap-2 eb-truncate eb-text-base eb-font-semibold">
          {CATEGORY_LABELS[account.category] || account.category}
          <span className="eb-text-xs eb-font-normal eb-text-muted-foreground">
            {account.label}
          </span>
        </div>
        <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-text-gray-600">
          <span className="eb-font-medium">State:</span>
          <span>{account.state}</span>
        </div>
        {account.paymentRoutingInformation?.accountNumber && (
          <div className="eb-mt-1 eb-flex eb-items-center eb-gap-2 eb-text-xs eb-text-gray-600">
            <span className="eb-font-medium">Routing:</span>
            <span className="eb-font-mono eb-text-xs">
              {maskRoutingInfo(account.paymentRoutingInformation.accountNumber)}
            </span>
            {Array.isArray(
              account.paymentRoutingInformation.routingInformation
            ) &&
              account.paymentRoutingInformation.routingInformation.length >
                0 && (
                <span className="eb-ml-2 eb-text-gray-400">
                  {account.paymentRoutingInformation.routingInformation
                    .map((ri) => ri.value)
                    .join(', ')}
                </span>
              )}
          </div>
        )}
      </div>
      {/* Right: Balances */}
      <div className="eb-mt-4 eb-flex eb-min-w-[180px] eb-max-w-xs eb-flex-col eb-items-end eb-gap-1 sm:eb-mt-0">
        <div className="eb-mb-1 eb-text-sm eb-font-medium">Balances</div>
        {isBalanceLoading ? (
          <Skeleton className="eb-h-4 eb-w-1/2" />
        ) : balanceData?.balanceTypes?.length ? (
          <div className="eb-flex eb-w-full eb-flex-col eb-gap-1">
            {balanceData.balanceTypes.map((b) => (
              <div
                key={b.typeCode}
                className="eb-flex eb-items-center eb-justify-end eb-gap-2"
              >
                <span className="eb-text-xs eb-font-medium">
                  {BALANCE_TYPE_LABELS[String(b.typeCode)]?.label || b.typeCode}
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <span
                      className="eb-ml-1 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-gray-400"
                      title="Info"
                    >
                      <Info
                        className="eb-h-4 eb-w-4 eb-text-blue-400 hover:eb-text-blue-600"
                        aria-label="Info"
                      />
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="eb-max-w-xs eb-text-xs">
                    {BALANCE_TYPE_LABELS[String(b.typeCode)]?.description ||
                      'No description.'}
                  </PopoverContent>
                </Popover>
                <span className="eb-font-mono eb-text-right eb-text-xs">
                  {b.amount} {balanceData.currency}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <span className="eb-text-xs eb-text-muted-foreground">
            No balance data.
          </span>
        )}
      </div>
    </Card>
  );
};

function maskRoutingInfo(accountNumber: string): string {
  if (!accountNumber) return 'N/A';
  return accountNumber.length > 4
    ? accountNumber.replace(/.(?=.{4})/g, '*')
    : accountNumber;
}
