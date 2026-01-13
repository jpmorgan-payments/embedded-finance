import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { Landmark, PlusCircleIcon } from 'lucide-react';
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
      title,
      userEventsHandler,
      userEventsLifecycle,
    },
    ref
  ) => {
    const { t } = useTranslation(['accounts', 'common']);
    // Use translated title if not provided, otherwise use the provided title
    const displayTitle =
      title || t('accounts:title', { defaultValue: 'Accounts' });
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
          <CardHeader className="eb-border-b eb-bg-muted/30 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
            <div className="eb-flex eb-flex-col eb-gap-2 @xs:eb-flex-row @xs:eb-items-center @xs:eb-justify-between @xs:eb-gap-4">
              <div className="eb-min-w-0 eb-flex-1">
                <div className="eb-flex eb-items-center eb-gap-2">
                  <CardTitle className="eb-h-8 eb-truncate eb-font-header eb-text-lg eb-font-semibold eb-leading-8 @md:eb-text-xl">
                    {displayTitle}{' '}
                    {!isLoading && !isError && (
                      <span className="eb-animate-fade-in">
                        {`(${filteredAccounts.length})`}
                      </span>
                    )}
                  </CardTitle>
                </div>
                <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                  {t('accounts:description', {
                    defaultValue: 'View and manage your account balances',
                  })}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="eb-space-y-4 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
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
                <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-space-y-3 eb-py-12 eb-text-center">
                  <div className="eb-relative">
                    <div className="eb-rounded-full eb-bg-muted eb-p-4">
                      <Landmark className="eb-h-8 eb-w-8 eb-text-muted-foreground" />
                    </div>
                    <div className="eb-absolute -eb-bottom-1 -eb-right-1 eb-rounded-full eb-bg-background eb-p-0.5">
                      <PlusCircleIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                    </div>
                  </div>
                  <div className="eb-mb-2 eb-space-y-1">
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
              )}

            {/* Accounts list */}
            {!isLoading &&
              !isError &&
              interceptorReady &&
              filteredAccounts.length > 0 && (
                <div
                  className={cn('eb-grid eb-grid-cols-1 eb-items-start', {
                    'eb-gap-3': true,
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
