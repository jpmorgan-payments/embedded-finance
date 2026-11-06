import type { ReactNode } from 'react';
import { ClipboardCheck, ExternalLink, ShieldCheck } from 'lucide-react';

import {
  CSV_HEADERS,
  ORGANIZATION_TYPES,
} from '@/lib/client-bulk-upload/schema';

/** Field reference linked from the upload instructions. */
export const API_FIELD_REFERENCE_URL =
  'https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/onboarding#/operations/smbdo-postClients';

export const STEPS: { title: string; body: string }[] = [
  {
    title: 'Add your clients',
    body: 'Type them in, paste rows copied from a spreadsheet, or import a CSV — including a file already filled in from the bulk upload template.',
  },
  {
    title: 'Fix anything marked in red',
    body: 'The file can’t be downloaded until every business meets the upload rules.',
  },
  {
    title: 'Review and download',
    body: 'Confirm the details are correct, then download the CSV.',
  },
  {
    title: 'Check the file, then send it',
    body: 'Open the downloaded file and verify it. It is used as provided to set up your clients and send onboarding emails.',
  },
];

export const VERIFY_CHECKLIST: string[] = [
  'Every client you expect is in the file, and only once.',
  'Each client ID matches your own records.',
  'Legal business names and business types are correct.',
  'Each controller’s name and email are correct — this person completes onboarding and is sent the email to set up a login.',
  'Every individual who owns 25% or more is listed as a beneficial owner.',
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-page-h4 font-semibold text-jpm-gray-900">{title}</h2>
      {children}
    </section>
  );
}

const organizationTypeList = ORGANIZATION_TYPES.map((option) =>
  option.label.replace(/ \(.+\)$/, '')
).join(', ');

const FIELD_ROWS: { field: string; what: string; rules: string }[] = [
  {
    field: 'Client ID',
    what: 'Unique identifier of the client at your end',
    rules: 'Required · 1–50 characters · unique for each client',
  },
  {
    field: 'Legal business name',
    what: 'Legal name of the business',
    rules: 'Required · 1–500 characters',
  },
  {
    field: 'Business type',
    what: 'Legal classification of the business',
    rules: `Required · one of: ${organizationTypeList}`,
  },
  {
    field: 'Business email',
    what: 'Email of the controller, to receive micro-deposit notifications',
    rules:
      'Required in the file — if you leave it blank, the controller’s email is used · up to 320 characters',
  },
  {
    field: 'First, middle and last name',
    what: 'Legal name of each individual',
    rules:
      "First and last name required (1–40 characters). Middle name only if it is part of the legal name (1–30). Letters A–Z, numbers, spaces and ( ) _ / & + % @ # ; , . : - ' — no accented letters",
  },
  {
    field: 'Email (individual)',
    what: 'Email address of the individual',
    rules:
      'Required for the controller · optional for other beneficial owners · format name@domain.com · up to 320 characters',
  },
  {
    field: 'Roles',
    what: 'Controller (always also the authorized user), beneficial owners (25%+)',
    rules:
      'One controller per business — Controller and Authorized user are selected by default; they complete onboarding and receive the login email. List every other individual who owns 25% or more as a beneficial owner',
  },
];

const OPTIONAL_ROWS: { group: string; fields: string; rules: string }[] = [
  {
    group: 'Business profile',
    fields: 'DBA name, business description, NAICS code, year formed, website',
    rules:
      'DBA name up to 100 characters (letters A–Z, numbers and basic punctuation). Description 10–1,000 characters. NAICS code 6 digits. Year formed 4 digits, not in the future',
  },
  {
    group: 'Business phone / Personal phone',
    fields: 'Phone number',
    rules: 'US number, 10 digits. Dashes, spaces and brackets are fine',
  },
  {
    group: 'Business address / Home address',
    fields:
      'Address line 1 and 2, city, state, ZIP code (business: address type)',
    rules:
      'Street address up to 60 characters per line — no PO boxes or private mailboxes, and line 1 can’t be only numbers. City up to 40 characters. US state. 5-digit ZIP or ZIP+4',
  },
  {
    group: 'Business tax ID',
    fields: 'Tax ID type, tax ID number',
    rules:
      'EIN by default; SSN or ITIN only for sole proprietorships and LLCs. 9 digits',
  },
  {
    group: 'Personal details',
    fields: 'Suffix, birth date, job title, nature of ownership, language',
    rules:
      'Suffix up to 5 characters. Must be 18 or older. Job title: CEO, CFO, COO, President, Chairman, Senior Branch Manager or Other (describe it, up to 50 characters). Ownership: Direct or Indirect. Language: English (US) or French (Canada)',
  },
  {
    group: 'Personal ID',
    fields: 'ID type, ID number',
    rules:
      'SSN or ITIN (9 digits; an ITIN starts with 9), passport, driver’s license or other government ID (up to 20 characters), issued in the US',
  },
];

export function Instructions() {
  return (
    <div className="max-w-4xl space-y-8 rounded-lg border border-jpm-gray-200 bg-white p-6">
      <Section title="How to use this tool">
        <ol className="space-y-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sp-brand text-xs font-semibold text-white">
                {index + 1}
              </span>
              <span className="text-sm text-jpm-gray-700">
                <strong className="text-jpm-gray-900">{step.title}.</strong>{' '}
                {step.body}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <section className="space-y-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
        <h2 className="flex items-center gap-2 text-page-h4 font-semibold text-jpm-gray-900">
          <ClipboardCheck className="size-5 text-amber-700" aria-hidden />
          Check the file before you send it
        </h2>
        <p className="text-sm text-jpm-gray-800">
          The file is used exactly as you send it to set up your clients and
          send onboarding emails. This tool checks the format — it can’t tell
          whether a name, email or business type is correct. Open the downloaded
          file, or use the <strong>File preview</strong> tab, and check that:
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-jpm-gray-800">
          {VERIFY_CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-sm text-jpm-gray-800">
          Need a change? Import the file back into this tool, edit it here, and
          download it again. Editing and re-saving the CSV in a spreadsheet app
          can alter values — for example, remove leading zeros from IDs — or
          change the file format.
        </p>
      </section>

      <Section title="What to enter">
        <div className="overflow-x-auto rounded-md border border-jpm-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-jpm-gray-50 text-xs uppercase tracking-wide text-jpm-gray-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Field</th>
                <th className="px-3 py-2 font-semibold">What to enter</th>
                <th className="px-3 py-2 font-semibold">Rules</th>
              </tr>
            </thead>
            <tbody>
              {FIELD_ROWS.map((row) => (
                <tr
                  key={row.field}
                  className="border-t border-jpm-gray-200 align-top"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-jpm-gray-900">
                    {row.field}
                  </td>
                  <td className="px-3 py-2 text-jpm-gray-700">{row.what}</td>
                  <td className="px-3 py-2 text-jpm-gray-700">{row.rules}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Roles">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-semibold text-jpm-gray-900">Controller</dt>
            <dd className="text-jpm-gray-700">
              An individual who has significant responsibility and control over
              the business, such as an executive officer or senior manager. This
              individual is authorized by the client to complete the onboarding
              process with J.P. Morgan. This person may also be a beneficial
              owner. Each business has one controller.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-jpm-gray-900">Authorized user</dt>
            <dd className="text-jpm-gray-700">
              An additional role that is always added to the controller, as this
              is the person who is sent an email to set up a login to access
              onboarding. Controller and authorized user are selected by default
              for the first person in each business and can’t be removed.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-jpm-gray-900">
              Beneficial owner (Owner 25%+)
            </dt>
            <dd className="text-jpm-gray-700">
              An individual who owns 25% or more of the client’s business. If
              the controller owns 25% or more, tick <em>Owner 25%+</em> on the
              controller’s row instead of adding them again. Add every other
              individual who owns 25% or more as a beneficial owner.
            </dd>
          </div>
        </dl>
      </Section>

      <Section title="Optional details">
        <p className="text-sm text-jpm-gray-700">
          If you already have more information, add it with{' '}
          <strong>Optional columns</strong> (for the controller) or in the{' '}
          <strong>One at a time</strong> view (for every individual). Leave
          anything out that you don’t have. Only US businesses, US addresses and
          US phone numbers are accepted.
        </p>
        <div className="overflow-x-auto rounded-md border border-jpm-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-jpm-gray-50 text-xs uppercase tracking-wide text-jpm-gray-600">
              <tr>
                <th className="px-3 py-2 font-semibold">Group</th>
                <th className="px-3 py-2 font-semibold">Fields</th>
                <th className="px-3 py-2 font-semibold">Rules</th>
              </tr>
            </thead>
            <tbody>
              {OPTIONAL_ROWS.map((row) => (
                <tr
                  key={row.group}
                  className="border-t border-jpm-gray-200 align-top"
                >
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-jpm-gray-900">
                    {row.group}
                  </td>
                  <td className="px-3 py-2 text-jpm-gray-700">{row.fields}</td>
                  <td className="px-3 py-2 text-jpm-gray-700">{row.rules}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Filled in for you">
        <ul className="list-disc space-y-1 pl-5 text-sm text-jpm-gray-700">
          <li>The column headers, exactly as required.</li>
          <li>
            A separate row for each business and for each individual, with party
            type (<code>ORGANIZATION</code> / <code>INDIVIDUAL</code>).
          </li>
          <li>
            Roles, controller first: the controller’s row gets{' '}
            <code>CONTROLLER</code> and <code>AUTHORIZED_USER</code> (plus{' '}
            <code>BENEFICIAL_OWNER</code> if ticked); every other individual
            gets <code>BENEFICIAL_OWNER</code>.
          </li>
          <li>
            Individual IDs built from the client ID — <code>55747723_1</code>{' '}
            for the controller, <code>55747723_2</code> and so on for beneficial
            owners — and the link to the business (<code>parentExternalId</code>
            ).
          </li>
          <li>
            Product <code>EMBEDDED_PAYMENTS</code> on business rows, and country{' '}
            <code>US</code> for formation and residence.
          </li>
          <li>
            For optional details: country <code>US</code> on addresses and ID
            issuers, country code <code>+1</code> on phone numbers, the address
            and phone types, and <code>NAICS</code> as the industry code type.
            Dashes and spaces are removed from tax IDs and phone numbers, and
            birth dates are written as YYYY-MM-DD.
          </li>
          <li>
            Optional columns appear in the file only when at least one row uses
            them.
          </li>
          <li>
            A file over 10,000 rows or 10 MB is split into parts. A business and
            its individuals always stay in the same file.
          </li>
        </ul>
      </Section>

      <section className="space-y-2 rounded-lg border border-jpm-gray-200 bg-jpm-gray-50 p-4">
        <h2 className="flex items-center gap-2 text-page-h4 font-semibold text-jpm-gray-900">
          <ShieldCheck className="size-5 text-sp-brand" aria-hidden />
          Your data
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-jpm-gray-700">
          <li>
            Everything you enter stays in this browser — nothing is uploaded.
            Reloading or closing the page clears it, so download the file to
            keep your work. You can import it again later to continue.
          </li>
          <li>
            Tax IDs, ID numbers and birth dates are hidden on screen unless you
            click into the field. The downloaded file contains the full values.
          </li>
          <li>
            The file contains personal information. Share it only through the
            secure method agreed with your J.P. Morgan contact.
          </li>
        </ul>
      </section>

      <details className="text-sm text-jpm-gray-700">
        <summary className="cursor-pointer font-medium text-jpm-gray-900">
          File format reference
        </summary>
        <div className="mt-3 space-y-2">
          <p>
            CSV, UTF-8, one header row. Each column header is an API field name
            — don’t rename them. Required columns, in order (optional detail
            columns follow when used):
          </p>
          <code className="block overflow-x-auto whitespace-nowrap rounded bg-jpm-gray-100 p-2 text-xs">
            {CSV_HEADERS.join(',')}
          </code>
          <a
            href={API_FIELD_REFERENCE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-sp-brand underline-offset-4 hover:underline"
          >
            Field details in the API reference
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </details>
    </div>
  );
}
