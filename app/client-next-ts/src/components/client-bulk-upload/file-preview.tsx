import { useState } from 'react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { serializeCsv } from '@/lib/client-bulk-upload/csv';
import {
  maskSensitive,
  SENSITIVE_CSV_COLUMNS,
} from '@/lib/client-bulk-upload/details';
import type { CsvRow } from '@/lib/client-bulk-upload/schema';
import { cn } from '@/lib/utils';

const PREVIEW_LIMIT = 200;

/** Values the tool fills in; shown muted so people see what they don't need to type. */
const AUTO_FILLED =
  /^(partyType|roles\.\d|parentExternalId|products\.0)$|countryOf|\.country$|addressType$|phoneType$|countryCode$|codeType$|issuer$|idType$/;

export function FilePreview({
  rows,
  headers,
  errorCount,
}: {
  rows: CsvRow[];
  headers: string[];
  errorCount: number;
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const hasSensitive = headers.some((header) =>
    SENSITIVE_CSV_COLUMNS.has(header)
  );

  const copy = async () => {
    await navigator.clipboard.writeText(serializeCsv(rows, headers));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-jpm-gray-300 bg-white p-8 text-center text-sm text-jpm-gray-600">
        Add a client to see the file preview.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-3xl space-y-1 text-sm text-jpm-gray-700">
          <p>
            This is exactly what goes into the file: one row per business,
            followed by one row per person. You don’t need to edit it.{' '}
            <span className="text-jpm-gray-500">
              Grey values are filled in for you.
            </span>
          </p>
          {hasSensitive && !revealed ? (
            <p className="text-jpm-gray-500">
              Tax IDs, ID numbers and birth dates are hidden here; the file
              contains the full values.
            </p>
          ) : null}
          {errorCount > 0 ? (
            <p className="text-red-700">
              Rows with problems are shown too, but the file can’t be downloaded
              until they’re fixed.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {hasSensitive ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={revealed}
              onClick={() => setRevealed(!revealed)}
            >
              {revealed ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              {revealed ? 'Hide sensitive values' : 'Show sensitive values'}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void copy()}
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied ? 'Copied' : 'Copy CSV text'}
          </Button>
        </div>
      </div>
      <div className="max-h-[65vh] overflow-auto rounded-lg border border-jpm-gray-200 bg-white">
        <table className="w-max min-w-full border-separate border-spacing-0 font-mono text-xs">
          <thead className="sticky top-0 bg-jpm-gray-100 text-left">
            <tr>
              <th className="border-b border-jpm-gray-200 px-2 py-2 font-medium text-jpm-gray-500">
                #
              </th>
              {headers.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap border-b border-jpm-gray-200 px-2 py-2 font-semibold text-jpm-gray-800"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, PREVIEW_LIMIT).map((row, index) => {
              const isBusiness = row.partyType === 'ORGANIZATION';
              return (
                <tr key={index} className={cn(isBusiness && 'bg-sp-accent/50')}>
                  <td className="border-b border-jpm-gray-100 px-2 py-1 text-jpm-gray-400">
                    {index + 2}
                  </td>
                  {headers.map((header) => {
                    const value = row[header] ?? '';
                    const hide =
                      !revealed && SENSITIVE_CSV_COLUMNS.has(header) && value;
                    return (
                      <td
                        key={header}
                        className={cn(
                          'whitespace-nowrap border-b border-jpm-gray-100 px-2 py-1',
                          AUTO_FILLED.test(header) ||
                            (!isBusiness && header === 'externalId')
                            ? 'text-jpm-gray-500'
                            : 'text-jpm-gray-900'
                        )}
                      >
                        {hide ? maskSensitive(header, value) : value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length > PREVIEW_LIMIT ? (
        <p className="text-xs text-jpm-gray-500">
          Showing the first {PREVIEW_LIMIT} of {rows.length.toLocaleString()}{' '}
          rows. The download includes all of them.
        </p>
      ) : null}
    </div>
  );
}
