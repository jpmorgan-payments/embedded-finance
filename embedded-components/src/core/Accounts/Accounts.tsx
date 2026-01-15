import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import { trackUserEvent, useUserEventTracking } from '@/lib/utils/userTracking';
import { useGetAccounts } from '@/api/generated/ep-accounts';
import type { AccountResponse } from '@/api/generated/ep-accounts.schemas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';

import { useInterceptorStatus } from '../EBComponentsProvider/EBComponentsProvider';
import { ACCOUNTS_USER_JOURNEYS } from './Accounts.constants';
import type { AccountsProps, AccountsRef } from './Accounts.types';
import { AccountCard } from './components/AccountCard/AccountCard';
import type { AccountCardRef } from './components/AccountCard/AccountCard';
import { AccountCardSkeleton } from './components/AccountCardSkeleton';

export const Accounts = forwardRef<AccountsRef, AccountsProps>(
  (
    {
      allowedCategories,
      clientId,
      title: _title,
      userEventsHandler,
      userEventsLifecycle,
    },
    ref
  ) => {
    const { t } = useTranslation(['accounts', 'common']);
    const { interceptorReady } = useInterceptorStatus();

    const { data, isLoading, isError, error, refetch } = useGetAccounts(
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

    // Determine if single account layout should be used
    const isSingleAccount = filteredAccounts.length === 1;

    // Create refs for each AccountCard
    const accountCardRefs = useRef<Record<string, AccountCardRef | null>>({});

    // Set up automatic event tracking for data-user-event attributes
    useUserEventTracking({
      containerId: 'accounts-container',
      userEventsHandler,
      userEventsLifecycle,
    });

    // Track view when accounts load
    useEffect(() => {
      if (filteredAccounts.length > 0) {
        trackUserEvent({
          actionName: ACCOUNTS_USER_JOURNEYS.VIEW_ACCOUNTS,
          metadata: { count: filteredAccounts.length },
          userEventsHandler,
        });
      }
    }, [filteredAccounts.length, userEventsHandler]);

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
          trackUserEvent({
            actionName: ACCOUNTS_USER_JOURNEYS.REFRESH,
            userEventsHandler,
          });
        },
      }),
      [refetch, userEventsHandler]
    );

    return (
      <div id="accounts-container" className="eb-w-full eb-@container">
        <Card className={cn('eb-component eb-w-full eb-overflow-hidden')}>
          <CardHeader className="eb-border-b eb-bg-muted/30 eb-px-2.5 eb-py-2 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-px-3 @md:eb-py-2.5 @lg:eb-px-4 @lg:eb-py-3">
            <div className="eb-flex eb-items-center eb-justify-between">
              <CardTitle className="eb-truncate eb-font-header eb-text-lg eb-font-semibold eb-leading-normal @md:eb-text-xl">
                {t('accounts:titleSingle', {
                  defaultValue: 'Your account',
                })}
                {!isLoading && !isError && filteredAccounts.length > 1 && (
                  <span className="eb-animate-fade-in">
                    {`s (${filteredAccounts.length})`}
                  </span>
                )}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent
            className={cn(
              'eb-space-y-4 eb-transition-all eb-duration-300 eb-ease-in-out',
              isSingleAccount ? 'eb-p-0' : 'eb-p-2.5 @md:eb-p-3 @lg:eb-p-4'
            )}
          >
            {/* Loading state with skeleton */}
            {(isLoading || !interceptorReady) && (
              <div className="eb-grid eb-grid-cols-1 eb-gap-3">
                <AccountCardSkeleton />
              </div>
            )}

            {/* Error state */}
            {isError && (
              <ServerErrorAlert
                customTitle={t('accounts:error.title', {
                  defaultValue: 'Unable to load accounts',
                })}
                customErrorMessage={{
                  default: t('accounts:error.loadFailed', {
                    defaultValue: 'Failed to load accounts. Please try again.',
                  }),
                  400: t('accounts:error.badRequest', {
                    defaultValue:
                      'Invalid request. Please check your parameters.',
                  }),
                }}
                error={error as any}
                tryAgainAction={refetch}
                showDetails
              />
            )}

            {/* Empty state */}
            {!isLoading &&
              !isError &&
              interceptorReady &&
              filteredAccounts.length === 0 && (
                <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-space-y-2 eb-py-6 eb-text-center">
                  <div className="eb-rounded-full eb-bg-muted eb-p-3">
                    <Landmark className="eb-h-6 eb-w-6 eb-text-muted-foreground" />
                  </div>
                  <div className="eb-space-y-1">
                    <h3 className="eb-text-sm eb-font-semibold eb-text-foreground">
                      {t('accounts:emptyState.title', {
                        defaultValue: 'No accounts found',
                      })}
                    </h3>
                    <p className="eb-max-w-xs eb-text-xs eb-text-muted-foreground">
                      {t('accounts:emptyState.description', {
                        defaultValue:
                          "You don't have any accounts yet. Contact support if you need assistance.",
                      })}
                    </p>
                  </div>
                </div>
              )}

            {/* Accounts list */}
            {!isLoading &&
              !isError &&
              interceptorReady &&
              filteredAccounts.length > 0 && (
                <div
                  className={cn('eb-grid eb-grid-cols-1 eb-items-start', {
                    'eb-gap-3': !isSingleAccount,
                    '@4xl:eb-grid-cols-2': filteredAccounts.length > 1,
                  })}
                >
                  {filteredAccounts.map(
                    (account: AccountResponse, index: number) => (
                      <div
                        key={account.id}
                        className="eb-animate-fade-in"
                        style={{
                          animationDelay: `${index * 50}ms`,
                          animationFillMode: 'backwards',
                        }}
                      >
                        <AccountCard
                          account={account}
                          hideBorder={isSingleAccount}
                          ref={(cardRef) => {
                            accountCardRefs.current[account.id] = cardRef;
                          }}
                        />
                      </div>
                    )
                  )}
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    );
  }
);

// Add display name for better debugging
Accounts.displayName = 'Accounts';
