import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { FileUp, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  importFromText,
  type ImportFormat,
  type ImportResult,
} from '@/lib/client-bulk-upload/csv';
import { GRID_COLUMNS } from '@/lib/client-bulk-upload/model';
import { cn } from '@/lib/utils';

const MAX_IMPORT_BYTES = 15 * 1024 * 1024;
const NOTE_LIMIT = 30;

const FORMAT_LABEL: Record<ImportFormat, string> = {
  'bulk-upload':
    'Bulk upload file (template format) — it will be checked and repaired where possible',
  spreadsheet: 'Spreadsheet with column headers',
  positional: `Rows without headers, read in on-screen column order (${GRID_COLUMNS.slice(
    0,
    4
  )
    .map((c) => c.label)
    .join(', ')}, …)`,
};

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialText?: string;
  hasExistingData: boolean;
  onImport: (result: ImportResult, mode: 'append' | 'replace') => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  initialText = '',
  hasExistingData,
  onImport,
}: ImportDialogProps) {
  const [text, setText] = useState(initialText);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (open) {
      setText(initialText);
      setFileName(null);
      setError(null);
    }
  }, [open, initialText]);

  const result = useMemo(
    () => (text.trim() ? importFromText(text) : null),
    [text]
  );
  const peopleCount = result
    ? result.clients.reduce((total, client) => total + client.people.length, 0)
    : 0;

  const readFile = async (file: File) => {
    setError(null);
    if (/\.(xlsx|xlsm|xls|numbers|ods)$/i.test(file.name)) {
      setError(
        'Spreadsheet workbooks can’t be read directly. In Excel choose File › Save As › “CSV UTF-8”, then import that file — or copy the rows and paste them below.'
      );
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setError(
        'This file is larger than 15 MB. Split it and import the parts one at a time.'
      );
      return;
    }
    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    const utf8 = new TextDecoder('utf-8').decode(buffer);
    // Excel's plain "CSV" on Windows is not UTF-8; fall back so accented letters survive.
    setText(
      utf8.includes('\uFFFD')
        ? new TextDecoder('windows-1252').decode(buffer)
        : utf8
    );
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void readFile(file);
  };

  const apply = (mode: 'append' | 'replace') => {
    if (!result || result.clients.length === 0) return;
    onImport(result, mode);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import clients</DialogTitle>
          <DialogDescription>
            Bring in a file you already have, or rows copied from Excel. Nothing
            is uploaded — the file is read in this browser.
          </DialogDescription>
        </DialogHeader>

        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 text-center text-sm',
            dragging
              ? 'border-sp-brand bg-sp-accent'
              : 'border-jpm-gray-300 hover:bg-jpm-gray-50'
          )}
        >
          <FileUp className="size-6 text-sp-brand" aria-hidden />
          <span className="font-medium text-jpm-gray-900">
            {fileName ?? 'Choose a CSV file or drop it here'}
          </span>
          <span className="text-xs text-jpm-gray-500">
            Accepts the bulk upload CSV, the blank spreadsheet template, or any
            CSV / TSV in the on-screen column order
          </span>
          <input
            type="file"
            accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void readFile(file);
              event.target.value = '';
            }}
          />
        </label>

        <div className="space-y-1">
          <label
            htmlFor="bulk-import-paste"
            className="text-sm font-medium text-jpm-gray-900"
          >
            Or paste rows
          </label>
          <textarea
            id="bulk-import-paste"
            value={text}
            onChange={(event) => {
              setFileName(null);
              setText(event.target.value);
            }}
            rows={5}
            spellCheck={false}
            placeholder={
              'Copy rows in Excel and paste here. Include the header row if you have one.'
            }
            className="w-full rounded-md border border-jpm-gray-300 p-2 font-mono text-xs focus:border-sp-brand focus:outline-none focus:ring-2 focus:ring-sp-brand/20"
          />
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="space-y-2 rounded-md border border-jpm-gray-200 bg-jpm-gray-50 p-3 text-sm">
            <p className="text-jpm-gray-700">
              <span className="font-medium text-jpm-gray-900">Detected:</span>{' '}
              {FORMAT_LABEL[result.format]}
            </p>
            <p className="font-medium text-jpm-gray-900">
              {result.clients.length} client
              {result.clients.length === 1 ? '' : 's'} · {peopleCount}{' '}
              {peopleCount === 1 ? 'person' : 'people'}
            </p>
            {result.notes.length > 0 ? (
              <div>
                <p className="flex items-center gap-1 text-xs font-medium text-jpm-gray-700">
                  <Info className="size-3.5" aria-hidden />
                  Notes ({result.notes.length})
                </p>
                <ul className="mt-1 max-h-40 list-disc space-y-0.5 overflow-auto pl-5 text-xs text-jpm-gray-700">
                  {result.notes.slice(0, NOTE_LIMIT).map((note, index) => (
                    <li key={index}>{note}</li>
                  ))}
                  {result.notes.length > NOTE_LIMIT ? (
                    <li>…and {result.notes.length - NOTE_LIMIT} more</li>
                  ) : null}
                </ul>
              </div>
            ) : null}
            <p className="text-xs text-jpm-gray-500">
              Anything still missing or invalid will be highlighted after
              import.
            </p>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          {hasExistingData ? (
            <Button
              type="button"
              variant="outline"
              disabled={!result || result.clients.length === 0}
              onClick={() => apply('replace')}
            >
              Replace current list
            </Button>
          ) : null}
          <Button
            type="button"
            disabled={!result || result.clients.length === 0}
            onClick={() => apply('append')}
          >
            {hasExistingData ? 'Add' : 'Import'} {result?.clients.length ?? 0}{' '}
            {result?.clients.length === 1 ? 'client' : 'clients'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
