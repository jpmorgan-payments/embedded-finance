import { EyeOff } from 'lucide-react';

import { formatDay, formatNumber } from '@/lib/gh-metrics/format';
import type { ReferrerSummary } from '@/lib/gh-metrics/referrers';

const MAX_SITES = 4;

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
      <p className="text-xs text-muted-foreground">
        {summary.basis === 'latest-window' && summary.asOf
          ? `GitHub's top referrers for the 14 days to ${formatDay(summary.asOf)}. ${summary.sitesEverSeen} sites have referred visitors since tracking began.`
          : `This repository's referrer file has no dates, so each site shows its count from the most recent 14 days it appeared in. ${summary.sitesEverSeen} sites in total.`}
      </p>
      <ul className="space-y-3">
        {summary.groups.map((group) => {
          const share = summary.total ? group.count / summary.total : 0;
          return (
            <li key={group.category}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{group.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(group.count)}{' '}
                  <span className="text-xs">
                    ({share < 0.005 ? '<1' : Math.round(share * 100)}%)
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{ width: `${Math.max(share * 100, 1)}%` }}
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
