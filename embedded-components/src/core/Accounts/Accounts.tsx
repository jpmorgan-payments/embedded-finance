import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useElementWidth } from '@/utils/useElementWidth';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Landmark,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  useGetAccountBalance,
  useGetAccounts,
} from '@/api/generated/ep-accounts';
import type { AccountResponse } from '@/api/generated/ep-accounts.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    const { t } = useTranslation();
    const { interceptorReady } = useInterceptorStatus();
    const [containerRef, containerWidth] = useElementWidth<HTMLDivElement>();
    const { data, isLoading, isError, refetch } = useGetAccounts(
      clientId ? { clientId } : undefined,
      {
        query: {
          enabled: interceptorReady,
        },
      }
    );

    // Responsive breakpoints
    const isMobile = containerWidth > 0 && containerWidth < 640;

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
            <div className="eb-space-y-6">
              {[...Array(2)].map((_, i) => (
                <Card
                  key={i}
                  className="eb-mb-4 eb-flex eb-flex-col eb-border-2 eb-border-gray-200 eb-p-4"
                >
                  {/* Title Section Skeleton */}
                  <div className="eb-mb-4 eb-flex eb-items-center eb-gap-3 eb-pl-4">
                    <Skeleton className="eb-h-6 eb-w-64" />
                    <Skeleton className="eb-h-5 eb-w-16 eb-rounded-full" />
                  </div>

                  {/* Content Section Skeleton */}
                  <div className="eb-flex eb-gap-4">
                    {/* Left Section: Balances */}
                    <div className="eb-w-2/5 eb-p-4">
                      <Skeleton className="eb-mb-4 eb-h-4 eb-w-20" />
                      <div className="eb-flex eb-flex-col eb-gap-4">
                        <div className="eb-space-y-2">
                          <Skeleton className="eb-h-3 eb-w-32" />
                          <Skeleton className="eb-h-8 eb-w-40" />
                        </div>
                        <div className="eb-space-y-2">
                          <Skeleton className="eb-h-3 eb-w-28" />
                          <Skeleton className="eb-h-8 eb-w-36" />
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Account Details */}
                    <div className="eb-w-3/5 eb-p-4">
                      <div className="eb-mb-4 eb-flex eb-items-center eb-gap-1.5">
                        <Skeleton className="eb-h-4 eb-w-28" />
                        <Skeleton className="eb-h-4 eb-w-4 eb-rounded-full" />
                      </div>
                      <div className="eb-flex eb-flex-col eb-gap-2">
                        <div className="eb-flex eb-w-full eb-items-center eb-justify-between">
                          <Skeleton className="eb-h-3 eb-w-24" />
                          <Skeleton className="eb-h-4 eb-w-32" />
                        </div>
                        <div className="eb-flex eb-w-full eb-items-center eb-justify-between">
                          <Skeleton className="eb-h-3 eb-w-20" />
                          <Skeleton className="eb-h-4 eb-w-24" />
                        </div>
                        <div className="eb-flex eb-w-full eb-items-center eb-justify-between">
                          <Skeleton className="eb-h-3 eb-w-28" />
                          <Skeleton className="eb-h-4 eb-w-24" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
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
          <CardContent className="eb-pt-6">
            <Alert variant="destructive">
              <AlertCircle className="eb-h-4 eb-w-4" />
              <AlertDescription>
                {t('accounts:error.loadFailed', {
                  defaultValue: 'Failed to load accounts. Please try again.',
                })}
                <Button
                  variant="link"
                  className="eb-ml-2 eb-h-auto eb-p-0"
                  onClick={() => refetch()}
                >
                  {t('accounts:error.retry', { defaultValue: 'Retry' })}
                </Button>
              </AlertDescription>
            </Alert>
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
            <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-space-y-3 eb-py-12 eb-text-center">
              <div className="eb-relative">
                <div className="eb-rounded-full eb-bg-muted eb-p-4">
                  <Landmark className="eb-h-8 eb-w-8 eb-text-muted-foreground" />
                </div>
              </div>
              <div className="eb-space-y-1">
                <h3 className="eb-text-base eb-font-semibold eb-text-foreground">
                  {t('accounts:emptyState.title', {
                    defaultValue: 'No accounts found',
                  })}
                </h3>
                <p className="eb-max-w-sm eb-text-sm eb-text-muted-foreground">
                  {t('accounts:emptyState.description', {
                    defaultValue:
                      'No accounts match the selected categories. Contact support if you need to create an account.',
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // If more than one account, wrap each in its own Card for visual separation
    if (filteredAccounts.length > 1) {
      return (
        <Card className="eb-component eb-w-full" ref={containerRef}>
          <CardHeader>
            <CardTitle className="eb-text-xl eb-font-semibold">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`eb-flex eb-gap-6 ${
                isMobile ? 'eb-flex-col' : 'eb-flex-row eb-flex-wrap'
              }`}
            >
              {filteredAccounts.map((account: AccountResponse, index) => (
                <div
                  key={account.id}
                  className={`eb-w-full eb-animate-fade-in ${isMobile ? '' : 'eb-min-w-[300px] eb-flex-1'}`}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animationFillMode: 'backwards',
                  }}
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
      <Card className="eb-component eb-w-full" ref={containerRef}>
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

// Status badge variant mapping
const getAccountStatusVariant = (state?: string) => {
  switch (state) {
    case 'OPEN':
      return 'success';
    case 'CLOSED':
      return 'destructive';
    case 'PENDING':
      return 'warning';
    case 'SUSPENDED':
      return 'secondary';
    default:
      return 'outline';
  }
};

// Get icon for account status (aligned with LinkedAccountWidget pattern)
const getAccountStatusIcon = (state?: string) => {
  const iconClass = 'eb-h-3.5 eb-w-3.5';
  switch (state) {
    case 'OPEN':
      return <CheckCircle2 className={iconClass} />;
    case 'CLOSED':
      return <XCircle className={iconClass} />;
    case 'PENDING':
      return <Clock className={iconClass} />;
    case 'SUSPENDED':
      return <AlertTriangle className={iconClass} />;
    default:
      return null;
  }
};

const AccountCard = forwardRef<AccountCardRef, AccountCardProps>(
  ({ account }, ref) => {
    const { t } = useTranslation();
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

    // Mask account number: show last 4 digits with 4 asterisks (aligned with LinkedAccountWidget pattern)
    const maskedAccountNumber = account.paymentRoutingInformation?.accountNumber
      ? `****${account.paymentRoutingInformation.accountNumber.slice(-4)}`
      : 'N/A';

    return (
      <Card className="eb-mb-4 eb-flex eb-flex-col eb-border-2 eb-border-gray-200 eb-p-4">
        {/* Title Section with Status Badge */}
        <div className="eb-mb-4 eb-flex eb-items-center eb-gap-3 eb-pl-4">
          <div className="eb-text-xl eb-font-semibold">
            {formattedCategory} | {maskedAccountNumber}
          </div>
          {account.state && (
            <Badge
              variant={getAccountStatusVariant(account.state) as any}
              className="eb-inline-flex eb-items-center eb-gap-1 eb-text-xs"
            >
              {getAccountStatusIcon(account.state)}
              {account.state.replace(/_/g, ' ')}
            </Badge>
          )}
        </div>

        <div
          className={`eb-flex eb-gap-4 ${
            account.category === 'LIMITED_DDA' ? 'eb-flex-col' : 'eb-flex-row'
          }`}
        >
          {/* Left Section: Balances */}
          <div
            className={`eb-p-4 ${
              account.category === 'LIMITED_DDA' ? 'eb-w-full' : 'eb-w-2/5'
            }`}
          >
            <div className="eb-mb-4 eb-text-sm eb-font-semibold">
              {t('accounts:card.overview', { defaultValue: 'Overview' })}
            </div>
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
                      {t(`accounts:balanceTypes.${b.typeCode}`, {
                        defaultValue:
                          b.typeCode === 'ITAV'
                            ? 'Available Balance'
                            : b.typeCode === 'ITBD'
                              ? 'Current Balance'
                              : b.typeCode,
                      })}
                    </span>
                    <span className="eb-font-mono eb-text-2xl eb-font-bold eb-leading-tight eb-text-metric">
                      {formatNumberWithCommas(Number(b.amount)).whole}
                      <span className="eb-text-base">
                        .{formatNumberWithCommas(Number(b.amount)).decimal}{' '}
                        {balanceData.currency}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="eb-text-xs eb-text-muted-foreground">
                {t('accounts:card.noBalanceData', {
                  defaultValue: 'No balance data.',
                })}
              </span>
            )}
          </div>

          {/* Right Section: Account Details */}
          {account.category !== 'LIMITED_DDA' && (
            <div className="eb-w-3/5 eb-p-4">
              <div className="eb-mb-4 eb-flex eb-items-center eb-gap-1.5">
                <span className="eb-text-sm eb-font-semibold">
                  {t('accounts:card.accountDetails', {
                    defaultValue: 'Account Details',
                  })}
                </span>
                <InfoPopover className="eb-ml-4">
                  {t('accounts:card.accountDetailsTooltip', {
                    defaultValue:
                      'Account can be funded from external sources and is externally addressable via routing/account numbers here',
                  })}
                </InfoPopover>
              </div>
              <div className="eb-flex eb-flex-col eb-gap-2">
                <div className="eb-flex eb-w-full eb-items-center eb-justify-between">
                  <span className="eb-text-xs eb-font-medium eb-text-gray-500">
                    {t('accounts:card.accountNumber', {
                      defaultValue: 'Account Number:',
                    })}
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
                          ? t('accounts:card.hideDetails', {
                              defaultValue: 'Hide account details',
                            })
                          : t('accounts:card.showDetails', {
                              defaultValue: 'Show account details',
                            })
                      }
                      aria-label={
                        showSensitiveInfo
                          ? t('accounts:card.hideDetails', {
                              defaultValue: 'Hide account details',
                            })
                          : t('accounts:card.showDetails', {
                              defaultValue: 'Show account details',
                            })
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
                      title={t('accounts:card.copyAccountNumber', {
                        defaultValue: 'Copy account number',
                      })}
                      aria-label={t('accounts:card.copyAccountNumber', {
                        defaultValue: 'Copy account number',
                      })}
                    >
                      <Copy className="eb-h-3 eb-w-3" />
                    </button>
                  </div>
                </div>
                <div className="eb-flex eb-w-full eb-items-center eb-justify-between">
                  <span className="eb-text-xs eb-font-medium eb-text-gray-500">
                    {t('accounts:card.achRouting', {
                      defaultValue: 'ACH Routing:',
                    })}
                  </span>
                  <div className="eb-flex eb-items-center">
                    <span className="eb-font-mono eb-text-sm">028000024</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText('028000024')}
                      className="eb-ml-2 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-gray-400 hover:eb-text-gray-600"
                      title={t('accounts:card.copyAchRouting', {
                        defaultValue: 'Copy ACH Routing',
                      })}
                      aria-label={t('accounts:card.copyAchRouting', {
                        defaultValue: 'Copy ACH Routing',
                      })}
                    >
                      <Copy className="eb-h-3 eb-w-3" />
                    </button>
                  </div>
                </div>
                <div className="eb-flex eb-w-full eb-items-center eb-justify-between">
                  <span className="eb-text-xs eb-font-medium eb-text-gray-500">
                    {t('accounts:card.wireRtpRouting', {
                      defaultValue: 'Wire/RTP Routing:',
                    })}
                  </span>
                  <div className="eb-flex eb-items-center">
                    <span className="eb-font-mono eb-text-sm">021000021</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText('021000021')}
                      className="eb-ml-2 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-gray-400 hover:eb-text-gray-600"
                      title={t('accounts:card.copyWireRtpRouting', {
                        defaultValue: 'Copy Wire/RTP Routing',
                      })}
                      aria-label={t('accounts:card.copyWireRtpRouting', {
                        defaultValue: 'Copy Wire/RTP Routing',
                      })}
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
