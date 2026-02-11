import { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { type ReferrerData } from '@/lib/csv-parser';

interface ReferrerTableProps {
  data: ReferrerData[];
  dateRange: { start: string | null; end: string | null };
}

export function ReferrerTable({ data, dateRange }: ReferrerTableProps) {
  const tableData = useMemo(() => {
    // Referrer CSV doesn't have dates, so we show all data regardless of date range
    // Aggregate by referrer
    const referrerMap = new Map<string, number>();

    for (const item of data) {
      const referrer = item.referrer || 'Direct';
      const current = referrerMap.get(referrer) || 0;
      referrerMap.set(referrer, current + item.count);
    }

    // Convert to array and sort descending by count
    return Array.from(referrerMap.entries())
      .map(([referrer, count]) => ({
        referrer,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [data]);

  const hasDateRange = dateRange.start || dateRange.end;

  if (tableData.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center text-muted-foreground">
        No referrer data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasDateRange && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Referrer data is aggregated across all time and is not filtered by
            the selected date range, as the source CSV does not include date
            information.
          </AlertDescription>
        </Alert>
      )}
      <div className="rounded-md border">
        <div className="max-h-[600px] overflow-x-auto overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-muted/50">
              <tr className="border-b">
                <th className="h-10 px-4 text-left align-middle font-medium">
                  Referrer
                </th>
                <th className="h-10 px-4 text-right align-middle font-medium">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr
                  key={index}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <td className="p-4 align-middle">
                    <a
                      href={
                        row.referrer.startsWith('http') ? row.referrer : '#'
                      }
                      target={
                        row.referrer.startsWith('http') ? '_blank' : undefined
                      }
                      rel={
                        row.referrer.startsWith('http')
                          ? 'noopener noreferrer'
                          : undefined
                      }
                      className="text-primary hover:underline"
                    >
                      {row.referrer}
                    </a>
                  </td>
                  <td className="p-4 text-right align-middle">
                    {row.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
