import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronsRight,
  Download,
  FileSpreadsheet,
  HelpCircle,
  LayoutList,
  Lock,
  Plus,
  Search,
  Sheet,
  Trash2,
  Upload,
  Wand2,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildCsvFiles,
  buildCsvRows,
  buildSpreadsheetTemplate,
  getCsvHeaders,
  type ImportResult,
} from '@/lib/client-bulk-upload/csv';
import {
  DETAIL_GROUPS,
  isGroupUsed,
  type DetailGroupId,
} from '@/lib/client-bulk-upload/details';
import { createClient, isClientBlank } from '@/lib/client-bulk-upload/model';
import { normalizeKey } from '@/lib/client-bulk-upload/normalize';
import { buildSheetColumns } from '@/lib/client-bulk-upload/sheet-columns';
import {
  builderReducer,
  createInitialState,
} from '@/lib/client-bulk-upload/state';
import {
  getClientValidation,
  validateClients,
  type IssueFix,
} from '@/lib/client-bulk-upload/validate';
import { cn } from '@/lib/utils';

import { ColumnsPicker } from './columns-picker';
import { FilePreview } from './file-preview';
import { FormView } from './form-view';
import { GuidedTour } from './guided-tour';
import { ImportDialog } from './import-dialog';
import { Instructions, STEPS } from './instructions';
import { ReviewDialog } from './review-dialog';
import { SpreadsheetView, type VisibleClient } from './spreadsheet-view';
import { CLIENT_TOUR_STEPS, markTourSeen, readTourSeen } from './tour-steps';

const PAGE_SIZE = 50;
const PAGE_TITLE = 'Bulk client upload builder';

type Tab = 'clients' | 'preview' | 'instructions';
type View = 'spreadsheet' | 'form';

interface Notice {
  tone: 'success' | 'error' | 'info';
  message: ReactNode;
}

function focusFirstCell() {
  document
    .querySelector<HTMLElement>('[data-row="0"][data-col="0"]')
    ?.focus({ preventScroll: true });
}

function downloadText(fileName: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function useDocumentSetup(dirty: boolean) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = PAGE_TITLE;
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    return () => {
      document.title = previousTitle;
      robots.remove();
    };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
}

function SegmentedButton({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors',
        pressed
          ? 'bg-white text-jpm-gray-900 shadow-sm'
          : 'text-jpm-gray-600 hover:text-jpm-gray-900'
      )}
    >
      {children}
    </button>
  );
}

export function ClientBulkUploadPage() {
  const [state, dispatch] = useReducer(
    builderReducer,
    undefined,
    createInitialState
  );
  const [tab, setTab] = useState<Tab>('clients');
  const [view, setView] = useState<View>('spreadsheet');
  const [issueSnapshot, setIssueSnapshot] = useState<Set<string> | null>(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [tourOpen, setTourOpen] = useState(false);
  const [enabledGroups, setEnabledGroups] = useState<Set<DetailGroupId>>(
    () => new Set()
  );

  useEffect(() => {
    focusFirstCell();
    if (!readTourSeen()) setTourOpen(true);
  }, []);

  const summary = useMemo(
    () => validateClients(state.clients),
    [state.clients]
  );
  const hasData = summary.activeClientCount > 0;
  useDocumentSetup(state.dirty && hasData);

  // Column groups that hold data (business, or the authorized user shown in
  // the grid) always stay visible so nothing is hidden.
  const groupsInUse = useMemo(() => {
    const used = new Set<DetailGroupId>();
    for (const client of state.clients) {
      for (const group of DETAIL_GROUPS) {
        const values =
          group.party === 'business'
            ? client.details
            : client.people[0]?.details;
        if (isGroupUsed(values, group.id)) used.add(group.id);
      }
    }
    return used;
  }, [state.clients]);
  const visibleGroupsKey = DETAIL_GROUPS.filter(
    (group) => enabledGroups.has(group.id) || groupsInUse.has(group.id)
  )
    .map((group) => group.id)
    .join(',');
  const columns = useMemo(
    () =>
      buildSheetColumns(
        new Set(
          (visibleGroupsKey
            ? visibleGroupsKey.split(',')
            : []) as DetailGroupId[]
        )
      ),
    [visibleGroupsKey]
  );
  const columnIds = useMemo(() => columns.map((c) => c.id), [columns]);

  const toggleGroup = (group: DetailGroupId, on: boolean) =>
    setEnabledGroups((current) => {
      const next = new Set(current);
      if (on) next.add(group);
      else next.delete(group);
      return next;
    });

  const openDetails = useCallback((clientId: string) => {
    setSelectedId(clientId);
    setView('form');
  }, []);

  const allItems = useMemo<VisibleClient[]>(
    () =>
      state.clients.map((client, index) => ({
        client,
        rowNumber: index + 1,
        validation: getClientValidation(summary, client.id),
      })),
    [state.clients, summary]
  );

  const filtered = useMemo(() => {
    const needle = normalizeKey(query);
    return allItems.filter(({ client }) => {
      if (issueSnapshot && !issueSnapshot.has(client.id)) return false;
      if (!needle) return true;
      const haystack = normalizeKey(
        [
          client.externalId,
          client.organizationName,
          client.email,
          ...client.people.flatMap((p) => [p.firstName, p.lastName, p.email]),
        ].join(' ')
      );
      return haystack.includes(needle);
    });
  }, [allItems, issueSnapshot, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );
  const orderedIds = useMemo(
    () => filtered.map((item) => item.client.id),
    [filtered]
  );

  const reviewFiles = useMemo(
    () => (reviewOpen ? buildCsvFiles(state.clients) : []),
    [reviewOpen, state.clients]
  );
  const previewRows = useMemo(
    () => (tab === 'preview' ? buildCsvRows(state.clients) : []),
    [tab, state.clients]
  );
  const previewHeaders = useMemo(
    () => getCsvHeaders(previewRows),
    [previewRows]
  );

  const issueIds = useCallback(
    (includeWarnings: boolean) =>
      new Set(
        allItems
          .filter(
            ({ validation }) =>
              validation.errorCount > 0 ||
              (includeWarnings && validation.warningCount > 0)
          )
          .map(({ client }) => client.id)
      ),
    [allItems]
  );

  const showIssuesOnly = (includeWarnings = true) => {
    setIssueSnapshot(issueIds(includeWarnings));
    setPage(0);
    setTab('clients');
  };

  const showAll = () => {
    setIssueSnapshot(null);
    setPage(0);
  };

  const applyAllFixes = () => {
    const fixes: { clientId: string; fix: IssueFix }[] = [];
    summary.byClientId.forEach((validation, clientId) =>
      validation.issues.forEach((issue) => {
        if (issue.fix) fixes.push({ clientId, fix: issue.fix });
      })
    );
    dispatch({ type: 'applyFixes', fixes });
    setNotice({
      tone: 'success',
      message: `Applied ${fixes.length} suggested fix${fixes.length === 1 ? '' : 'es'} (accents and special characters, dropped leading zeros). Check the names still match the legal names.`,
    });
  };

  const handleImport = (result: ImportResult, mode: 'append' | 'replace') => {
    dispatch({ type: 'import', clients: result.clients, mode });
    setIssueSnapshot(null);
    setQuery('');
    setPage(0);
    setSelectedId(result.clients[0]?.id ?? null);
    setNotice({
      tone: 'info',
      message: `Imported ${result.clients.length} client${result.clients.length === 1 ? '' : 's'}. Anything that still needs attention is highlighted.`,
    });
  };

  const handleHeaderPaste = useCallback((text: string) => {
    setImportText(text);
    setImportOpen(true);
  }, []);

  const startTour = () => {
    setTab('clients');
    setView('spreadsheet');
    setIssueSnapshot(null);
    setQuery('');
    setPage(0);
    setTourOpen(true);
    window.setTimeout(focusFirstCell, 50);
  };

  const closeTour = useCallback(() => {
    setTourOpen(false);
    markTourSeen();
    document
      .querySelector<HTMLElement>('[data-grid-scroll]')
      ?.scrollTo?.({ left: 0, behavior: 'smooth' });
    focusFirstCell();
  }, []);

  const addClient = () => {
    const client = createClient();
    dispatch({ type: 'appendClient', client });
    setIssueSnapshot(null);
    setQuery('');
    setSelectedId(client.id);
    setPage(Math.ceil((state.clients.length + 1) / PAGE_SIZE) - 1);
  };

  const startDownload = () => {
    if (!hasData) return;
    if (summary.errorCount > 0) {
      dispatch({ type: 'revealAllErrors' });
      showIssuesOnly(false);
      setNotice({
        tone: 'error',
        message: `Fix ${summary.errorCount} problem${summary.errorCount === 1 ? '' : 's'} in ${summary.clientsWithErrors} client${summary.clientsWithErrors === 1 ? '' : 's'} before downloading. Only those clients are shown below.`,
      });
      return;
    }
    setReviewOpen(true);
  };

  const download = () => {
    reviewFiles.forEach((file, index) =>
      window.setTimeout(
        () => downloadText(file.fileName, file.content),
        index * 400
      )
    );
    dispatch({ type: 'markSaved' });
    setReviewOpen(false);
    setNotice({
      tone: 'success',
      message: (
        <>
          <strong>
            Downloaded {reviewFiles.map((file) => file.fileName).join(', ')}.
          </strong>{' '}
          Next: open the file and check it before you send it — it is used as
          provided. Share it only through the secure method agreed with your
          J.P. Morgan contact.
        </>
      ),
    });
  };

  const clearAll = () => {
    if (
      !window.confirm(
        'Remove all clients from this list? This can’t be undone.'
      )
    )
      return;
    dispatch({ type: 'clearAll' });
    setIssueSnapshot(null);
    setQuery('');
    setPage(0);
    setNotice(null);
  };

  const remainingInSnapshot = issueSnapshot
    ? filtered.filter(
        ({ validation }) =>
          validation.errorCount > 0 || validation.warningCount > 0
      ).length
    : 0;

  return (
    <div className="min-h-screen bg-sp-bg pb-28">
      <header className="border-b border-jpm-gray-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-sp-brand">
                Embedded Payments · Client onboarding
              </p>
              <h1 className="mt-1 text-page-h2 font-bold text-jpm-gray-900">
                {PAGE_TITLE}
              </h1>
              <p className="mt-2 max-w-3xl text-page-body text-jpm-gray-700">
                Build the bulk upload file for your clients without editing CSV
                columns. Enter each business and the person who will complete
                onboarding — the tool checks the upload rules and creates the
                file.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <Lock className="size-3.5" aria-hidden />
              Runs in your browser — nothing is uploaded
            </span>
          </div>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li
                key={step.title}
                className={cn(
                  'flex gap-3 rounded-lg border p-3',
                  index === STEPS.length - 1
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-jpm-gray-200 bg-jpm-gray-50'
                )}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-sp-brand text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span className="text-sm">
                  <span className="block font-semibold text-jpm-gray-900">
                    {step.title}
                  </span>
                  <span className="text-jpm-gray-600">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        {notice ? (
          <div
            role={notice.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-3 text-sm',
              notice.tone === 'success' &&
                'border-emerald-200 bg-emerald-50 text-emerald-900',
              notice.tone === 'error' &&
                'border-red-200 bg-red-50 text-red-900',
              notice.tone === 'info' &&
                'border-sp-brand/30 bg-sp-accent text-jpm-gray-900'
            )}
          >
            {notice.tone === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : notice.tone === 'error' ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            ) : (
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-sp-brand"
                aria-hidden
              />
            )}
            <div className="flex-1">{notice.message}</div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="rounded p-0.5 opacity-70 hover:opacity-100"
              aria-label="Dismiss message"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)}>
          <TabsList>
            <TabsTrigger value="clients">
              Clients
              {hasData
                ? ` (${summary.activeClientCount.toLocaleString()})`
                : ''}
            </TabsTrigger>
            <TabsTrigger value="preview">File preview</TabsTrigger>
            <TabsTrigger value="instructions">Instructions</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={addClient}>
                <Plus aria-hidden />
                Add client
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-tour="import-button"
                onClick={() => {
                  setImportText('');
                  setImportOpen(true);
                }}
              >
                <Upload aria-hidden />
                Import file or rows
              </Button>
              <ColumnsPicker
                enabled={enabledGroups}
                inUse={groupsInUse}
                onToggle={(group, on) => {
                  toggleGroup(group, on);
                  if (on) setView('spreadsheet');
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="text-sp-brand hover:text-sp-brand-700"
                onClick={startTour}
              >
                <HelpCircle aria-hidden />
                Show me how
              </Button>
              {summary.fixableCount > 0 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={applyAllFixes}
                >
                  <Wand2 aria-hidden />
                  Apply {summary.fixableCount} suggested fix
                  {summary.fixableCount === 1 ? '' : 'es'}
                </Button>
              ) : null}

              <div className="ml-auto flex flex-wrap items-center gap-2">
                <div
                  className="inline-flex rounded-md bg-jpm-gray-100 p-1"
                  role="group"
                  aria-label="Layout"
                >
                  <SegmentedButton
                    pressed={view === 'spreadsheet'}
                    onClick={() => setView('spreadsheet')}
                  >
                    <Sheet className="size-4" aria-hidden />
                    Spreadsheet
                  </SegmentedButton>
                  <SegmentedButton
                    pressed={view === 'form'}
                    onClick={() => setView('form')}
                  >
                    <LayoutList className="size-4" aria-hidden />
                    One at a time
                  </SegmentedButton>
                </div>
                <div
                  className="inline-flex rounded-md bg-jpm-gray-100 p-1"
                  role="group"
                  aria-label="Filter"
                >
                  <SegmentedButton pressed={!issueSnapshot} onClick={showAll}>
                    All
                  </SegmentedButton>
                  <SegmentedButton
                    pressed={!!issueSnapshot}
                    onClick={() => showIssuesOnly(true)}
                  >
                    Needs attention (
                    {summary.clientsWithErrors + summary.clientsWithWarnings})
                  </SegmentedButton>
                </div>
                <label className="relative">
                  <span className="sr-only">Search clients</span>
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-jpm-gray-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(0);
                    }}
                    placeholder="Search ID, name or email"
                    className="h-9 w-56 rounded-md border border-jpm-gray-300 bg-white pl-8 pr-2 text-sm focus:border-sp-brand focus:outline-none focus:ring-2 focus:ring-sp-brand/20"
                  />
                </label>
              </div>
            </div>

            {view === 'spreadsheet' ? (
              <p className="flex flex-wrap items-center gap-x-1 text-xs text-jpm-gray-600">
                <strong>Tip:</strong> copy rows in Excel and paste them into any
                cell (Ctrl+V) — values fill to the right in the column order
                shown. Press Enter to move down. Fields marked{' '}
                <span className="text-red-600">*</span> are required.
                <span className="inline-flex items-center gap-1 font-medium text-jpm-gray-800">
                  <ChevronsRight className="size-3.5" aria-hidden />
                  The table continues to the right — scroll sideways for the
                  authorized user and roles.
                </span>
              </p>
            ) : null}

            {issueSnapshot &&
            remainingInSnapshot === 0 &&
            filtered.length > 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                <CheckCircle2 className="size-4" aria-hidden />
                Everything in this list is fixed.
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={showAll}
                >
                  Show all clients
                </Button>
              </div>
            ) : null}

            {view === 'spreadsheet' ? (
              <SpreadsheetView
                rows={pageItems}
                columns={columns}
                orderedIds={orderedIds}
                showAllErrors={state.showAllErrors}
                canAppendOnEnter={
                  !issueSnapshot &&
                  !query &&
                  currentPage === pageCount - 1 &&
                  pageItems.length < PAGE_SIZE
                }
                dispatch={dispatch}
                onHeaderPaste={handleHeaderPaste}
                onOpenDetails={openDetails}
              />
            ) : (
              <FormView
                items={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onAddClient={addClient}
                showAllErrors={state.showAllErrors}
                dispatch={dispatch}
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-jpm-gray-600">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    downloadText(
                      'client-bulk-upload-spreadsheet-template.csv',
                      buildSpreadsheetTemplate(columns)
                    )
                  }
                  title="A CSV with one column per field shown here, for collecting details in Excel before importing them"
                >
                  <FileSpreadsheet aria-hidden />
                  Blank spreadsheet template
                </Button>
                {state.clients.some(isClientBlank) &&
                state.clients.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => dispatch({ type: 'removeBlankClients' })}
                  >
                    Remove empty rows
                  </Button>
                ) : null}
                {hasData ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="hover:text-red-700"
                    onClick={clearAll}
                  >
                    <Trash2 aria-hidden />
                    Clear all
                  </Button>
                ) : null}
              </div>
              {view === 'spreadsheet' && pageCount > 1 ? (
                <nav className="flex items-center gap-2" aria-label="Pages">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {currentPage + 1} of {pageCount}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= pageCount - 1}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </nav>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <FilePreview
              rows={previewRows}
              headers={previewHeaders}
              errorCount={summary.errorCount}
            />
          </TabsContent>

          <TabsContent value="instructions">
            <Instructions />
          </TabsContent>
        </Tabs>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-jpm-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {!hasData ? (
              <span className="text-jpm-gray-600">
                Add your first client to get started.
              </span>
            ) : (
              <>
                <span className="text-jpm-gray-700">
                  {summary.activeClientCount.toLocaleString()} client
                  {summary.activeClientCount === 1 ? '' : 's'} ·{' '}
                  {summary.peopleCount.toLocaleString()}{' '}
                  {summary.peopleCount === 1 ? 'individual' : 'individuals'} ·{' '}
                  {summary.dataRowCount.toLocaleString()} rows
                </span>
                {summary.errorCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => showIssuesOnly(false)}
                    className="inline-flex items-center gap-1.5 font-medium text-red-700 hover:underline"
                  >
                    <AlertCircle className="size-4" aria-hidden />
                    {summary.errorCount} problem
                    {summary.errorCount === 1 ? '' : 's'} in{' '}
                    {summary.clientsWithErrors} client
                    {summary.clientsWithErrors === 1 ? '' : 's'}
                  </button>
                ) : summary.warningCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => showIssuesOnly(true)}
                    className="inline-flex items-center gap-1.5 font-medium text-amber-800 hover:underline"
                  >
                    <AlertTriangle className="size-4" aria-hidden />
                    {summary.warningCount} warning
                    {summary.warningCount === 1 ? '' : 's'} to review
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
                    <CheckCircle2 className="size-4" aria-hidden />
                    Ready to review and download
                  </span>
                )}
              </>
            )}
          </div>
          <Button
            type="button"
            data-tour="download-button"
            onClick={startDownload}
            disabled={!hasData}
          >
            <Download aria-hidden />
            Review and download CSV
          </Button>
        </div>
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        initialText={importText}
        positionalColumns={columnIds}
        hasExistingData={hasData}
        onImport={handleImport}
      />
      <GuidedTour
        steps={CLIENT_TOUR_STEPS}
        open={tourOpen}
        onClose={closeTour}
      />
      <ReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        clientCount={summary.activeClientCount}
        peopleCount={summary.peopleCount}
        files={reviewFiles}
        warningCount={summary.warningCount}
        onShowWarnings={() => {
          setReviewOpen(false);
          showIssuesOnly(true);
        }}
        onOpenPreview={() => {
          setReviewOpen(false);
          setTab('preview');
        }}
        onDownload={download}
      />
    </div>
  );
}
