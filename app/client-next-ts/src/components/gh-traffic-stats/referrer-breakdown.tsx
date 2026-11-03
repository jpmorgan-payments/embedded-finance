import { EyeOff } from 'lucide-react';

import { formatDay, formatNumber } from '@/lib/gh-metrics/format';
import {
  CATEGORY_COLOR,
  type ReferrerSummary,
} from '@/lib/gh-metrics/referrers';

const MAX_SITES = 4;

/** What the referrer numbers cover; used as the card description. */
export function referrerBasis(summary: ReferrerSummary): string {
  return summary.basis === 'latest-window' && summary.asOf
    ? `GitHub's top referrers for the 14 days to ${formatDay(summary.asOf)}. ${summary.sitesEverSeen} sites have referred visitors since tracking began.`
    : `The referrer file has no dates, so each site shows its latest 14-day count; no history to chart. ${summary.sitesEverSeen} sites in total.`;
}

export function ReferrerBreakdown({ summary }: { summary: ReferrerSummary }) {
  if (summary.groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No referrers recorded for this repository.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2.5">
        {summary.groups.map((group) => {
          const share = summary.total ? group.count / summary.total : 0;
          return (
            <li key={group.category}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2 font-medium">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: CATEGORY_COLOR[group.category] }}
                  />
                  {group.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(group.count)}{' '}
                  <span className="text-xs">
                    ({share < 0.005 ? '<1' : Math.round(share * 100)}%)
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.max(share * 100, 1)}%`,
                    backgroundColor: CATEGORY_COLOR[group.category],
                  }}
                />
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {group.hidden ? (
                  <span className="inline-flex items-center gap-1">
                    <EyeOff className="h-3 w-3" />
                    {group.siteCount} {group.siteCount === 1 ? 'site' : 'sites'}
                    , names not shown
                  </span>
                ) : (
                  <>
                    {group.sites
                      .slice(0, MAX_SITES)
                      .map((s) => `${s.site} ${formatNumber(s.count)}`)
                      .join(' · ')}
                    {group.sites.length > MAX_SITES &&
                      ` · +${group.sites.length - MAX_SITES} more`}
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
