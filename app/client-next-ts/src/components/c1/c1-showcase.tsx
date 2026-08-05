import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Home,
  Info,
  Menu,
  Search,
  SlidersHorizontal,
  User,
  Users,
  X,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import {
  ACCOUNT_CREATED_DATE_OPTIONS,
  c1Participants,
  c1PlatformAccounts,
  c1Recipients,
  c1Transactions,
  C1_PLATFORM,
  C1_PLATFORM_SUMMARY,
  HAS_BALANCE_OPTIONS,
  LINKED_ACCOUNT_STATUS_OPTIONS,
  ONBOARDING_STATUS_OPTIONS,
  PLATFORM_ACCOUNT_CATEGORY_LABELS,
  SEARCH_BY_OPTIONS,
  type C1Account,
  type C1LinkedAccountAttempt,
  type C1OutstandingDocument,
  type C1Participant,
  type C1PlatformAccount,
  type C1Recipient,
  type C1Transaction,
} from './c1-mock-data';

// Fonts: Open Sans for body, Amplitude for headers (matches the Salt theme intent).
const BODY_FONT = "'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEADING_FONT = "Amplitude, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const HEADING: React.CSSProperties = { fontFamily: HEADING_FONT };

const INFO_TEXT =
  'Data is as of activity in the last 60 mins; EOD Balance is as of last business day';

const AS_OF = new Date().toLocaleString('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const formatUsd = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

const mask = (accountNumber: string) =>
  accountNumber ? `****${accountNumber.slice(-4)}` : '****';

const formatDate = (iso?: string) => {
  if (!iso) return '\u2014';
  const t = Date.parse(iso);
  return Number.isNaN(t)
    ? iso
    : new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Linked bank account state derivation (ported from efs-de-ui linkedAccountStatus).
// Precedence: Active > Microdeposits Initiated / Ready for Validation > Pending > Rejected / Inactive.
const LINK_STATUS_META: Record<string, { label: string; rank: number }> = {
  active: { label: 'Active', rank: 5 },
  microdeposits_initiated: { label: 'Microdeposits Initiated', rank: 4 },
  ready_for_validation: { label: 'Ready for Validation', rank: 4 },
  pending: { label: 'Pending', rank: 3 },
  rejected: { label: 'Rejected', rank: 2 },
  inactive: { label: 'Inactive', rank: 2 },
};

const normalizeLinkKey = (status?: string) =>
  (status ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');

const linkTime = (date?: string) => {
  if (!date) return 0;
  const t = Date.parse(date.includes('T') ? date : `${date}T00:00:00`);
  return Number.isNaN(t) ? 0 : t;
};

function deriveLinkedAccountStatus(attempts: C1LinkedAccountAttempt[] = []): {
  status: string;
  attemptCount: number;
  detail?: string;
  account?: C1LinkedAccountAttempt;
} {
  if (attempts.length === 0) return { status: 'N/A', attemptCount: 0 };
  const ranked = attempts.map((attempt) => {
    const meta = LINK_STATUS_META[normalizeLinkKey(attempt.status)];
    return { attempt, label: meta?.label ?? attempt.status, rank: meta?.rank ?? 1, time: linkTime(attempt.linkedDate) };
  });
  const best = ranked.reduce((b, c) => (c.rank > b.rank || (c.rank === b.rank && c.time > b.time) ? c : b));
  const latest = ranked.reduce((l, c) => (c.time > l.time ? c : l));
  const detail =
    attempts.length > 1 ? `${attempts.length} attempts \u00b7 latest: ${latest.label}` : undefined;
  return { status: best.label, attemptCount: attempts.length, detail, account: best.attempt };
}

// --------------------------------------------------------------------------
// Status badge (mirrors the Salt Tag category mapping in the C1 StatusBadge)
// --------------------------------------------------------------------------

type Tone = 'positive' | 'negative' | 'caution' | 'info' | 'neutral';

const STATUS_TONE: Record<string, Tone> = {
  approved: 'positive',
  active: 'positive',
  completed: 'positive',
  open: 'positive',
  yes: 'positive',
  declined: 'negative',
  failed: 'negative',
  closed: 'negative',
  rejected: 'negative',
  terminated: 'negative',
  pending: 'caution',
  'pending review': 'caution',
  'information requested': 'caution',
  'ready for validation': 'caution',
  'pending close': 'caution',
  'review in progress': 'info',
  submitted: 'info',
  processing: 'info',
  'microdeposits initiated': 'info',
  inactive: 'neutral',
  no: 'neutral',
};

const TONE_CLASS: Record<Tone, string> = {
  positive: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  negative: 'bg-red-50 text-red-700 border-red-200',
  caution: 'bg-amber-50 text-amber-700 border-amber-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
};

function StatusBadge({ status }: { status?: string }) {
  const label = (status?.trim() || '—').replace(/_/g, ' ');
  const tone = STATUS_TONE[label.toLowerCase()] ?? 'neutral';
  return (
    <Badge
      variant="outline"
      className={cn('whitespace-nowrap rounded-full font-medium capitalize', TONE_CLASS[tone])}
    >
      {label.toLowerCase()}
    </Badge>
  );
}

function categoryLabel(category: C1Account['category']) {
  return category === 'LIMITED_DDA_PAYMENTS' ? 'Limited DDA Payments' : 'Limited DDA';
}

// --------------------------------------------------------------------------
// Shared form controls (Salt-styled)
// --------------------------------------------------------------------------

const CONTROL_CLASS =
  'h-9 w-full rounded-md border border-sp-border bg-white px-3 text-sm text-sp-ink outline-none focus-visible:border-sp-brand';

// Cross-browser removal of the native <select> arrow so only our aligned chevron shows.
const SELECT_RESET: React.CSSProperties = {
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  appearance: 'none',
};

function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-[140px] flex-1 flex-col gap-1">
      <span className="text-sm text-slate-600">{label}</span>
      {children}
    </div>
  );
}

function Dropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(CONTROL_CLASS, 'appearance-none pr-9')}
        style={SELECT_RESET}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'ALL' ? 'All' : option}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function Breadcrumb({ items }: { items: Array<{ label: string; onClick?: () => void }> }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1.5 text-slate-500">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1.5">
              {isLast || !item.onClick ? (
                <span className="text-sp-ink" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="text-sp-brand-700 hover:underline"
                  >
                    {item.label}
                  </button>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// --------------------------------------------------------------------------
// Search filter (two rows + Search/Reset + applied-filter pills)
// --------------------------------------------------------------------------

type FilterValues = {
  searchBy: string;
  clientId: string;
  onboardingStatus: string;
  linkedAccount: string;
  hasBalance: string;
  accountCreatedDate: string;
  startDate: string;
  endDate: string;
};

const EMPTY_FILTERS: FilterValues = {
  searchBy: 'Client ID',
  clientId: '',
  onboardingStatus: 'ALL',
  linkedAccount: 'ALL',
  hasBalance: 'ALL',
  accountCreatedDate: 'ALL',
  startDate: '',
  endDate: '',
};

const last7Days = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
};

function SearchFilter({ onSearch }: { onSearch: (values: FilterValues) => void }) {
  const [draft, setDraft] = useState<FilterValues>(EMPTY_FILTERS);
  const [applied, setApplied] = useState<FilterValues>(EMPTY_FILTERS);

  const set = (key: keyof FilterValues, value: string) =>
    setDraft((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'accountCreatedDate') {
        if (value === '7 Days') Object.assign(next, last7Days());
        if (value === 'ALL') Object.assign(next, { startDate: '', endDate: '' });
      }
      return next;
    });

  const search = () => {
    setApplied(draft);
    onSearch(draft);
  };

  const reset = () => {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
    onSearch(EMPTY_FILTERS);
  };

  const pills: Array<{ key: keyof FilterValues; label: string; value: string }> = [];
  const addPill = (key: keyof FilterValues, label: string) => {
    const value = applied[key];
    if (value && value !== 'ALL') pills.push({ key, label, value });
  };
  addPill('clientId', 'Client ID');
  addPill('onboardingStatus', 'Onboarding Status');
  addPill('linkedAccount', 'Linked Account Status');
  addPill('hasBalance', 'Has Balance');
  addPill('accountCreatedDate', 'Account Created Date');

  const removePill = (key: keyof FilterValues) => {
    const cleared: FilterValues = { ...applied, [key]: key === 'clientId' ? '' : 'ALL' };
    if (key === 'accountCreatedDate') {
      cleared.startDate = '';
      cleared.endDate = '';
    }
    setDraft(cleared);
    setApplied(cleared);
    onSearch(cleared);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        <FilterField label="Search By">
          <Dropdown value={draft.searchBy} options={SEARCH_BY_OPTIONS} onChange={(v) => set('searchBy', v)} />
        </FilterField>
        <FilterField label="Client ID">
          <Input
            value={draft.clientId}
            onChange={(e) => set('clientId', e.target.value)}
            placeholder="Enter Client ID"
            className="border-sp-border"
          />
        </FilterField>
        <FilterField label="Onboarding Status">
          <Dropdown
            value={draft.onboardingStatus}
            options={ONBOARDING_STATUS_OPTIONS}
            onChange={(v) => set('onboardingStatus', v)}
          />
        </FilterField>
        <FilterField label="Linked Account Status">
          <Dropdown
            value={draft.linkedAccount}
            options={LINKED_ACCOUNT_STATUS_OPTIONS}
            onChange={(v) => set('linkedAccount', v)}
          />
        </FilterField>
      </div>

      <div className="flex flex-wrap gap-4">
        <FilterField label="Has Balance">
          <Dropdown value={draft.hasBalance} options={HAS_BALANCE_OPTIONS} onChange={(v) => set('hasBalance', v)} />
        </FilterField>
        <FilterField label="Account Created Date">
          <Dropdown
            value={draft.accountCreatedDate}
            options={ACCOUNT_CREATED_DATE_OPTIONS}
            onChange={(v) => set('accountCreatedDate', v)}
          />
        </FilterField>
        <FilterField label="Start Date">
          <input
            type="date"
            value={draft.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className={CONTROL_CLASS}
          />
        </FilterField>
        <FilterField label="End Date">
          <input
            type="date"
            value={draft.endDate}
            onChange={(e) => set('endDate', e.target.value)}
            className={CONTROL_CLASS}
          />
        </FilterField>
      </div>

      <div className="flex items-center">
        <Button onClick={search} className="gap-2 bg-sp-brand text-white hover:bg-sp-brand-700">
          <Search className="h-4 w-4" /> Search
        </Button>
        <Button variant="ghost" onClick={reset} className="ml-2 text-sp-brand-700 hover:text-sp-brand-800">
          Reset
        </Button>
      </div>

      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => removePill(pill.key)}
              className="inline-flex items-center gap-1.5 rounded-full border border-sp-border bg-white px-3 py-1 text-xs text-sp-ink hover:bg-slate-50"
            >
              <span className="text-slate-500">{pill.label}:</span> {pill.value}
              <X className="h-3 w-3 text-slate-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Sorting helpers + participants data table
// --------------------------------------------------------------------------

const toNumber = (v: string) => parseFloat(String(v).replace(/[^0-9.-]/g, '')) || 0;
const toDate = (v: string) => {
  const t = Date.parse(v);
  return Number.isNaN(t) ? 0 : t;
};

function SortHeaderButton({
  label,
  active,
  dir,
  align,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  align: 'left' | 'right';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 uppercase tracking-wide hover:text-sp-ink',
        align === 'right' && 'flex-row-reverse',
      )}
    >
      {label}
      {active ? (
        dir === 'asc' ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 text-slate-300" />
      )}
    </button>
  );
}

type ColKey =
  | 'createdDate'
  | 'clientId'
  | 'businessName'
  | 'onboardingStatus'
  | 'epAccount'
  | 'linkedAccount'
  | 'transactionCount'
  | 'balance';

interface Column {
  key: ColKey;
  label: string;
  align: 'left' | 'right';
  kind: 'text' | 'status' | 'number' | 'date';
}

const COLUMNS: Column[] = [
  { key: 'createdDate', label: 'Created Date', align: 'left', kind: 'date' },
  { key: 'clientId', label: 'Client ID', align: 'left', kind: 'text' },
  { key: 'businessName', label: 'Business Name', align: 'left', kind: 'text' },
  { key: 'onboardingStatus', label: 'Onboarding Status', align: 'left', kind: 'status' },
  { key: 'epAccount', label: 'EP Account', align: 'left', kind: 'text' },
  { key: 'linkedAccount', label: 'Linked Account', align: 'left', kind: 'status' },
  { key: 'transactionCount', label: 'Transaction Count', align: 'right', kind: 'number' },
  { key: 'balance', label: 'EOD Balance', align: 'right', kind: 'number' },
];

const escapeCsv = (value: unknown): string => {
  let str = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  if (/[",\n\r]/.test(str)) str = `"${str.replace(/"/g, '""')}"`;
  return str;
};

function exportCsv(rows: C1Participant[], columns: Column[]) {
  const header = columns.map((c) => c.label);
  const body = rows.map((r) => columns.map((c) => String(r[c.key] ?? '')));
  const csv = [header, ...body].map((line) => line.map(escapeCsv).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'platform-participants.csv';
  link.click();
  URL.revokeObjectURL(url);
}

function ColumnsMenu({
  columns,
  visible,
  onToggle,
}: {
  columns: Column[];
  visible: Record<ColKey, boolean>;
  onToggle: (key: ColKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        className="gap-2 border-sp-border text-sp-ink"
      >
        <SlidersHorizontal className="h-4 w-4" /> Columns
      </Button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-sp-border bg-white p-2 shadow-lg">
          {columns.map((col) => (
            <label
              key={col.key}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-sp-ink hover:bg-slate-50"
            >
              <input
                type="checkbox"
                checked={visible[col.key]}
                onChange={() => onToggle(col.key)}
                className="accent-sp-brand"
              />
              {col.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100];
const DEFAULT_PAGE_SIZE = 5;

// AG-Grid-style pagination footer (page size + range + first/prev/next/last).
function Pagination({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const navBtn =
    'inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className="flex items-center justify-end space-x-6 border-t border-sp-border px-4 py-2 text-xs text-slate-600">
      <div className="flex items-center space-x-2">
        <span>Page Size:</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="h-7 appearance-none rounded-md border border-sp-border bg-white pl-2.5 pr-7 text-xs text-sp-ink outline-none focus-visible:border-sp-brand"
            style={{ ...SELECT_RESET, width: '3.75rem' }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
      <span className="tabular-nums">
        {start} to {end} of {total}
      </span>
      <div className="flex items-center space-x-1">
        <button type="button" className={navBtn} disabled={page <= 1} onClick={() => onPage(1)} aria-label="First page">
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={navBtn}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-1 tabular-nums">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          className={navBtn}
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          className={navBtn}
          disabled={page >= pages}
          onClick={() => onPage(pages)}
          aria-label="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DataTable({
  rows,
  onRowClick,
}: {
  rows: C1Participant[];
  onRowClick: (row: C1Participant) => void;
}) {
  const [sortKey, setSortKey] = useState<ColKey | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [visible, setVisible] = useState<Record<ColKey, boolean>>(
    () => Object.fromEntries(COLUMNS.map((c) => [c.key, true])) as Record<ColKey, boolean>,
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const activeColumns = COLUMNS.filter((c) => visible[c.key]);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = COLUMNS.find((c) => c.key === sortKey)!;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (col.kind === 'number') return (toNumber(av) - toNumber(bv)) * dir;
      if (col.kind === 'date') return (toDate(av) - toDate(bv)) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [rows, sortKey, sortDir]);

  const toggleSort = (key: ColKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const total = sorted.length;
  const paged = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [rows, pageSize]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Info className="h-3.5 w-3.5 text-slate-400" />
          {INFO_TEXT}
        </div>
        <div className="flex items-center gap-2">
          <ColumnsMenu
            columns={COLUMNS}
            visible={visible}
            onToggle={(key) => setVisible((v) => ({ ...v, [key]: !v[key] }))}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCsv(sorted, activeColumns)}
            className="gap-2 border-sp-border text-sp-ink"
          >
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-sp-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-sp-border bg-sp-bg text-left text-xs uppercase tracking-wide text-slate-500">
                {activeColumns.map((col) => (
                  <th
                    key={col.key}
                    className={cn('px-4 py-3 font-semibold', col.align === 'right' && 'text-right')}
                  >
                    <SortHeaderButton
                      label={col.label}
                      active={sortKey === col.key}
                      dir={sortDir}
                      align={col.align}
                      onClick={() => toggleSort(col.key)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr
                  key={p.clientId}
                  onClick={() => onRowClick(p)}
                  className="cursor-pointer border-b border-slate-100 last:border-b-0 hover:bg-sp-accent/50"
                >
                  {activeColumns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3',
                        col.align === 'right' && 'text-right tabular-nums',
                        col.key === 'clientId' && 'font-medium text-sp-brand-700',
                        col.key === 'businessName' && 'text-sp-ink',
                        (col.key === 'createdDate' ||
                          col.key === 'epAccount' ||
                          col.key === 'transactionCount') &&
                          'text-slate-600',
                        col.key === 'balance' && 'text-sp-ink',
                      )}
                    >
                      {col.kind === 'status' ? <StatusBadge status={p[col.key]} /> : p[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {total === 0 && (
                <tr>
                  <td colSpan={activeColumns.length} className="px-4 py-10 text-center text-slate-500">
                    No participants match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// View 1 — Platform participants
// --------------------------------------------------------------------------

function ParticipantsView({ onSelect }: { onSelect: (participant: C1Participant) => void }) {
  const [filters, setFilters] = useState<FilterValues>(EMPTY_FILTERS);

  const rows = useMemo(() => {
    const query = filters.clientId.trim().toLowerCase();
    return c1Participants.filter((p) => {
      if (
        query &&
        !p.clientId.toLowerCase().includes(query) &&
        !p.businessName.toLowerCase().includes(query)
      ) {
        return false;
      }
      if (filters.onboardingStatus !== 'ALL' && p.onboardingStatus !== filters.onboardingStatus) return false;
      if (filters.linkedAccount !== 'ALL' && p.linkedAccount !== filters.linkedAccount) return false;
      const zeroBalance = p.balance === '$0.00';
      if (filters.hasBalance === 'YES' && zeroBalance) return false;
      if (filters.hasBalance === 'NO' && !zeroBalance) return false;
      if (filters.startDate && p.createdDate < filters.startDate) return false;
      if (filters.endDate && p.createdDate > filters.endDate) return false;
      return true;
    });
  }, [filters]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-sp-ink" style={HEADING}>
        Platform participants
      </h1>
      <SearchFilter onSearch={setFilters} />
      <div className="h-px w-full bg-sp-border" />
      <DataTable rows={rows} onRowClick={onSelect} />
    </div>
  );
}

// --------------------------------------------------------------------------
// View 2 — Participant accounts (drill-down)
// --------------------------------------------------------------------------

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-slate-500">{label}:</span>
      <span className="text-sp-ink">{value}</span>
    </div>
  );
}

function AccountCard({ account, onClick }: { account: C1Account; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="min-w-[280px] max-w-[360px] flex-1 basis-[300px] cursor-pointer border-sp-border transition-shadow hover:shadow-md"
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-semibold text-sp-ink">{categoryLabel(account.category)}</span>
          <StatusBadge status={account.state} />
        </div>
        <DetailRow label="Account Number" value={mask(account.accountNumber)} />
        <DetailRow label="Balance" value={account.balance} />
        <DetailRow label="Transactions" value={account.transactionCount} />
        <DetailRow
          label="PRN Status"
          value={
            <span
              className={cn(
                'font-medium',
                account.prnStatus === 'ACTIVE' ? 'text-emerald-700' : 'text-amber-700',
              )}
            >
              {account.prnStatus}
            </span>
          }
        />
        <DetailRow label="ABA Routing" value={account.abaRouting} />
        <div className="mt-3 flex items-center justify-end text-xs font-medium text-sp-brand-700">
          View account <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </CardContent>
    </Card>
  );
}

function ParticipantAccountsView({
  participant,
  onBack,
  onOpenAccount,
}: {
  participant: C1Participant;
  onBack: () => void;
  onOpenAccount: (account: C1Account) => void;
}) {
  const { accounts } = participant;

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb items={[{ label: 'Participants', onClick: onBack }, { label: participant.businessName }]} />

      <div className="flex flex-col gap-2 border-b border-sp-border pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-sp-ink" style={HEADING}>
            {participant.businessName}
          </h1>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">ID: {participant.clientId}</span>
          <StatusBadge status={participant.onboardingStatus} />
        </div>
        <div className="text-sm text-slate-500">Accounts: {accounts.length}</div>
      </div>

      {accounts.length === 0 ? (
        <p className="text-slate-500">No accounts available for this participant.</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} onClick={() => onOpenAccount(account)} />
          ))}
        </div>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// Participant details (parties + linked bank account) — non-approved drill-down
// --------------------------------------------------------------------------

function humanizeDocType(type: string) {
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function PartyCard({ entity }: { entity: C1OutstandingDocument }) {
  const outstanding = (entity.documentRequests ?? [])
    .filter((dr) => dr.status === 'ACTIVE')
    .flatMap((dr) => dr.outstanding?.documentTypes ?? []);
  return (
    <Card className="min-w-[240px] max-w-[320px] flex-1 basis-[260px] border-sp-border">
      <CardContent className="p-5">
        <div className="font-semibold text-sp-ink">{entity.entityName}</div>
        <div className="mb-3 text-sm text-slate-500">{entity.entityRole}</div>
        <StatusBadge status={entity.profileStatus} />
        {outstanding.length > 0 && (
          <div className="mt-3 text-xs text-slate-500">
            Outstanding: {outstanding.map(humanizeDocType).join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ParticipantDetailsView({
  participant,
  onBack,
}: {
  participant: C1Participant;
  onBack: () => void;
}) {
  const entities = participant.outstandingDocuments ?? [];
  const link = deriveLinkedAccountStatus(participant.linkedAccountAttempts);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb items={[{ label: 'Participants', onClick: onBack }, { label: participant.businessName }]} />

      <div className="flex flex-col gap-2 border-b border-sp-border pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-sp-ink" style={HEADING}>
            {participant.businessName}
          </h1>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">ID: {participant.clientId}</span>
          <StatusBadge status={participant.onboardingStatus} />
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-sp-ink" style={HEADING}>
          Entity Onboarding
        </h2>
        {entities.length === 0 ? (
          <p className="text-slate-500">No onboarding parties available.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {entities.map((entity) => (
              <PartyCard key={entity.entityName} entity={entity} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-sp-ink" style={HEADING}>
          Linked Bank Account
        </h2>
        {link.attemptCount === 0 || !link.account ? (
          <p className="text-slate-500">No linked bank account.</p>
        ) : (
          <Card className="max-w-[420px] border-sp-border">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold text-sp-ink">Linked Account</span>
                <StatusBadge status={link.status} />
              </div>
              <DetailRow label="Account Number" value={mask(link.account.accountNumber)} />
              <DetailRow label="ACH Routing" value={link.account.achRouting} />
              <DetailRow label="Linked Date" value={formatDate(link.account.linkedDate)} />
              {link.detail && <div className="mt-2 text-xs text-slate-500">{link.detail}</div>}
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

// --------------------------------------------------------------------------
// Platform accounts view
// --------------------------------------------------------------------------

const CATEGORY_ACCENT: Record<string, string> = {
  PROCESSING: 'text-sp-brand-700',
  PROCESSING_OFFSET: 'text-indigo-700',
  CLIENT_OFFSET: 'text-violet-700',
  MANAGEMENT: 'text-amber-700',
};

function PlatformAccountCard({
  account,
  onClick,
}: {
  account: C1PlatformAccount;
  onClick: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className="min-w-[280px] max-w-[360px] flex-1 basis-[300px] cursor-pointer border-sp-border transition-shadow hover:shadow-md"
    >
      <CardContent className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <span
            className={cn(
              'text-xs font-semibold uppercase tracking-wide',
              CATEGORY_ACCENT[account.accountCategory],
            )}
          >
            {PLATFORM_ACCOUNT_CATEGORY_LABELS[account.accountCategory]}
          </span>
          <StatusBadge status={account.accountState} />
        </div>
        <div className="mb-3 font-semibold text-sp-ink">Account {mask(account.accountNumber)}</div>
        <DetailRow label="EOD Balance" value={formatUsd(account.endOfDayBalance)} />
        <DetailRow label="ACH Routing" value={account.achRouting} />
        <DetailRow label="Wire Routing" value={account.wireRouting} />
        <DetailRow label="Supports" value={account.transactionTypes.join(', ')} />
        <div className="mt-3 flex items-center justify-end text-xs font-medium text-sp-brand-700">
          View account <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformAccountsView({
  onOpenAccount,
}: {
  onOpenAccount: (account: C1PlatformAccount) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3 border-b border-sp-border pb-4">
        <h1 className="text-2xl font-semibold text-sp-ink" style={HEADING}>
          Platform Processing Accounts
        </h1>
        <StatusBadge status="Active" />
      </div>
      <div className="flex flex-wrap gap-4">
        {c1PlatformAccounts.map((account) => (
          <PlatformAccountCard
            key={account.accountId}
            account={account}
            onClick={() => onOpenAccount(account)}
          />
        ))}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// Account detail (overview bar + transactions) — shared drill-down
// --------------------------------------------------------------------------

interface AccountDetailData {
  breadcrumb: Array<{ label: string; onClick?: () => void }>;
  title: string;
  status: string;
  balanceLabel: string;
  balance: string;
  accountNumber: string;
  achRouting: string;
  wireRouting?: string;
  metrics: Array<{ label: string; value: ReactNode }>;
  transactions: C1Transaction[];
  recipients?: C1Recipient[];
}

function CopyableAccountNumber({ accountNumber }: { accountNumber: string }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular-nums text-sp-ink">{show ? accountNumber : mask(accountNumber)}</span>
      <button type="button" onClick={() => setShow((s) => !s)} aria-label="Toggle account number">
        {show ? (
          <EyeOff className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
        ) : (
          <Eye className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
        )}
      </button>
      <button type="button" onClick={copy} aria-label="Copy account number">
        <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
      </button>
      {copied && <span className="text-xs text-emerald-600">Copied</span>}
    </span>
  );
}

function OverviewBar({ data }: { data: AccountDetailData }) {
  return (
    <div className="rounded-md border border-sp-border bg-white p-5">
      <div className="flex flex-wrap items-stretch gap-6">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wide text-slate-500">{data.balanceLabel}</span>
          <span className="text-3xl font-semibold text-sp-ink" style={HEADING}>
            {data.balance}
          </span>
          <span className="text-xs text-slate-400">As of {AS_OF}</span>
        </div>
        {data.metrics.map((metric) => (
          <div key={metric.label} className="flex items-stretch gap-6">
            <div className="w-px bg-slate-200" />
            <div className="flex flex-col justify-center">
              <span className="text-xs uppercase tracking-wide text-slate-500">{metric.label}</span>
              <span className="text-lg font-semibold text-sp-ink">{metric.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-slate-100 pt-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Account Number:</span>
          <CopyableAccountNumber accountNumber={data.accountNumber} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">ACH Routing:</span>
          <span className="text-sp-ink">{data.achRouting}</span>
        </div>
        {data.wireRouting && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Wire Routing:</span>
            <span className="text-sp-ink">{data.wireRouting}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Status:</span>
          <StatusBadge status={data.status} />
        </div>
      </div>
    </div>
  );
}

type TxnKey = keyof Pick<
  C1Transaction,
  | 'createdDate'
  | 'transactionId'
  | 'transactionReferenceId'
  | 'fromAccount'
  | 'toAccount'
  | 'status'
  | 'type'
  | 'amount'
  | 'currency'
>;

interface TxnColumn {
  key: TxnKey;
  label: string;
  align: 'left' | 'right';
  kind: 'text' | 'date' | 'status' | 'amount';
}

const TXN_COLUMNS: TxnColumn[] = [
  { key: 'createdDate', label: 'Created Date', align: 'left', kind: 'date' },
  { key: 'transactionId', label: 'Transaction ID', align: 'left', kind: 'text' },
  { key: 'transactionReferenceId', label: 'Transaction Reference ID', align: 'left', kind: 'text' },
  { key: 'fromAccount', label: 'From Account', align: 'left', kind: 'text' },
  { key: 'toAccount', label: 'To Account', align: 'left', kind: 'text' },
  { key: 'status', label: 'Status', align: 'left', kind: 'status' },
  { key: 'type', label: 'Type', align: 'left', kind: 'text' },
  { key: 'amount', label: 'Amount', align: 'right', kind: 'amount' },
  { key: 'currency', label: 'Currency', align: 'left', kind: 'text' },
];

function TransactionsTable({ transactions }: { transactions: C1Transaction[] }) {
  const [sortKey, setSortKey] = useState<TxnKey>('createdDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const sorted = useMemo(() => {
    const col = TXN_COLUMNS.find((c) => c.key === sortKey)!;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...transactions].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (col.kind === 'amount') return (toNumber(av) - toNumber(bv)) * dir;
      if (col.kind === 'date') return (toDate(av) - toDate(bv)) * dir;
      return String(av).localeCompare(String(bv)) * dir;
    });
  }, [transactions, sortKey, sortDir]);

  const toggleSort = (key: TxnKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const total = sorted.length;
  const paged = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [transactions, pageSize]);

  return (
    <div className="overflow-hidden rounded-md border border-sp-border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-sp-border bg-sp-bg text-left text-xs uppercase tracking-wide text-slate-500">
              {TXN_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={cn('px-4 py-3 font-semibold', col.align === 'right' && 'text-right')}
                >
                  <SortHeaderButton
                    label={col.label}
                    active={sortKey === col.key}
                    dir={sortDir}
                    align={col.align}
                    onClick={() => toggleSort(col.key)}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((txn) => (
              <tr key={txn.id} className="border-b border-slate-100 last:border-b-0 hover:bg-sp-accent/40">
                {TXN_COLUMNS.map((col) => {
                  const value = txn[col.key];
                  if (col.kind === 'status') {
                    return (
                      <td key={col.key} className="px-4 py-3">
                        <StatusBadge status={value} />
                      </td>
                    );
                  }
                  if (col.kind === 'amount') {
                    const negative = value.trim().startsWith('-');
                    return (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 text-right font-medium tabular-nums',
                          negative ? 'text-red-600' : 'text-emerald-700',
                        )}
                      >
                        {value}
                      </td>
                    );
                  }
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-slate-600',
                        col.key === 'transactionId' && 'font-medium text-sp-brand-700',
                        (col.key === 'fromAccount' || col.key === 'toAccount') && 'tabular-nums',
                      )}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
            {total === 0 && (
              <tr>
                <td colSpan={TXN_COLUMNS.length} className="px-4 py-10 text-center text-slate-500">
                  No transactions for this account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageSize={pageSize} total={total} onPage={setPage} onPageSize={setPageSize} />
    </div>
  );
}

const recipientDisplayName = (r: C1Recipient) => {
  const p = r.partyDetails;
  return p.businessName || [p.firstName, p.lastName].filter(Boolean).join(' ') || '\u2014';
};

const recipientRails = (r: C1Recipient) =>
  (r.account?.routingInformation ?? []).map((ri) => ri.transactionType).join(', ') || '\u2014';

function RecipientsTable({ recipients }: { recipients: C1Recipient[] }) {
  return (
    <div className="overflow-hidden rounded-md border border-sp-border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-sp-border bg-sp-bg text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">Recipient Name</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Account</th>
              <th className="px-4 py-3 font-semibold">Rails</th>
            </tr>
          </thead>
          <tbody>
            {recipients.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-b-0 hover:bg-sp-accent/40">
                <td className="px-4 py-3 text-sp-ink">{recipientDisplayName(r)}</td>
                <td className="px-4 py-3 capitalize text-slate-600">
                  {(r.type ?? '').toLowerCase().replace(/_/g, ' ')}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-600">{mask(r.account?.number ?? '')}</td>
                <td className="px-4 py-3 text-slate-600">{recipientRails(r)}</td>
              </tr>
            ))}
            {recipients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No recipients.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountDetailView({ data }: { data: AccountDetailData }) {
  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb items={data.breadcrumb} />
      <div className="flex flex-wrap items-center gap-3 border-b border-sp-border pb-4">
        <h1 className="text-2xl font-semibold text-sp-ink" style={HEADING}>
          {data.title}
        </h1>
        <StatusBadge status={data.status} />
      </div>
      <OverviewBar data={data} />
      <div className="flex items-center gap-2 pt-1">
        <h2 className="text-lg font-semibold text-sp-ink" style={HEADING}>
          Transactions
        </h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Info className="h-3.5 w-3.5" />
          {INFO_TEXT}
        </div>
      </div>
      <TransactionsTable transactions={data.transactions} />

      {data.recipients && data.recipients.length > 0 && (
        <>
          <h2 className="pt-1 text-lg font-semibold text-sp-ink" style={HEADING}>
            Recipients
          </h2>
          <RecipientsTable recipients={data.recipients} />
        </>
      )}
    </div>
  );
}

// --------------------------------------------------------------------------
// App shell (header + sidebar) — mirrors the C1 standalone MainLayout
// --------------------------------------------------------------------------

type Section = 'participants' | 'platform-account';

function Sidebar({
  active,
  onNavigate,
}: {
  active: Section;
  onNavigate: (section: Section) => void;
}) {
  const items: Array<{ icon: typeof Home; label: string; section?: Section }> = [
    { icon: Home, label: 'Home' },
    { icon: Users, label: 'Platform Participants', section: 'participants' },
    { icon: CreditCard, label: 'Platform Account', section: 'platform-account' },
  ];
  return (
    <nav className="w-56 shrink-0 border-r border-sp-border bg-white py-4" aria-label="Main navigation">
      {items.map(({ icon: Icon, label, section }) => {
        const isActive = section === active;
        return (
          <button
            key={label}
            type="button"
            disabled={!section}
            onClick={() => section && onNavigate(section)}
            className={cn(
              'flex w-full items-center gap-3 border-l-2 px-5 py-2.5 text-left text-sm',
              isActive
                ? 'border-sp-brand bg-sp-accent/60 font-medium text-sp-brand-700'
                : 'border-transparent text-slate-600 hover:bg-slate-50',
              !section && 'cursor-default opacity-60 hover:bg-transparent',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-sp-border bg-white px-4">
      <div className="flex items-center gap-3">
        <Menu className="h-5 w-5 text-slate-500" />
        <span className="text-lg font-semibold tracking-tight text-sp-ink" style={HEADING}>
          J.P.Morgan
        </span>
        <span className="text-slate-300">|</span>
        <span className="text-sm text-slate-500">Digital Enablement</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-slate-400 sm:inline">
          {C1_PLATFORM.name} · {C1_PLATFORM.id}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sp-accent text-sp-brand-700">
          <User className="h-4 w-4" />
        </span>
      </div>
    </header>
  );
}

// --------------------------------------------------------------------------
// Orchestrator
// --------------------------------------------------------------------------

export function C1Showcase() {
  const [section, setSection] = useState<Section>('participants');
  const [participant, setParticipant] = useState<C1Participant | null>(null);
  const [account, setAccount] = useState<AccountDetailData | null>(null);

  const goParticipants = () => {
    setSection('participants');
    setParticipant(null);
    setAccount(null);
  };
  const goPlatformAccounts = () => {
    setSection('platform-account');
    setParticipant(null);
    setAccount(null);
  };
  const navigate = (next: Section) =>
    next === 'participants' ? goParticipants() : goPlatformAccounts();

  const openParticipantAccount = (p: C1Participant, acc: C1Account) => {
    setAccount({
      breadcrumb: [
        { label: 'Participants', onClick: goParticipants },
        { label: p.businessName, onClick: () => setAccount(null) },
        { label: `Account ${mask(acc.accountNumber)}` },
      ],
      title: `Account ${mask(acc.accountNumber)}`,
      status: acc.state,
      balanceLabel: `Balance · ${categoryLabel(acc.category)}`,
      balance: acc.balance,
      accountNumber: acc.accountNumber,
      achRouting: acc.abaRouting,
      metrics: [
        { label: 'Transactions', value: acc.transactionCount },
        {
          label: 'PRN Status',
          value: (
            <span className={acc.prnStatus === 'ACTIVE' ? 'text-emerald-700' : 'text-amber-700'}>
              {acc.prnStatus}
            </span>
          ),
        },
      ],
      transactions: c1Transactions.filter(
        (t) => t.fromAccount === mask(acc.accountNumber) || t.toAccount === mask(acc.accountNumber),
      ),
      recipients: (c1Recipients[p.clientId] ?? []).filter((r) => r.type !== 'LINKED_ACCOUNT'),
    });
  };

  const openPlatformAccount = (acc: C1PlatformAccount) => {
    setAccount({
      breadcrumb: [
        { label: 'Platform Processing Accounts', onClick: goPlatformAccounts },
        { label: `Account ${mask(acc.accountNumber)}` },
      ],
      title: `Account ${mask(acc.accountNumber)}`,
      status: acc.accountState,
      balanceLabel: `Balance · ${PLATFORM_ACCOUNT_CATEGORY_LABELS[acc.accountCategory]}`,
      balance: formatUsd(acc.endOfDayBalance),
      accountNumber: acc.accountNumber,
      achRouting: acc.achRouting,
      wireRouting: acc.wireRouting,
      metrics: [
        { label: 'Total Payin', value: C1_PLATFORM_SUMMARY.totalPayin },
        { label: 'Total Payout', value: C1_PLATFORM_SUMMARY.totalPayout },
      ],
      transactions: c1Transactions,
    });
  };

  let content: ReactNode;
  if (account) {
    content = <AccountDetailView data={account} />;
  } else if (section === 'participants') {
    content = participant ? (
      participant.accounts.length > 0 ? (
        <ParticipantAccountsView
          participant={participant}
          onBack={goParticipants}
          onOpenAccount={(acc) => openParticipantAccount(participant, acc)}
        />
      ) : (
        <ParticipantDetailsView participant={participant} onBack={goParticipants} />
      )
    ) : (
      <ParticipantsView onSelect={setParticipant} />
    );
  } else {
    content = <PlatformAccountsView onOpenAccount={openPlatformAccount} />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-sp-bg" style={{ fontFamily: BODY_FONT }}>
      <Header />
      <div className="flex flex-1">
        <Sidebar active={section} onNavigate={navigate} />
        <main className="flex-1 p-6">
          <div className="rounded-md border border-sp-border bg-white p-6 shadow-sm">{content}</div>
        </main>
      </div>
    </div>
  );
}
