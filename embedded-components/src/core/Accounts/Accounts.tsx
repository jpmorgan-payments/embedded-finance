import React, {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle, Eye, EyeOff, Info } from 'lucide-react';

import {
  useGetAccountBalance,
  useGetAccounts,
} from '@/api/generated/ep-accounts';
import type { AccountResponse } from '@/api/generated/ep-accounts.schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  /** Optional title for the accounts section */
  title?: string;
}

// Define the ref interface for external actions
export interface AccountsRef {
  refresh: () => void;
  // Add other actions as needed
  // exportAccounts: () => void;
  // getAccountsData: () => AccountResponse[];
}

// Define the ref interface for AccountCard
export interface AccountCardRef {
  refreshBalance: () => void;
}

export const Accounts = forwardRef<AccountsRef, AccountsProps>(
  ({ allowedCategories, clientId, title = 'Accounts' }, ref) => {
    const { data, isLoading, isError, refetch } = useGetAccounts(
      clientId ? { clientId } : undefined
    );

    const filteredAccounts = useMemo(() => {
      if (!data?.items) return [];
      return data.items.filter((account: AccountResponse) =>
        allowedCategories.includes(account.category)
      );
    }, [data, allowedCategories]);

    // Create refs for each AccountCard
    const accountCardRefs = useRef<Record<string, AccountCardRef | null>>({});

    // Expose internal methods to parent component
    useImperativeHandle(
      ref,
      () => ({
        refresh: () => {
          // This will trigger both accounts and balances refresh
          refetch();
          // Also trigger individual balance refetches for each account card
          Object.values(accountCardRefs.current).forEach((cardRef) => {
            cardRef?.refreshBalance();
          });
        },
        // Add other actions as needed:
        // exportAccounts: () => {
        //   // Export accounts data
        //   console.log('Exporting accounts:', filteredAccounts);
        // },
        // getAccountsData: () => {
        //   return filteredAccounts;
        // },
      }),
      [refetch, filteredAccounts]
    );

    if (isLoading) {
      return (
        <Card className="eb-w-full">
          <CardHeader>
            <CardTitle className="eb-text-xl eb-font-semibold">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="eb-space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="eb-w-full">
                  <div className="eb-p-4">
                    <Skeleton className="eb-h-6 eb-w-1/3" />
                    <Skeleton className="eb-mb-2 eb-h-4 eb-w-1/2" />
                    <Skeleton className="eb-h-4 eb-w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (isError) {
      return (
        <Card className="eb-w-full">
          <CardHeader>
            <CardTitle className="eb-text-xl eb-font-semibold">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="eb-flex eb-items-center eb-gap-2 eb-text-red-600">
              <AlertCircle className="eb-h-5 eb-w-5" />
              <span>Failed to load accounts.</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!filteredAccounts.length) {
      return (
        <Card className="eb-w-full">
          <CardHeader>
            <CardTitle className="eb-text-xl eb-font-semibold">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="eb-text-muted-foreground">No accounts found.</div>
          </CardContent>
        </Card>
      );
    }

    // If more than one account, wrap each in its own Card for visual separation
    if (filteredAccounts.length > 1) {
      return (
        <Card className="eb-w-full">
          <CardHeader>
            <CardTitle className="eb-text-xl eb-font-semibold">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="eb-flex eb-flex-col eb-flex-wrap eb-gap-6">
              {filteredAccounts.map((account: AccountResponse) => (
                <div
                  key={account.id}
                  className="eb-w-full eb-min-w-[500px] sm:eb-flex-1"
                >
                  <AccountCard
                    account={account}
                    ref={(cardRef) => {
                      accountCardRefs.current[account.id] = cardRef;
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Single account, no extra wrapper
    return (
      <Card className="eb-w-full">
        <CardHeader>
          <CardTitle className="eb-text-xl eb-font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AccountCard
            account={filteredAccounts[0]}
            ref={(cardRef) => {
              accountCardRefs.current[filteredAccounts[0].id] = cardRef;
            }}
          />
        </CardContent>
      </Card>
    );
  }
);

// Add display name for better debugging
Accounts.displayName = 'Accounts';

interface AccountCardProps {
  account: AccountResponse;
}

const AccountCard = forwardRef<AccountCardRef, AccountCardProps>(
  ({ account }, ref) => {
    const {
      data: balanceData,
      isLoading: isBalanceLoading,
      refetch,
    } = useGetAccountBalance(account.id);

    // State for showing/hiding sensitive information
    const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

    // Expose refresh method to parent component
    useImperativeHandle(
      ref,
      () => ({
        refreshBalance: () => {
          refetch();
        },
      }),
      [refetch]
    );

    const toggleSensitiveInfo = () => {
      setShowSensitiveInfo(!showSensitiveInfo);
    };

    return (
      <Card className="eb-mb-4 eb-flex eb-flex-col eb-border-2 eb-border-gray-200 eb-p-4 eb-shadow-sm sm:eb-flex-row sm:eb-items-stretch">
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
            <div className="eb-mt-2 eb-flex eb-flex-col eb-gap-1">
              {/* Routing Number */}
              {Array.isArray(
                account.paymentRoutingInformation.routingInformation
              ) &&
                account.paymentRoutingInformation.routingInformation.length >
                  0 && (
                  <div className="eb-flex eb-items-center eb-gap-2 eb-text-xs eb-text-gray-600">
                    <span className="eb-font-medium">Routing Number:</span>
                    <span className="eb-font-mono eb-text-xs">
                      {showSensitiveInfo
                        ? account.paymentRoutingInformation.routingInformation
                            .map((ri) => ri.value)
                            .join(', ')
                        : maskRoutingInfo(
                            account.paymentRoutingInformation.routingInformation
                              .map((ri) => ri.value)
                              .join(', ')
                          )}
                    </span>
                  </div>
                )}
              {/* Account Number */}
              <div className="eb-flex eb-items-center eb-gap-2 eb-text-xs eb-text-gray-600">
                <span className="eb-font-medium">Account Number:</span>
                <span className="eb-font-mono eb-text-xs">
                  {showSensitiveInfo
                    ? account.paymentRoutingInformation.accountNumber
                    : maskAccountNumber(
                        account.paymentRoutingInformation.accountNumber
                      )}
                </span>
                <button
                  type="button"
                  onClick={toggleSensitiveInfo}
                  className="eb-ml-1 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-gray-400 hover:eb-text-gray-600"
                  title={
                    showSensitiveInfo
                      ? 'Hide account details'
                      : 'Show account details'
                  }
                  aria-label={
                    showSensitiveInfo
                      ? 'Hide account details'
                      : 'Show account details'
                  }
                >
                  {showSensitiveInfo ? (
                    <EyeOff className="eb-h-3 eb-w-3" />
                  ) : (
                    <Eye className="eb-h-3 eb-w-3" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Right: Balances - Aligned to bottom */}
        <div className="eb-mt-4 eb-flex eb-min-w-[180px] eb-max-w-xs eb-flex-col eb-items-end eb-justify-end eb-gap-1 sm:eb-mt-0">
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
                  <span className="eb-text-sm eb-font-medium">
                    {BALANCE_TYPE_LABELS[String(b.typeCode)]?.label ||
                      b.typeCode}
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <span
                        className="eb-ml-1 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-gray-400"
                        title="Info"
                      >
                        <Info
                          className="eb-h-4 eb-w-5 eb-text-blue-400 hover:eb-text-blue-600"
                          aria-label="Info"
                        />
                      </span>
                    </PopoverTrigger>
                    <PopoverContent className="eb-max-w-xs eb-text-xs">
                      {BALANCE_TYPE_LABELS[String(b.typeCode)]?.description ||
                        'No description.'}
                    </PopoverContent>
                  </Popover>
                  <span className="eb-font-mono eb-text-right eb-text-sm">
                    {Number(b.amount).toFixed(2)} {balanceData.currency}
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
  }
);

// Add display name for AccountCard
AccountCard.displayName = 'AccountCard';

function maskRoutingInfo(routingNumber: string): string {
  if (!routingNumber) return 'N/A';
  return routingNumber.length > 4
    ? routingNumber.replace(/.(?=.{4})/g, '*')
    : routingNumber;
}

function maskAccountNumber(accountNumber: string): string {
  if (!accountNumber) return 'N/A';
  return accountNumber.length > 4
    ? accountNumber.replace(/.(?=.{4})/g, '*')
    : accountNumber;
}
