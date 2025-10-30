import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertCircle, Copy, Eye, EyeOff } from 'lucide-react';

import {
  useGetAccountBalance,
  useGetAccounts,
} from '@/api/generated/ep-accounts';
import type { AccountResponse } from '@/api/generated/ep-accounts.schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoPopover } from '@/components/LearnMorePopover/InfoPopover';

import { useInterceptorStatus } from '../EBComponentsProvider/EBComponentsProvider';

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
    const { interceptorReady } = useInterceptorStatus();
    const { data, isLoading, isError, refetch } = useGetAccounts(
      clientId ? { clientId } : undefined,
      {
        query: {
          enabled: interceptorReady,
        },
      }
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
        <Card className="eb-component eb-w-full">
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
        <Card className="eb-component eb-w-full">
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
        <Card className="eb-component eb-w-full">
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
        <Card className="eb-component eb-w-full">
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
                  className="eb-w-full eb-min-w-[600px] sm:eb-flex-1"
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
      <Card className="eb-component eb-w-full">
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

const formatNumberWithCommas = (value: number) => {
  // Format the number with thousands separators but keep decimal places separate
  const parts = value.toFixed(2).split('.');
  const formattedWhole = new Intl.NumberFormat('en-US').format(
    Number(parts[0])
  );
  return { whole: formattedWhole, decimal: parts[1] };
};

const AccountCard = forwardRef<AccountCardRef, AccountCardProps>(
  ({ account }, ref) => {
    const {
      data: balanceData,
      isLoading: isBalanceLoading,
      refetch,
    } = useGetAccountBalance(account.id);

    const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

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

    const formattedCategory =
      account.category === 'LIMITED_DDA_PAYMENTS'
        ? 'Payments DDA'
        : account.category === 'LIMITED_DDA'
          ? 'Limited DDA'
          : account.category;

    const maskedAccountNumber = account.paymentRoutingInformation?.accountNumber
      ? account.paymentRoutingInformation.accountNumber.replace(
          /.(?=.{4})/g,
          '*'
        )
      : 'N/A';

    return (
      <Card className="eb-mb-4 eb-flex eb-flex-col eb-border-2 eb-border-gray-200 eb-p-4">
        {/* Title Section */}
        <div className="eb-mb-4 eb-pl-4 eb-text-xl eb-font-semibold">
          {formattedCategory} | {maskedAccountNumber}
        </div>

        <div className="eb-flex eb-gap-4">
          {/* Left Section: Balances */}
          <div
            className={`eb-p-4 ${
              account.category === 'LIMITED_DDA' ? 'eb-flex-1' : 'eb-w-2/5'
            }`}
          >
            <div className="eb-mb-4 eb-text-sm eb-font-semibold">Overview</div>
            {isBalanceLoading ? (
              <Skeleton className="eb-h-4 eb-w-1/2" />
            ) : balanceData?.balanceTypes?.length ? (
              <div
                className={`eb-flex eb-gap-2 ${
                  account.category === 'LIMITED_DDA'
                    ? 'eb-flex-row'
                    : 'eb-flex-col'
                }`}
              >
                {balanceData.balanceTypes.map((b) => (
                  <div
                    key={b.typeCode}
                    className="eb-flex eb-w-full eb-flex-col eb-items-start"
                  >
                    <span className="eb-text-xs eb-font-medium eb-text-gray-500">
                      {b.typeCode === 'ITAV'
                        ? 'Available Balance'
                        : b.typeCode === 'ITBD'
                          ? 'Current Balance'
                          : b.typeCode}
                    </span>
                    <span className="eb-font-mono eb-text-lg eb-font-bold eb-text-metric">
                      {formatNumberWithCommas(Number(b.amount)).whole}
                      <span className="eb-text-sm">
                        .{formatNumberWithCommas(Number(b.amount)).decimal}{' '}
                        {balanceData.currency}
                      </span>
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

          {/* Right Section: Account Details */}
          {account.category !== 'LIMITED_DDA' && (
            <div className="eb-w-3/5 eb-p-4">
              <div className="eb-mb-4 eb-flex eb-items-center eb-gap-1.5">
                <span className="eb-text-sm eb-font-semibold">
                  Account Details
                </span>
                <InfoPopover className="eb-ml-4">
                  Account can be funded from external sources and is externally
                  addressable via routing/account numbers here
                </InfoPopover>
              </div>
              <div className="eb-flex eb-flex-col eb-gap-2">
                <div className="eb-flex eb-w-full eb-items-center eb-justify-between">
                  <span className="eb-text-xs eb-font-medium eb-text-gray-500">
                    Account Number:
                  </span>
                  <div className="eb-flex eb-items-center">
                    <span className="eb-font-mono eb-text-sm">
                      {showSensitiveInfo
                        ? account.paymentRoutingInformation?.accountNumber ||
                          'N/A'
                        : maskedAccountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={toggleSensitiveInfo}
                      className="eb-ml-2 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-gray-400 hover:eb-text-gray-600"
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
                    <button
                      type="button"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          account.paymentRoutingInformation?.accountNumber || ''
                        )
                      }
                      className="eb-ml-2 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-gray-400 hover:eb-text-gray-600"
                      title="Copy account number"
                      aria-label="Copy account number"
                    >
                      <Copy className="eb-h-3 eb-w-3" />
                    </button>
                  </div>
                </div>
                <div className="eb-flex eb-w-full eb-items-center eb-justify-between">
                  <span className="eb-text-xs eb-font-medium eb-text-gray-500">
                    ACH Routing:
                  </span>
                  <div className="eb-flex eb-items-center">
                    <span className="eb-font-mono eb-text-sm">028000024</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText('028000024')}
                      className="eb-ml-2 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-gray-400 hover:eb-text-gray-600"
                      title="Copy ACH Routing"
                      aria-label="Copy ACH Routing"
                    >
                      <Copy className="eb-h-3 eb-w-3" />
                    </button>
                  </div>
                </div>
                <div className="eb-flex eb-w-full eb-items-center eb-justify-between">
                  <span className="eb-text-xs eb-font-medium eb-text-gray-500">
                    Wire/RTP Routing:
                  </span>
                  <div className="eb-flex eb-items-center">
                    <span className="eb-font-mono eb-text-sm">021000021</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText('021000021')}
                      className="eb-ml-2 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-gray-400 hover:eb-text-gray-600"
                      title="Copy Wire/RTP Routing"
                      aria-label="Copy Wire/RTP Routing"
                    >
                      <Copy className="eb-h-3 eb-w-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

// Add display name for AccountCard
AccountCard.displayName = 'AccountCard';
