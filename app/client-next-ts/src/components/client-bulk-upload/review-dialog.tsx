import { useEffect, useState } from 'react';
import { AlertTriangle, Download, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { VERIFY_CHECKLIST } from './instructions';

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientCount: number;
  peopleCount: number;
  files: { fileName: string; clientCount: number; rowCount: number }[];
  warningCount: number;
  onShowWarnings: () => void;
  onOpenPreview: () => void;
  onDownload: () => void;
}

export function ReviewDialog({
  open,
  onOpenChange,
  clientCount,
  peopleCount,
  files,
  warningCount,
  onShowWarnings,
  onOpenPreview,
  onDownload,
}: ReviewDialogProps) {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) setConfirmed(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review before downloading</DialogTitle>
          <DialogDescription>
            The file is used exactly as provided to set up your clients and send
            onboarding emails. This tool checks the format only — please confirm
            the details are correct.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-jpm-gray-200 bg-jpm-gray-50 p-3 text-sm">
          <p className="font-medium text-jpm-gray-900">
            {clientCount.toLocaleString()} client{clientCount === 1 ? '' : 's'}{' '}
            · {peopleCount.toLocaleString()}{' '}
            {peopleCount === 1 ? 'individual' : 'individuals'}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-jpm-gray-600">
            {files.map((file) => (
              <li key={file.fileName} className="flex items-center gap-1.5">
                <FileText className="size-3.5 shrink-0" aria-hidden />
                <span className="break-all">{file.fileName}</span>
                <span className="shrink-0">
                  · {file.rowCount.toLocaleString()} rows
                </span>
              </li>
            ))}
          </ul>
          {files.length > 1 ? (
            <p className="mt-2 text-xs text-jpm-gray-600">
              Split into {files.length} files to stay within 10,000 rows / 10 MB
              per file.
            </p>
          ) : null}
        </div>

        {warningCount > 0 ? (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">
              {warningCount} warning{warningCount === 1 ? '' : 's'}, such as
              possible duplicates.
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onShowWarnings}
            >
              Review warnings
            </Button>
          </div>
        ) : null}

        <div className="space-y-2 text-sm text-jpm-gray-800">
          <p className="font-medium">Please check that:</p>
          <ul className="list-disc space-y-1 pl-5">
            {VERIFY_CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onOpenPreview}
            className="text-sm font-medium text-sp-brand underline-offset-4 hover:underline"
          >
            Open the file preview
          </button>
        </div>

        <label className="flex items-start gap-3 rounded-md border border-sp-brand/40 bg-sp-accent p-3 text-sm text-jpm-gray-900">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-sp-brand"
          />
          <span>
            I have reviewed the businesses, names, emails and roles, and they
            are correct. I will open the downloaded file and check it before
            sending it.
          </span>
        </label>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Keep editing
          </Button>
          <Button type="button" disabled={!confirmed} onClick={onDownload}>
            <Download aria-hidden />
            Download {files.length > 1 ? `${files.length} files` : 'CSV'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
