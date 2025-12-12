import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { useElementWidth } from '@/utils/useElementWidth';
import { AlertCircle, Landmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { trackUserEvent, useUserEventTracking } from '@/lib/utils/userTracking';
import { useGetAccounts } from '@/api/generated/ep-accounts';
import type { AccountResponse } from '@/api/generated/ep-accounts.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useInterceptorStatus } from '../EBComponentsProvider/EBComponentsProvider';
import { ACCOUNTS_USER_JOURNEYS } from './Accounts.constants';
import type { AccountsProps, AccountsRef } from './Accounts.types';
import { AccountCard } from './components/AccountCard/AccountCard';
import type { AccountCardRef } from './components/AccountCard/AccountCard';

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
    const [containerRef, containerWidth] = useElementWidth<HTMLDivElement>();

    // Determine responsive breakpoints based on container width
    const isMobile = containerWidth > 0 && containerWidth < 640;
    const isTablet = containerWidth >= 640 && containerWidth < 1024;

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

    // Show loading if query is loading or if interceptor is not ready yet
    if (isLoading || !interceptorReady) {
      return (
        <Card className="eb-component eb-w-full">
          <CardHeader>
            <CardTitle className="eb-text-xl eb-font-semibold">
              {displayTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="eb-space-y-6">
              {[...Array(2)].map((_, i) => (
                <Card
                  key={i}
                  className="eb-mb-4 eb-flex eb-flex-col eb-border eb-p-4"
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
              {displayTitle}
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
                  data-user-event={ACCOUNTS_USER_JOURNEYS.REFRESH}
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
              {displayTitle}
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
      // Adjust gap based on container width for better responsive spacing
      const gapClass = isMobile
        ? 'eb-gap-4'
        : isTablet
          ? 'eb-gap-5'
          : 'eb-gap-6';

      return (
        <Card
          id="accounts-container"
          className="eb-component eb-w-full"
          ref={containerRef}
        >
          <CardHeader>
            <CardTitle className="eb-text-xl eb-font-semibold">
              {displayTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`eb-flex eb-flex-col ${gapClass}`}>
              {filteredAccounts.map((account: AccountResponse, index) => (
                <div
                  key={account.id}
                  className="eb-w-full eb-animate-fade-in"
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
      <Card
        id="accounts-container"
        className="eb-component eb-w-full"
        ref={containerRef}
      >
        <CardHeader>
          <CardTitle className="eb-text-xl eb-font-semibold">
            {displayTitle}
          </CardTitle>
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
