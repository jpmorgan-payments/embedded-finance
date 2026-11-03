import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface WeekTableColumn {
  key: string;
  label: string;
  title?: string;
  align?: 'left' | 'right';
}

export interface WeekTableRow {
  id: string;
  label: ReactNode;
  /** Drives the inline bar next to the primary value. */
  bar: number | null;
  /** Renders lighter: a week still in progress or not fully collected. */
  muted?: boolean;
  cells: Record<string, ReactNode>;
}

interface WeekTableProps {
  caption: string;
  columns: WeekTableColumn[];
  rows: WeekTableRow[];
  color: string;
  /** Always render this many rows so the card height never changes. */
  rowCount?: number;
}

/** A compact, scannable week-by-week table with an inline bar on the first value column. */
export function WeekTable({
  caption,
  columns,
  rows,
  color,
  rowCount = 8,
}: WeekTableProps) {
  const max = Math.max(1, ...rows.map((r) => r.bar ?? 0));
  const padded = [
    ...rows.slice(0, rowCount),
    ...Array.from({ length: Math.max(0, rowCount - rows.length) }, () => null),
  ];
  const [first, ...rest] = columns;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-medium">
              Week
            </th>
            {[first, ...rest].map((c) => (
              <th
                key={c.key}
                scope="col"
                title={c.title}
                className={cn(
                  'py-2 pl-3 font-medium',
                  c.align !== 'left' && 'text-right'
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {padded.map((row, i) =>
            row ? (
              <tr
                key={row.id}
                className={cn(
                  'h-9 border-b last:border-b-0',
                  row.muted && 'text-muted-foreground'
                )}
              >
                <th
                  scope="row"
                  className="whitespace-nowrap py-1.5 pr-3 text-left font-normal"
                >
                  {row.label}
                </th>
                <td className="py-1.5 pl-3">
                  <div className="flex items-center justify-end gap-2">
                    <div className="hidden h-2 w-24 overflow-hidden rounded-full bg-muted sm:block">
                      {row.bar !== null && (
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max((row.bar / max) * 100, 2)}%`,
                            backgroundColor: color,
                            opacity: row.muted ? 0.45 : 1,
                          }}
                        />
                      )}
                    </div>
                    <span className="w-14 text-right font-medium tabular-nums">
                      {row.cells[first.key]}
                    </span>
                  </div>
                </td>
                {rest.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      'whitespace-nowrap py-1.5 pl-3 tabular-nums',
                      c.align !== 'left' && 'text-right'
                    )}
                  >
                    {row.cells[c.key]}
                  </td>
                ))}
              </tr>
            ) : (
              <tr
                key={`empty-${i}`}
                aria-hidden
                className="h-9 border-b last:border-b-0"
              >
                <td colSpan={columns.length + 1} />
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
