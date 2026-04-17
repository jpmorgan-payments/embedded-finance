import { useEffect, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertCircle, ChevronDown, XCircleIcon } from 'lucide-react';

import { useLocale } from '@/lib/hooks/useLocale';
import { getRecipientDisplayName } from '@/lib/recipientHelpers';
import { cn } from '@/lib/utils';
import {
  getAllRecipients,
  useGetAllRecipients,
} from '@/api/generated/ep-recipients';
import type {
  GetAllRecipientsParams,
  Recipient,
  RecipientType,
} from '@/api/generated/ep-recipients.schemas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useInterceptorStatus } from '@/core/EBComponentsProvider/EBComponentsProvider';
import { RecipientDetailsDialog } from '@/core/RecipientWidgets/components/RecipientDetailsDialog/RecipientDetailsDialog';

const REJECTED_PAGE_LIMIT = 25;

export interface RejectedAccountsAccordionProps {
  /** Which recipient type to query for rejected accounts. */
  recipientType: RecipientType;
  /** Additional query params (e.g. clientId) merged into the API call. */
  queryParams?: Partial<GetAllRecipientsParams>;
}

/**
 * Self-contained accordion that fetches and displays recently rejected
 * accounts (last 30 days) for a given recipient type.
 *
 * Extracted from BaseRecipientsWidget so it can be reused in places like
 * the OnboardingFlow OverviewScreen without pulling in the full widget.
 */
export const RejectedAccountsAccordion: React.FC<
  RejectedAccountsAccordionProps
> = ({ recipientType, queryParams }) => {
  const { t, tString } = useTranslationWithTokens('linked-accounts');
  const locale = useLocale();
  const { interceptorReady } = useInterceptorStatus();

  const [collapsed, setCollapsed] = useState(true);

  // Fetch first page of rejected accounts
  const { data: rejectedData } = useGetAllRecipients(
    {
      type: recipientType,
      status: 'REJECTED',
      limit: REJECTED_PAGE_LIMIT,
      page: 0,
      ...queryParams,
    } as GetAllRecipientsParams & { status: string },
    {
      query: {
        enabled: interceptorReady,
      },
    }
  );

  // Fetch additional pages beyond the first 25
  const [additionalRejected, setAdditionalRejected] = useState<Recipient[]>([]);

  useEffect(() => {
    if (
      !rejectedData?.total_items ||
      rejectedData.total_items <= REJECTED_PAGE_LIMIT
    ) {
      setAdditionalRejected([]);
      return () => {};
    }

    const totalPages = Math.ceil(
      rejectedData.total_items / REJECTED_PAGE_LIMIT
    );
    let cancelled = false;

    (async () => {
      const extra: Recipient[] = [];
      for (let page = 1; page < totalPages; page += 1) {
        if (cancelled) return;
        try {
          const response = await getAllRecipients({
            type: recipientType,
            status: 'REJECTED',
            limit: REJECTED_PAGE_LIMIT,
            page,
            ...queryParams,
          } as GetAllRecipientsParams & { status: string });
          if (response?.recipients) {
            extra.push(...response.recipients);
          }
        } catch {
          break;
        }
      }
      if (!cancelled) {
        setAdditionalRejected(extra);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rejectedData?.total_items, recipientType, queryParams]);

  // Filter to last 30 days, sort most-recent-first
  const recentRejected = useMemo(() => {
    if (!rejectedData?.recipients) return [];
    const all = [...rejectedData.recipients, ...additionalRejected];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return all
      .filter((r) => {
        const date = r.updatedAt ? new Date(r.updatedAt) : null;
        return date && date >= thirtyDaysAgo;
      })
      .sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      });
  }, [rejectedData, additionalRejected]);

  if (recentRejected.length === 0) return null;

  return (
    <div
      className="eb-overflow-hidden eb-rounded-md eb-border eb-border-destructive/20 eb-bg-destructive/5"
      role="region"
      aria-label={tString('rejectedAccounts.sectionTitle', {
        defaultValue: 'Recently Rejected Accounts',
      })}
    >
      {/* Disclosure toggle */}
      <button
        type="button"
        className="eb-group eb-flex eb-w-full eb-cursor-pointer eb-items-center eb-gap-2.5 eb-px-4 eb-py-3 eb-text-left eb-transition-colors hover:eb-bg-destructive/10 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring focus-visible:eb-ring-offset-1"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
      >
        <XCircleIcon className="eb-h-4 eb-w-4 eb-shrink-0 eb-text-destructive" />
        <div className="eb-min-w-0 eb-flex-1">
          <div className="eb-flex eb-items-center eb-gap-1.5">
            <span className="eb-text-xs eb-font-semibold eb-text-destructive">
              {t('rejectedAccounts.sectionTitle', {
                defaultValue: 'Recently Rejected Accounts',
              })}
            </span>
            <Badge
              variant="destructive"
              className="eb-px-1.5 eb-py-0 eb-text-[0.65rem] eb-leading-4"
            >
              {recentRejected.length}
            </Badge>
          </div>
          {/* Collapsed inline summary — most recent rejection */}
          {collapsed && (
            <p className="eb-mt-0.5 eb-truncate eb-text-[0.7rem] eb-text-muted-foreground">
              {t('rejectedAccounts.collapsedSummary', {
                defaultValue: 'Most recent: {{name}} — {{date}}',
                name: getRecipientDisplayName(recentRejected[0]),
                date: recentRejected[0].updatedAt
                  ? new Date(recentRejected[0].updatedAt).toLocaleDateString(
                      locale,
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }
                    )
                  : '',
              })}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            'eb-h-4 eb-w-4 eb-shrink-0 eb-text-destructive/60 eb-transition-transform eb-duration-200',
            !collapsed && 'eb-rotate-180'
          )}
        />
      </button>

      {/* Expanded content */}
      {!collapsed && (
        <div className="eb-animate-fade-in">
          <Separator className="eb-bg-destructive/15" />
          <p className="eb-px-4 eb-py-2 eb-text-[0.7rem] eb-text-muted-foreground">
            {t('rejectedAccounts.sectionDescription', {
              defaultValue:
                'The following account(s) were rejected in the last 30 days.',
            })}
          </p>
          <ul className="eb-divide-y eb-divide-destructive/10">
            {recentRejected.map((rejected) => {
              const name = getRecipientDisplayName(rejected);
              const rejectedDate = rejected.updatedAt
                ? new Date(rejected.updatedAt).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : null;

              return (
                <li key={rejected.id} className="eb-px-4 eb-py-2.5">
                  <div className="eb-flex eb-items-start eb-justify-between eb-gap-3">
                    <div className="eb-min-w-0">
                      <p className="eb-truncate eb-text-sm eb-font-medium">
                        {name}
                      </p>
                    </div>
                    <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-2">
                      {rejectedDate && (
                        <span className="eb-text-xs eb-text-muted-foreground">
                          {rejectedDate}
                        </span>
                      )}
                      <Badge variant="destructive" className="eb-text-xs">
                        {t('status.labels.REJECTED', {
                          defaultValue: 'Rejected',
                        })}
                      </Badge>
                    </div>
                  </div>
                  <p className="eb-mt-1.5 eb-flex eb-items-start eb-gap-1.5 eb-text-xs eb-text-destructive">
                    <AlertCircle className="eb-mt-0.5 eb-h-3 eb-w-3 eb-shrink-0" />
                    <span>
                      {t('rejectedAccounts.rejectionMessage', {
                        defaultValue:
                          'There was an issue linking this account. Please check the account details or contact support.',
                      })}
                    </span>
                  </p>
                  <div className="eb-mt-2">
                    <RecipientDetailsDialog recipient={rejected}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="eb-h-7 eb-text-xs"
                      >
                        {t('rejectedAccounts.viewDetails', {
                          defaultValue: 'View account details',
                        })}
                      </Button>
                    </RecipientDetailsDialog>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
