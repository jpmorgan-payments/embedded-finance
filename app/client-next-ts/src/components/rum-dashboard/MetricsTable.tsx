import { useMemo, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type RumData } from '@/hooks/use-rum-data';

import { type DataMode } from './ModeSelector';

interface MetricsTableProps {
  data: RumData;
  dateRange: { start: string | null; end: string | null };
  mode: DataMode;
}

function DataTable({
  rows,
  columns,
}: {
  rows: Array<Record<string, string | number>>;
  columns: Array<{ key: string; label: string; align?: 'left' | 'right' }>;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const filteredRows = useMemo(() => {
    if (!searchTerm) return rows;

    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      Object.values(row).some((val) => String(val).toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  const sortedRows = useMemo(() => {
    if (!sortColumn) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      let aVal = a[sortColumn];
      let bVal = b[sortColumn];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal);
      const bStr = String(bVal);
      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRows, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <span className="text-sm text-muted-foreground">
          {sortedRows.length} rows
        </span>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`h-10 cursor-pointer px-4 align-middle font-medium hover:bg-muted ${
                      col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}{' '}
                    {sortColumn === col.key &&
                      (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                sortedRows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-b transition-colors hover:bg-muted/50"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`p-4 align-middle ${
                          col.align === 'right' ? 'text-right' : ''
                        }`}
                      >
                        {typeof row[col.key] === 'number'
                          ? row[col.key].toLocaleString()
                          : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function MetricsTable({ data, dateRange, mode }: MetricsTableProps) {
  const trafficRows = useMemo(() => {
    if (mode === 'daily') {
      let filtered = [...data.traffic];

      if (dateRange.start) {
        filtered = filtered.filter((item) => item.date >= dateRange.start!);
      }
      if (dateRange.end) {
        filtered = filtered.filter((item) => item.date <= dateRange.end!);
      }

      return filtered.map((item) => ({
        date: item.date,
        repository: item.repository_name,
        views: item.views,
        unique_visitors: item.unique_visitors,
      }));
    } else {
      // Monthly mode - no date filtering
      return data.monthlyTraffic.map((item) => ({
        month: item.month,
        repository: item.repository_name,
        views: item.views,
        unique_visitors: item.unique_visitors,
      }));
    }
  }, [data, dateRange, mode]);

  const cloneRows = useMemo(() => {
    if (mode === 'daily') {
      let filtered = [...data.clones];

      if (dateRange.start) {
        filtered = filtered.filter((item) => item.date >= dateRange.start!);
      }
      if (dateRange.end) {
        filtered = filtered.filter((item) => item.date <= dateRange.end!);
      }

      return filtered.map((item) => ({
        date: item.date,
        repository: item.repository_name,
        clones: item.clones,
        unique_cloners: item.unique_cloners,
      }));
    } else {
      // Monthly mode - no date filtering
      return data.monthlyClones.map((item) => ({
        month: item.month,
        repository: item.repository_name,
        clones: item.clones,
        unique_cloners: item.unique_cloners,
      }));
    }
  }, [data, dateRange, mode]);

  const referrerRows = useMemo(() => {
    if (mode === 'monthly') return [];
    let filtered = [...data.referrers];

    if (dateRange.start) {
      filtered = filtered.filter((item) => item.date >= dateRange.start!);
    }
    if (dateRange.end) {
      filtered = filtered.filter((item) => item.date <= dateRange.end!);
    }

    return filtered.map((item) => ({
      date: item.date,
      repository: item.repository_name,
      referrer: item.referrer,
      count: item.count,
    }));
  }, [data, dateRange, mode]);

  return (
    <Tabs defaultValue="traffic" className="w-full">
      <TabsList>
        <TabsTrigger value="traffic">Traffic</TabsTrigger>
        <TabsTrigger value="clones">Clones</TabsTrigger>
        {mode === 'daily' && (
          <TabsTrigger value="referrers">Referrers</TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="traffic">
        <DataTable
          rows={trafficRows}
          columns={[
            {
              key: mode === 'daily' ? 'date' : 'month',
              label: mode === 'daily' ? 'Date' : 'Month',
            },
            { key: 'repository', label: 'Repository' },
            { key: 'views', label: 'Views', align: 'right' },
            {
              key: 'unique_visitors',
              label: 'Unique Visitors',
              align: 'right',
            },
          ]}
        />
      </TabsContent>
      <TabsContent value="clones">
        <DataTable
          rows={cloneRows}
          columns={[
            {
              key: mode === 'daily' ? 'date' : 'month',
              label: mode === 'daily' ? 'Date' : 'Month',
            },
            { key: 'repository', label: 'Repository' },
            { key: 'clones', label: 'Clones', align: 'right' },
            { key: 'unique_cloners', label: 'Unique Cloners', align: 'right' },
          ]}
        />
      </TabsContent>
      {mode === 'daily' && (
        <TabsContent value="referrers">
          <DataTable
            rows={referrerRows}
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'repository', label: 'Repository' },
              { key: 'referrer', label: 'Referrer' },
              { key: 'count', label: 'Count', align: 'right' },
            ]}
          />
        </TabsContent>
      )}
    </Tabs>
  );
}
