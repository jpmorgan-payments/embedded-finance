import { ChevronsRight } from 'lucide-react';

import type { TourStep } from './guided-tour';

export const TOUR_STORAGE_KEY = 'client-bulk-upload.tour-seen';

export const CLIENT_TOUR_STEPS: TourStep[] = [
  {
    target: 'client-id',
    title: 'Start here: one row per business',
    body: (
      <p>
        Type your own unique ID for this business, such as your seller ID. It is
        used to match results back to your records. The cursor is already in
        this field.
      </p>
    ),
    example: 'S-1001',
  },
  {
    target: 'business-group',
    title: 'Business details',
    body: (
      <p>
        Enter the legal name of the business and choose its business type from
        the list. Business email is optional: leave it blank to use the
        controller’s email.
      </p>
    ),
    example: 'Acme Kitchen Supply LLC · Limited liability company (LLC)',
  },
  {
    target: 'controller-group',
    title: 'Controller',
    body: (
      <>
        <p>
          The individual with significant responsibility and control over the
          business, such as an executive officer or senior manager. They
          complete onboarding and are sent the email to set up a login.{' '}
          <strong>Controller</strong> and <strong>Authorized user</strong> are
          already selected for this person; tick <strong>Owner 25%+</strong> if
          they also own 25% or more. Enter their legal name and email.
        </p>
        <p className="flex items-start gap-1.5 rounded-md bg-amber-50 p-2 text-amber-900">
          <ChevronsRight className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            The table is wider than the screen, so we scrolled it to the right.
            Scroll sideways (Shift + mouse wheel) or use the arrow on the
            table’s edge to see every column.
          </span>
        </p>
      </>
    ),
    example: 'Jane · Doe · jane@acme.com',
  },
  {
    target: 'others-column',
    title: 'Other beneficial owners',
    body: (
      <p>
        Use <strong>Add</strong> to list each other individual who owns 25% or
        more of the business. Don’t add the controller again; tick{' '}
        <strong>Owner 25%+</strong> on their row instead.
      </p>
    ),
  },
  {
    target: 'columns-button',
    title: 'Optional details',
    body: (
      <p>
        Already have more details, such as addresses, phone numbers, tax IDs or
        birth dates? Add their columns here. Every optional column can be left
        out. Tax IDs, ID numbers and birth dates stay hidden on screen unless
        you click into the field.
      </p>
    ),
  },
  {
    target: 'import-button',
    title: 'Many clients? Paste or import',
    body: (
      <p>
        Copy rows in Excel and paste them into the first Client ID cell
        (Ctrl+V), in the column order shown. You can also import a CSV file,
        including one filled in from the bulk upload template.
      </p>
    ),
  },
  {
    target: 'download-button',
    title: 'Review, download, then check the file',
    body: (
      <p>
        Anything missing or invalid is marked in red. When everything is ready,
        review and download the CSV. Then open it and check it before you send
        it: the file is used as provided.
      </p>
    ),
  },
];

export function readTourSeen(): boolean {
  try {
    return window.localStorage.getItem(TOUR_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTourSeen(): void {
  try {
    window.localStorage.setItem(TOUR_STORAGE_KEY, '1');
  } catch {
    // Storage can be unavailable (private mode); the tour just shows again.
  }
}
