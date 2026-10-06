import { ExternalLink } from 'lucide-react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { RepoLoad } from '@/hooks/use-gh-metrics';
import { BURST_CLONES_PER_CLONER } from '@/lib/gh-metrics/derive';
import { formatDay, formatNumber, formatSpan } from '@/lib/gh-metrics/format';
import { REPO_SOURCES, type RepoId } from '@/lib/gh-metrics/sources';

const MIN_LISTED_GAP_DAYS = 3;

export function DataQuality({
  repos,
}: {
  repos: Partial<Record<RepoId, RepoLoad>>;
}) {
  return (
    <Accordion type="single" collapsible className="rounded-md border px-4">
      <AccordionItem value="data-quality" className="border-b-0">
        <AccordionTrigger className="text-base font-semibold">
          About this data
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">Repository</th>
                  <th className="py-2 pr-4 font-medium">Stored as</th>
                  <th className="py-2 pr-4 font-medium">Recorded as</th>
                  <th className="py-2 pr-4 font-medium">Period</th>
                  <th className="py-2 pr-4 font-medium">Days with data</th>
                  <th className="py-2 font-medium">
                    Gaps of {MIN_LISTED_GAP_DAYS}+ days
                  </th>
                </tr>
              </thead>
              <tbody>
                {REPO_SOURCES.map((source) => {
                  const load = repos[source.id];
                  const view = load?.status === 'ready' ? load.view : null;
                  const gaps =
                    view?.gaps.filter((g) => g.days >= MIN_LISTED_GAP_DAYS) ??
                    [];
                  return (
                    <tr key={source.id} className="border-b align-top">
                      <td className="py-2 pr-4 font-medium">
                        <a
                          href={source.metricsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          {source.label}
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        </a>
                      </td>
                      <td className="py-2 pr-4">
                        {source.kind === 'daily'
                          ? 'Count per day'
                          : '14-day totals, one snapshot a day'}
                      </td>
                      {view ? (
                        <>
                          <td className="py-2 pr-4 text-muted-foreground">
                            {view.names.map((n) => n.name).join(', ') || '—'}
                          </td>
                          <td className="py-2 pr-4 tabular-nums">
                            {formatDay(view.firstDate)} –{' '}
                            {formatDay(view.lastDate)}
                          </td>
                          <td className="py-2 pr-4 tabular-nums">
                            {formatNumber(view.collectedDays)} of{' '}
                            {formatNumber(view.spanDays)}
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {gaps.length
                              ? gaps
                                  .map(
                                    (g) =>
                                      `${formatSpan(g.from, g.to)} (${g.days})`
                                  )
                                  .join('; ')
                              : 'None'}
                          </td>
                        </>
                      ) : (
                        <td colSpan={4} className="py-2 text-destructive">
                          {load?.status === 'error' ? load.message : 'Loading…'}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              GitHub keeps traffic for 14 days only. A scheduled GitHub Action
              saves it to each repository's <code>metrics</code> branch once a
              day.
            </li>
            <li>
              embedded-finance stores a count for each day. unicorn-finance and
              ai store GitHub's 14-day totals, so their rows overlap and can't
              be added up. The 14-day total is the one figure all three share,
              which is why the comparison uses it; for embedded-finance it is
              added up from the daily counts.
            </li>
            <li>
              Days the collector missed are left blank, not shown as zero. A
              14-day total is shown only when all 14 days were collected.
            </li>
            <li>
              Unique visitors and cloners can't be added across days, so 14-day
              uniques appear only where GitHub reported them.
            </li>
            <li>
              Clones include CI pipelines and other automation. Days where each
              cloner averaged {BURST_CLONES_PER_CLONER} or more clones are
              marked as automation-heavy.
            </li>
            <li>
              Monthly totals are added up from the daily counts. The{' '}
              <code>monthly_*.csv</code> files on the metrics branch aren't
              used: they were totalled at each month end, don't always match the
              daily data, and add daily unique counts together.
            </li>
            <li>
              Referrers from JPMC internal sites and other companies' intranets
              are shown as totals only.
            </li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
