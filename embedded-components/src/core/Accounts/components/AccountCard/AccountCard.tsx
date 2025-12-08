import { forwardRef, useImperativeHandle, useState } from 'react';
import { Copy, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useLocale } from '@/lib/hooks';
import { useGetAccountBalance } from '@/api/generated/ep-accounts';
import type { AccountResponse } from '@/api/generated/ep-accounts.schemas';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoPopover } from '@/components/LearnMorePopover/InfoPopover';

import {
  formatNumberWithCommas,
  getAccountStatusIcon,
  getAccountStatusVariant,
} from '../../utils';

/**
 * Ref interface for AccountCard external actions
 */
export interface AccountCardRef {
  refreshBalance: () => void;
}

interface AccountCardProps {
  account: AccountResponse;
}

export const AccountCard = forwardRef<AccountCardRef, AccountCardProps>(
  ({ account }, ref) => {
    const { t } = useTranslation(['accounts', 'common']);
    const locale = useLocale();
    const naText = t('common:na', { defaultValue: 'N/A' });
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

    const formattedCategory = t(`accounts:categories.${account.category}`, {
      defaultValue:
        account.category === 'LIMITED_DDA_PAYMENTS'
          ? 'Payments DDA'
          : account.category === 'LIMITED_DDA'
            ? 'Limited DDA'
            : account.category,
    });

    // Mask account number: show last 4 digits with 4 asterisks (aligned with LinkedAccountWidget pattern)
    const maskedAccountNumber = account.paymentRoutingInformation?.accountNumber
      ? `****${account.paymentRoutingInformation.accountNumber.slice(-4)}`
      : naText;

    return (
      <Card className="eb-mb-4 eb-flex eb-w-full eb-flex-col eb-border eb-p-4 lg:eb-max-w-5xl">
        {/* Title Section with Status Badge */}
        <div className="eb-mb-4 eb-flex eb-flex-wrap eb-items-center eb-gap-3 eb-pl-4">
          <div className="eb-break-words eb-text-lg eb-font-semibold md:eb-text-xl">
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
            account.category === 'LIMITED_DDA'
              ? 'eb-flex-col'
              : 'eb-flex-col md:eb-flex-row'
          }`}
        >
          {/* Left Section: Balances */}
          <div
            className={`eb-min-w-0 eb-shrink eb-p-4 ${
              account.category === 'LIMITED_DDA'
                ? 'eb-w-full'
                : 'eb-w-full md:eb-flex-1'
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
                    className="eb-flex eb-w-full eb-min-w-0 eb-flex-col eb-items-start"
                  >
                    <span className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                      {t(`accounts:balanceTypes.${b.typeCode}`, {
                        defaultValue:
                          b.typeCode === 'ITAV'
                            ? 'Available Balance'
                            : b.typeCode === 'ITBD'
                              ? 'Current Balance'
                              : b.typeCode,
                      })}
                    </span>
                    <span className="eb-font-mono eb-break-words eb-text-2xl eb-font-bold eb-leading-tight eb-text-metric">
                      {formatNumberWithCommas(Number(b.amount), locale).whole}
                      <span className="eb-text-base">
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
            <div className="eb-w-full eb-min-w-0 eb-p-4 md:eb-flex-1">
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
                  <span className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                    {t('accounts:card.accountNumber', {
                      defaultValue: 'Account Number:',
                    })}
                  </span>
                  <div className="eb-flex eb-items-center">
                    <span className="eb-font-mono eb-text-sm">
                      {showSensitiveInfo
                        ? account.paymentRoutingInformation?.accountNumber ||
                          naText
                        : maskedAccountNumber}
                    </span>
                    <button
                      type="button"
                      onClick={toggleSensitiveInfo}
                      className="eb-ml-2 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-muted-foreground hover:eb-text-foreground"
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
                      className="eb-ml-2 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-muted-foreground hover:eb-text-foreground"
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
                  <span className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                    {t('accounts:card.achRouting', {
                      defaultValue: 'ACH Routing:',
                    })}
                  </span>
                  <div className="eb-flex eb-items-center">
                    <span className="eb-font-mono eb-text-sm">028000024</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText('028000024')}
                      className="eb-ml-2 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-muted-foreground hover:eb-text-foreground"
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
                  <span className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                    {t('accounts:card.wireRtpRouting', {
                      defaultValue: 'Wire/RTP Routing:',
                    })}
                  </span>
                  <div className="eb-flex eb-items-center">
                    <span className="eb-font-mono eb-text-sm">021000021</span>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText('021000021')}
                      className="eb-ml-2 eb-inline-flex eb-cursor-pointer eb-items-center eb-text-muted-foreground hover:eb-text-foreground"
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
