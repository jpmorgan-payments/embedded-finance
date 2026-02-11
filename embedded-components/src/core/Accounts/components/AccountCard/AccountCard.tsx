import { forwardRef, useImperativeHandle, useState } from 'react';
import {
  CheckCircle2Icon,
  ClockIcon,
  Copy,
  CopyCheckIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  LandmarkIcon,
  XCircleIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { useGetAccountBalance } from '@/api/generated/ep-accounts';
import type { AccountResponse } from '@/api/generated/ep-accounts.schemas';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui';

import { formatNumberWithCommas, getAccountStatusVariant } from '../../utils';

/**
 * Ref interface for AccountCard external actions
 */
export interface AccountCardRef {
  refreshBalance: () => void;
}

interface AccountCardProps {
  account: AccountResponse;
  /** Use compact display mode with reduced padding and smaller elements */
  compact?: boolean;
  /** Hide the card border (used when AccountCard is the only item in parent container) */
  hideBorder?: boolean;
  /** Additional CSS classes to apply to the card */
  className?: string;
}

/**
 * Gets status icon for account state
 */
const getStatusIcon = (state?: string) => {
  const iconClass = 'eb-h-3.5 eb-w-3.5';
  switch (state) {
    case 'OPEN':
      return <CheckCircle2Icon className={iconClass} aria-hidden="true" />;
    case 'CLOSED':
      return <XCircleIcon className={iconClass} aria-hidden="true" />;
    case 'PENDING_CLOSE':
      return <ClockIcon className={iconClass} aria-hidden="true" />;
    default:
      return null;
  }
};

/**
 * Get the appropriate subheader icon component based on account category
 * Using LandmarkIcon (bank) consistently for all account types
 */
const getCategoryIcon = (_category?: string) => {
  const iconClass = 'eb-h-3.5 eb-w-3.5';
  // Use consistent bank icon for all account categories
  return <LandmarkIcon className={iconClass} aria-hidden="true" />;
};

export const AccountCard = forwardRef<AccountCardRef, AccountCardProps>(
  ({ account, compact = false, hideBorder = false, className }, ref) => {
    const { t } = useTranslation(['accounts', 'common']);
    const locale = useLocale();
    const naText = t('common:na', { defaultValue: 'N/A' });
    const {
      data: balanceData,
      isLoading: isBalanceLoading,
      refetch,
    } = useGetAccountBalance(account.id);

    const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

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

    const handleCopy = async (value: string, fieldName: string) => {
      await navigator.clipboard.writeText(value);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    };

    // Get translated category label
    const categoryLabel = t(`accounts:categories.${account.category}`, {
      defaultValue: account.category?.replace(/_/g, ' ') || account.category,
    });

    // Get last 4 digits of account number for display name (following BaseRecipientWidget pattern)
    const lastFourDigits =
      account.paymentRoutingInformation?.accountNumber?.slice(-4) || '';
    const displayName = lastFourDigits
      ? `${categoryLabel} (...${lastFourDigits})`
      : categoryLabel;

    // Mask account number: show last 4 digits with asterisks
    const maskedAccountNumber = account.paymentRoutingInformation?.accountNumber
      ? `****${account.paymentRoutingInformation.accountNumber.slice(-4)}`
      : naText;

    const fullAccountNumber =
      account.paymentRoutingInformation?.accountNumber || naText;

    // Get routing number from API data (ABA type is used for ACH routing)
    const abaRoutingNumber =
      account.paymentRoutingInformation?.routingInformation?.find(
        (r) => r.type === 'ABA'
      )?.value || null;

    // Determine status styling
    const isOpen = account.state === 'OPEN';
    const isPendingClose = account.state === 'PENDING_CLOSE';
    const isClosed = account.state === 'CLOSED';
    const isPaymentsAccount = account.category === 'LIMITED_DDA_PAYMENTS';

    // Render copy button with feedback
    const CopyButton = ({
      value,
      fieldName,
      label,
    }: {
      value: string;
      fieldName: string;
      label: string;
    }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleCopy(value, fieldName)}
        className="eb-h-auto eb-p-1 eb-text-muted-foreground hover:eb-text-foreground"
        title={label}
        aria-label={label}
      >
        {copiedField === fieldName ? (
          <CopyCheckIcon className="eb-h-3.5 eb-w-3.5 eb-text-green-600" />
        ) : (
          <Copy className="eb-h-3.5 eb-w-3.5" />
        )}
      </Button>
    );

    if (compact) {
      return (
        <Card
          className={cn(
            'eb-rounded-none eb-border-x-0 eb-border-t-0 eb-shadow-none eb-transition-colors',
            {
              'eb-bg-muted/30 hover:eb-bg-muted/50': isClosed,
              'eb-border-l-4 eb-border-l-amber-500 eb-bg-amber-50/30 hover:eb-bg-amber-50/60':
                isPendingClose,
              'hover:eb-bg-accent/50': isOpen && !isPendingClose,
            },
            className
          )}
          role="article"
          aria-label={`Account: ${displayName}`}
        >
          <CardContent className="eb-flex eb-items-center eb-gap-3 eb-p-3 @sm:eb-px-4 @md:eb-px-5">
            {/* Main icon - consistent LandmarkIcon for all accounts */}
            <div
              className={cn(
                'eb-relative eb-flex eb-h-10 eb-w-10 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-transition-colors',
                {
                  'eb-bg-amber-200/80': isPendingClose,
                  'eb-bg-slate-200/80': isClosed,
                  'eb-bg-primary/10': isOpen && !isPendingClose,
                }
              )}
            >
              <LandmarkIcon
                className={cn('eb-h-5 eb-w-5', {
                  'eb-text-amber-700': isPendingClose,
                  'eb-text-slate-500': isClosed,
                  'eb-text-primary': isOpen && !isPendingClose,
                })}
                aria-hidden="true"
              />
            </div>

            {/* Account details */}
            <div className="eb-min-w-0 eb-flex-1 eb-overflow-hidden">
              <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2">
                <h3
                  className="eb-max-w-full eb-break-words eb-text-sm eb-font-semibold eb-leading-tight"
                  style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                >
                  {displayName}
                </h3>
                {/* Status badge - always show */}
                {account.state && (
                  <Badge
                    variant={
                      getAccountStatusVariant(
                        account.state
                      ) as BadgeProps['variant']
                    }
                    className="eb-inline-flex eb-shrink-0 eb-items-center eb-gap-1 eb-text-xs"
                  >
                    {getStatusIcon(account.state)}
                    {t(`accounts:status.labels.${account.state}`, {
                      defaultValue: account.state.replace(/_/g, ' '),
                    })}
                  </Badge>
                )}
              </div>
              {/* Account number row */}
              <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-x-2 eb-gap-y-0.5 eb-pt-1">
                <span className="eb-shrink-0 eb-text-[10px] eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                  {t('accounts:card.accountNumber', {
                    defaultValue: 'Account Number',
                  })}
                </span>
                <span className="eb-flex eb-items-center eb-gap-1">
                  <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide eb-text-foreground">
                    {showSensitiveInfo
                      ? fullAccountNumber
                      : maskedAccountNumber}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={toggleSensitiveInfo}
                    className="eb-h-auto eb-shrink-0 eb-p-0"
                    aria-label={
                      showSensitiveInfo
                        ? t('accounts:card.hideDetails')
                        : t('accounts:card.showDetails')
                    }
                    aria-pressed={showSensitiveInfo}
                  >
                    {showSensitiveInfo ? (
                      <EyeOffIcon
                        className="eb-h-3 eb-w-3"
                        aria-hidden="true"
                      />
                    ) : (
                      <EyeIcon className="eb-h-3 eb-w-3" aria-hidden="true" />
                    )}
                  </Button>
                </span>
              </div>
            </div>

            {/* Balance */}
            <div className="eb-flex eb-shrink-0 eb-flex-col eb-items-end">
              {isBalanceLoading ? (
                <Skeleton className="eb-h-6 eb-w-24" />
              ) : balanceData?.balanceTypes?.[0] ? (
                <span className="eb-font-mono eb-text-lg eb-font-bold eb-text-metric eb-duration-300 eb-animate-in eb-fade-in">
                  {
                    formatNumberWithCommas(
                      Number(balanceData.balanceTypes[0].amount),
                      locale
                    ).whole
                  }
                  <span className="eb-text-sm">
                    .
                    {
                      formatNumberWithCommas(
                        Number(balanceData.balanceTypes[0].amount),
                        locale
                      ).decimal
                    }{' '}
                    {balanceData.currency}
                  </span>
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      );
    }

    // NORMAL MODE - Full card layout
    return (
      <Card
        className={cn(
          'eb-overflow-hidden eb-transition-all',
          {
            'eb-border-red-200 eb-bg-red-50/30 hover:eb-shadow-lg hover:eb-shadow-red-100':
              isClosed && !hideBorder,
            'eb-bg-red-50/30': isClosed && hideBorder,
            'eb-border-amber-200 eb-bg-amber-50/20 hover:eb-shadow-lg hover:eb-shadow-amber-100':
              isPendingClose && !hideBorder,
            'eb-bg-amber-50/20': isPendingClose && hideBorder,
            'hover:eb-shadow-md': isOpen && !isPendingClose && !hideBorder,
            'eb-border-0 eb-shadow-none': hideBorder,
          },
          className
        )}
        role="article"
        aria-label={`Account: ${displayName}`}
      >
        <CardContent className="eb-flex eb-flex-col eb-p-0">
          {/* Header Section */}
          <div className="eb-space-y-3 eb-p-3 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-4">
            {/* Name, Type, and Status */}
            <div className="eb-flex eb-items-start eb-justify-between eb-gap-3">
              <div className="eb-min-w-0 eb-flex-1 eb-space-y-1.5">
                <h3
                  className="eb-break-words eb-text-base eb-font-semibold eb-leading-tight @md:eb-text-lg"
                  style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}
                >
                  {displayName}
                </h3>
                {/* Category subheader with icon - varies by category */}
                <div className="eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-text-muted-foreground">
                  {getCategoryIcon(account.category)}
                  <span>{categoryLabel}</span>
                </div>
              </div>
              {/* Status badge - always show */}
              {account.state && (
                <div className="eb-shrink-0 eb-self-start">
                  <Badge
                    variant={
                      getAccountStatusVariant(
                        account.state
                      ) as BadgeProps['variant']
                    }
                    className="eb-inline-flex eb-items-center eb-gap-1 eb-text-xs"
                  >
                    {getStatusIcon(account.state)}
                    {t(`accounts:status.labels.${account.state}`, {
                      defaultValue: account.state.replace(/_/g, ' '),
                    })}
                  </Badge>
                </div>
              )}
            </div>

            {/* Account Number with Toggle */}
            <div className="eb-space-y-1.5">
              <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2">
                <span className="eb-shrink-0 eb-text-[10px] eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                  {t('accounts:card.accountNumber', {
                    defaultValue: 'Account Number',
                  })}
                </span>
                <span className="eb-flex eb-items-center eb-gap-1">
                  <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide eb-text-foreground">
                    {showSensitiveInfo
                      ? fullAccountNumber
                      : maskedAccountNumber}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={toggleSensitiveInfo}
                    className="eb-h-auto eb-shrink-0 eb-p-0"
                    aria-label={
                      showSensitiveInfo
                        ? t('accounts:card.hideDetails')
                        : t('accounts:card.showDetails')
                    }
                    aria-pressed={showSensitiveInfo}
                  >
                    {showSensitiveInfo ? (
                      <EyeOffIcon
                        className="eb-h-3 eb-w-3"
                        aria-hidden="true"
                      />
                    ) : (
                      <EyeIcon className="eb-h-3 eb-w-3" aria-hidden="true" />
                    )}
                  </Button>
                  <CopyButton
                    value={fullAccountNumber}
                    fieldName="accountNumber"
                    label={t('accounts:card.copyAccountNumber', {
                      defaultValue: 'Copy account number',
                    })}
                  />
                </span>
              </div>

              {/* ACH Routing Number (from ABA routing type) - only for payments accounts */}
              {isPaymentsAccount && abaRoutingNumber && (
                <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2">
                  <span className="eb-shrink-0 eb-text-[10px] eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                    {t('accounts:card.achRouting', {
                      defaultValue: 'ACH Routing Number',
                    })}
                  </span>
                  <span className="eb-flex eb-items-center eb-gap-1">
                    <span className="eb-font-mono eb-text-sm eb-font-medium eb-tracking-wide eb-text-foreground">
                      {abaRoutingNumber}
                    </span>
                    <CopyButton
                      value={abaRoutingNumber}
                      fieldName="achRouting"
                      label={t('accounts:card.copyAchRouting', {
                        defaultValue: 'Copy ACH routing number',
                      })}
                    />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Balance Section */}
          <div className="eb-border-t eb-bg-muted/20 eb-p-3 @md:eb-p-4">
            {isBalanceLoading ? (
              <div className="eb-flex eb-flex-wrap eb-gap-6">
                <div className="eb-space-y-1">
                  <Skeleton className="eb-h-3 eb-w-20" />
                  <Skeleton className="eb-h-7 eb-w-28" />
                </div>
                <div className="eb-space-y-1">
                  <Skeleton className="eb-h-3 eb-w-16" />
                  <Skeleton className="eb-h-7 eb-w-28" />
                </div>
              </div>
            ) : balanceData?.balanceTypes?.length ? (
              <div className="eb-space-y-3 eb-duration-300 eb-animate-in eb-fade-in">
                <div className="eb-flex eb-flex-wrap eb-gap-6">
                  {balanceData.balanceTypes.map((b) => (
                    <div
                      key={b.typeCode}
                      className="eb-flex eb-min-w-0 eb-flex-col eb-items-start"
                    >
                      <div className="eb-flex eb-items-center eb-gap-1">
                        <span className="eb-text-[10px] eb-font-medium eb-uppercase eb-tracking-wider eb-text-muted-foreground">
                          {t(`accounts:balanceTypes.${b.typeCode}`, {
                            defaultValue:
                              b.typeCode === 'ITAV'
                                ? 'Available Balance'
                                : 'Current Balance',
                          })}
                        </span>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="eb-h-6 eb-w-6 eb-shrink-0 eb-text-muted-foreground hover:eb-text-foreground"
                              aria-label={t(
                                'accounts:card.balanceTypeInfoAriaLabel',
                                {
                                  type: t(
                                    `accounts:balanceTypes.${b.typeCode}`,
                                    {
                                      defaultValue:
                                        b.typeCode === 'ITAV'
                                          ? 'Available Balance'
                                          : 'Current Balance',
                                    }
                                  ),
                                }
                              )}
                            >
                              <InfoIcon
                                className="eb-h-3.5 eb-w-3.5"
                                aria-hidden="true"
                              />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            side="top"
                            align="start"
                            className="eb-w-72"
                          >
                            <div className="eb-space-y-1.5">
                              <h4 className="eb-text-sm eb-font-semibold">
                                {t(`accounts:balanceTypes.${b.typeCode}`, {
                                  defaultValue:
                                    b.typeCode === 'ITAV'
                                      ? 'Available Balance'
                                      : 'Current Balance',
                                })}
                              </h4>
                              <p className="eb-text-xs eb-text-muted-foreground">
                                {t(
                                  `accounts:balanceTypes.${b.typeCode}_description`,
                                  {
                                    defaultValue:
                                      b.typeCode === 'ITAV'
                                        ? 'Funds you can use now, including pending credits and minus holds.'
                                        : 'Balance from settled transactions; may not reflect pending activity.',
                                  }
                                )}
                              </p>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <span className="eb-font-mono eb-break-words eb-text-xl eb-font-bold eb-leading-tight eb-text-metric @md:eb-text-2xl">
                        {formatNumberWithCommas(Number(b.amount), locale).whole}
                        <span className="eb-text-sm @md:eb-text-base">
                          .
                          {
                            formatNumberWithCommas(Number(b.amount), locale)
                              .decimal
                          }{' '}
                          {balanceData.currency}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
                {balanceData.date && (
                  <p className="eb-text-xs eb-text-muted-foreground">
                    {t('accounts:card.dataAsOf', {
                      date: new Date(
                        `${balanceData.date}T00:00:00`
                      ).toLocaleDateString(locale, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }),
                    })}
                  </p>
                )}
              </div>
            ) : (
              <span className="eb-text-xs eb-text-muted-foreground">
                {t('accounts:card.noBalanceData', {
                  defaultValue: 'Balance information unavailable',
                })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

// Add display name for AccountCard
AccountCard.displayName = 'AccountCard';
