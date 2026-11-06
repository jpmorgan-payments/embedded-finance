import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type Dispatch,
  type FocusEvent,
  type KeyboardEvent,
} from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ListPlus,
  Trash2,
  UserPlus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  isBulkUploadHeader,
  matchGridHeader,
  parseDelimitedText,
} from '@/lib/client-bulk-upload/csv';
import { getGroup, type DetailGroupId } from '@/lib/client-bulk-upload/details';
import {
  isClientBlank,
  isPersonBlank,
  type ClientDraft,
  type GridColumnKey,
  type PersonField,
} from '@/lib/client-bulk-upload/model';
import type { SheetColumn } from '@/lib/client-bulk-upload/sheet-columns';
import type { BuilderAction } from '@/lib/client-bulk-upload/state';
import type {
  ClientValidation,
  Issue,
} from '@/lib/client-bulk-upload/validate';
import { cn } from '@/lib/utils';

import {
  DetailInput,
  fieldStateClass,
  IssueList,
  issuesFor,
  OrganizationTypeSelect,
  RoleCheckbox,
  StatusIcon,
  visibleIssues,
  worstSeverity,
  type FieldRef,
} from './shared';

export interface VisibleClient {
  client: ClientDraft;
  /** 1-based position in the full list; used in messages and as the row label. */
  rowNumber: number;
  validation: ClientValidation;
}

interface SpreadsheetViewProps {
  rows: VisibleClient[];
  /** Columns to show: core columns plus the optional groups that are on. */
  columns: SheetColumn[];
  /** Every client matching the current filter, in order (paste can spill past the page). */
  orderedIds: string[];
  showAllErrors: boolean;
  canAppendOnEnter: boolean;
  dispatch: Dispatch<BuilderAction>;
  onHeaderPaste: (text: string) => void;
  /** Opens the client in the One-at-a-time view (all details for every person). */
  onOpenDetails: (clientId: string) => void;
}

const BASE_WIDTH: Record<GridColumnKey, string> = {
  externalId: 'w-36',
  organizationName: 'w-60',
  organizationType: 'w-56',
  email: 'w-56',
  firstName: 'w-32',
  middleName: 'w-28',
  lastName: 'w-32',
  personEmail: 'w-56',
  isBeneficialOwner: 'w-24',
};

const BASE_HINT: Partial<Record<GridColumnKey, string>> = {
  externalId: 'Your own unique identifier for this business (1–50 characters)',
  organizationName: 'Legal name of the business',
  email:
    'Email of the controller, used for micro-deposit notifications. Leave blank to use the controller’s email below',
  firstName: 'Legal first name',
  lastName: 'Legal last name',
  personEmail:
    'The controller is sent an email to set up a login and complete onboarding',
  isBeneficialOwner:
    'Tick if the controller also owns 25% or more of the business',
};

const REQUIRED: Partial<Record<GridColumnKey, boolean>> = {
  externalId: true,
  organizationName: true,
  organizationType: true,
  firstName: true,
  lastName: true,
  personEmail: true,
};

const BASE_FIELD_REF: Record<GridColumnKey, FieldRef | null> = {
  externalId: { scope: 'client', field: 'externalId' },
  organizationName: { scope: 'client', field: 'organizationName' },
  organizationType: { scope: 'client', field: 'organizationType' },
  email: { scope: 'client', field: 'email' },
  firstName: { scope: 'person', personIndex: 0, field: 'firstName' },
  middleName: { scope: 'person', personIndex: 0, field: 'middleName' },
  lastName: { scope: 'person', personIndex: 0, field: 'lastName' },
  personEmail: { scope: 'person', personIndex: 0, field: 'email' },
  isBeneficialOwner: null,
};

/** Shown in the first row's empty cells so people see what each field expects. */
const EXAMPLE_PLACEHOLDER: Partial<Record<GridColumnKey, string>> = {
  externalId: 'e.g. S-1001',
  organizationName: 'e.g. Acme Kitchen Supply LLC',
  firstName: 'e.g. Jane',
  lastName: 'e.g. Doe',
  personEmail: 'e.g. jane@acme.com',
};

const PERSON_FIELD_LABEL: Record<PersonField, string> = {
  firstName: 'first name',
  middleName: 'middle name',
  lastName: 'last name',
  email: 'email',
};

/** Row # and Client ID stay visible while scrolling sideways. */
const STICKY_FIRST = 'sticky left-0';
const STICKY_SECOND = 'sticky left-16 border-r border-r-jpm-gray-200';

const cellInputClass =
  'h-8 w-full rounded border border-transparent bg-transparent px-2 text-sm text-jpm-gray-900 placeholder:text-jpm-gray-400 hover:border-jpm-gray-200 focus:border-sp-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-sp-brand/20';

const columnWidth = (column: SheetColumn) =>
  column.detail?.width ?? BASE_WIDTH[column.id as GridColumnKey];

const columnHint = (column: SheetColumn) =>
  column.detail?.hint ?? BASE_HINT[column.id as GridColumnKey];

function fieldRef(column: SheetColumn): FieldRef | null {
  if (column.detail) {
    return column.section === 'business'
      ? { scope: 'client', field: column.detail.id }
      : { scope: 'person', personIndex: 0, field: column.detail.id };
  }
  return BASE_FIELD_REF[column.id as GridColumnKey];
}

function rowIdFrom(element: EventTarget | null): string | null {
  if (!(element instanceof HTMLElement)) return null;
  return (
    element.closest<HTMLElement>('[data-client-row]')?.dataset.clientRow ?? null
  );
}

/** Header groups after the pinned Client ID: core business, each optional group, core person… */
function headerGroups(columns: SheetColumn[]) {
  const groups: {
    key: string;
    span: number;
    group?: DetailGroupId;
    section: SheetColumn['section'];
  }[] = [];
  for (const column of columns.slice(1)) {
    const key = column.group ?? `${column.section}-core`;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.span += 1;
    else
      groups.push({
        key,
        span: 1,
        group: column.group,
        section: column.section,
      });
  }
  return groups;
}

export function SpreadsheetView({
  rows,
  columns,
  orderedIds,
  showAllErrors,
  canAppendOnEnter,
  dispatch,
  onHeaderPaste,
  onOpenDetails,
}: SpreadsheetViewProps) {
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const pendingFocus = useRef<{ row: number; col: number } | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const totalColumns = columns.length + 3;

  const focusCell = useCallback((row: number, col: number): boolean => {
    const element = bodyRef.current?.querySelector<HTMLElement>(
      `[data-row="${row}"][data-col="${col}"]`
    );
    if (!element) return false;
    element.focus();
    if (element instanceof HTMLInputElement && element.type === 'text') {
      element.select();
    }
    return true;
  }, []);

  useEffect(() => {
    if (
      pendingFocus.current &&
      focusCell(pendingFocus.current.row, pendingFocus.current.col)
    ) {
      pendingFocus.current = null;
    }
  });

  const toggleExpanded = useCallback((clientId: string) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }, []);

  const handleKeyDown = (event: KeyboardEvent<HTMLTableSectionElement>) => {
    const target = event.target as HTMLElement;
    if (!target.matches('[data-col]')) return;
    const row = Number(target.dataset.row);
    const col = Number(target.dataset.col);
    const isSelect = target.tagName === 'SELECT';
    let next: number | null = null;
    if (event.key === 'Enter') next = event.shiftKey ? row - 1 : row + 1;
    else if (!isSelect && event.key === 'ArrowDown') next = row + 1;
    else if (!isSelect && event.key === 'ArrowUp') next = row - 1;
    if (next === null) return;
    event.preventDefault();
    if (next < 0 || focusCell(next, col)) return;
    if (event.key === 'Enter' && canAppendOnEnter && next === rows.length) {
      pendingFocus.current = { row: next, col };
      dispatch({ type: 'addClients', count: 1 });
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLTableSectionElement>) => {
    const target = event.target as HTMLElement;
    if (!target.matches('[data-col]')) return;
    const clientId = target.dataset.client ?? '';
    const col = Number(target.dataset.col);
    const text = event.clipboardData
      .getData('text/plain')
      .replace(/\r\n?/g, '\n')
      .replace(/\n+$/, '');
    const isBlock = text.includes('\t') || text.includes('\n');

    if (!isBlock) {
      if (
        target.tagName === 'SELECT' ||
        (target as HTMLInputElement).type === 'checkbox'
      ) {
        event.preventDefault();
        dispatch({
          type: 'paste',
          targetClientIds: [clientId],
          columns: [columns[col].id],
          rows: [[text]],
        });
      }
      return;
    }

    event.preventDefault();
    const pasted = parseDelimitedText(text, '\t');
    if (
      pasted.length > 0 &&
      (isBulkUploadHeader(pasted[0]) || matchGridHeader(pasted[0]))
    ) {
      onHeaderPaste(text);
      return;
    }
    const start = Math.max(0, orderedIds.indexOf(clientId));
    dispatch({
      type: 'paste',
      targetClientIds: orderedIds.slice(start),
      columns: columns.slice(col).map((column) => column.id),
      rows: pasted,
    });
  };

  const handleFocus = (event: FocusEvent<HTMLTableSectionElement>) => {
    const id = rowIdFrom(event.target);
    if (id) setFocusedId(id);
  };

  const handleBlur = (event: FocusEvent<HTMLTableSectionElement>) => {
    setFocusedId(rowIdFrom(event.relatedTarget));
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState({ left: false, right: false });
  const [hasScrolledSideways, setHasScrolledSideways] = useState(false);

  const updateOverflow = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const left = element.scrollLeft > 4;
    const right =
      element.scrollLeft + element.clientWidth < element.scrollWidth - 4;
    setOverflow((current) =>
      current.left === left && current.right === right
        ? current
        : { left, right }
    );
    if (left) setHasScrolledSideways(true);
  }, []);

  useEffect(() => {
    updateOverflow();
    // The router restores saved scroll positions after a reload, but the rows
    // don't survive a reload, so always start at the first column.
    const reset = window.setTimeout(() => {
      scrollRef.current?.scrollTo?.({ left: 0, top: 0 });
      updateOverflow();
      setHasScrolledSideways(false);
    }, 0);
    window.addEventListener('resize', updateOverflow);
    const element = scrollRef.current;
    const observer =
      typeof ResizeObserver === 'undefined' || !element
        ? null
        : new ResizeObserver(updateOverflow);
    if (element) observer?.observe(element);
    return () => {
      window.clearTimeout(reset);
      window.removeEventListener('resize', updateOverflow);
      observer?.disconnect();
    };
  }, [updateOverflow]);

  useEffect(updateOverflow, [columns, updateOverflow]);

  const scrollSideways = (direction: 1 | -1) => {
    const element = scrollRef.current;
    if (!element) return;
    element.scrollBy({
      left: direction * Math.max(240, element.clientWidth * 0.6),
      behavior: 'smooth',
    });
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        data-grid-scroll
        onScroll={updateOverflow}
        className="max-h-[70vh] min-h-[320px] overflow-auto rounded-lg border border-jpm-gray-200 bg-white"
      >
        <table className="w-max min-w-full table-fixed border-separate border-spacing-0 text-sm">
          <colgroup>
            <col className="w-16" />
            {columns.map((column) => (
              <col key={column.id} className={columnWidth(column)} />
            ))}
            <col className="w-36" />
            <col className="w-12" />
          </colgroup>
          <thead className="sticky top-0 z-10 bg-jpm-gray-50 text-left">
            <tr className="text-xs uppercase tracking-wide text-jpm-gray-600">
              <th
                colSpan={2}
                className={cn(
                  STICKY_FIRST,
                  'z-[3] border-b border-r border-jpm-gray-200 bg-jpm-gray-50 px-2 py-2 font-semibold'
                )}
              >
                Business
              </th>
              {headerGroups(columns).map((group, index) => {
                if (!group.group && group.section === 'business') {
                  return (
                    <th
                      key={group.key}
                      colSpan={group.span}
                      data-tour="business-group"
                      className="border-b border-jpm-gray-200 bg-jpm-gray-50 px-2 py-2 font-normal normal-case tracking-normal text-jpm-gray-500"
                    >
                      Legal name, type and email
                    </th>
                  );
                }
                if (!group.group) {
                  return (
                    <th
                      key={group.key}
                      colSpan={group.span}
                      data-tour="controller-group"
                      className="border-b border-l border-jpm-gray-200 bg-sp-accent px-2 py-2 font-semibold text-sp-brand-800"
                    >
                      Controller · completes onboarding and receives the login
                      email
                    </th>
                  );
                }
                const isPerson = group.section === 'controller';
                return (
                  <th
                    key={`${group.key}-${index}`}
                    colSpan={group.span}
                    className={cn(
                      'border-b border-l border-jpm-gray-200 px-2 py-2 font-semibold',
                      isPerson
                        ? 'bg-sp-accent/60 text-sp-brand-800'
                        : 'bg-jpm-gray-100'
                    )}
                  >
                    {isPerson ? 'Controller · ' : ''}
                    {getGroup(group.group).label}
                    <span className="ml-1 font-normal normal-case tracking-normal text-jpm-gray-500">
                      (optional)
                    </span>
                  </th>
                );
              })}
              <th className="border-b border-l border-jpm-gray-200 bg-jpm-gray-50 px-2 py-2 font-semibold">
                Others
              </th>
              <th className="border-b border-jpm-gray-200 bg-jpm-gray-50" />
            </tr>
            <tr className="text-xs text-jpm-gray-700">
              <th
                className={cn(
                  STICKY_FIRST,
                  'z-[3] border-b border-jpm-gray-200 bg-jpm-gray-50 px-2 py-2 font-medium'
                )}
              >
                Row
              </th>
              {columns.map((column, index) => {
                const previous = columns[index - 1];
                const startsGroup =
                  index > 0 &&
                  (previous.group !== column.group ||
                    previous.section !== column.section);
                return (
                  <th
                    key={column.id}
                    title={columnHint(column)}
                    className={cn(
                      'border-b border-jpm-gray-200 bg-jpm-gray-50 px-2 py-2 font-medium',
                      index === 0 && cn(STICKY_SECOND, 'z-[3]'),
                      startsGroup && 'border-l',
                      column.id === 'isBeneficialOwner' && 'text-center'
                    )}
                  >
                    {column.label}
                    {REQUIRED[column.id as GridColumnKey] ? (
                      <span className="text-red-600" aria-hidden>
                        {' '}
                        *
                      </span>
                    ) : null}
                    {column.id === 'email' || column.id === 'middleName' ? (
                      <span className="font-normal text-jpm-gray-500">
                        {' '}
                        (optional)
                      </span>
                    ) : null}
                  </th>
                );
              })}
              <th
                data-tour="others-column"
                className="border-b border-l border-jpm-gray-200 bg-jpm-gray-50 px-2 py-2 font-medium"
                title="Other individuals who own 25% or more of the business (optional)"
              >
                Beneficial owners
              </th>
              <th className="border-b border-jpm-gray-200 bg-jpm-gray-50">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody
            ref={bodyRef}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={handleFocus}
            onBlur={handleBlur}
          >
            {rows.map((item, rowPos) => (
              <ClientRow
                key={item.client.id}
                item={item}
                rowPos={rowPos}
                columns={columns}
                totalColumns={totalColumns}
                showAllErrors={showAllErrors}
                isFocused={focusedId === item.client.id}
                isExpanded={expanded.has(item.client.id)}
                onToggleExpanded={toggleExpanded}
                onOpenDetails={onOpenDetails}
                dispatch={dispatch}
              />
            ))}
          </tbody>
        </table>
      </div>

      {overflow.left ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-px left-52 top-px w-10 bg-gradient-to-r from-gray-900/10 to-transparent"
          />
          <button
            type="button"
            onClick={() => scrollSideways(-1)}
            aria-label="Scroll left to earlier columns"
            title="Scroll left"
            className="absolute left-[13.5rem] top-1/2 z-20 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-jpm-gray-200 bg-white text-jpm-gray-700 shadow-md hover:bg-jpm-gray-50"
          >
            <ChevronsLeft className="size-4" aria-hidden />
          </button>
        </>
      ) : null}
      {overflow.right ? (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-px right-px top-px w-14 rounded-r-lg bg-gradient-to-l from-gray-900/15 to-transparent"
          />
          <button
            type="button"
            onClick={() => scrollSideways(1)}
            aria-label="Scroll right to see more columns"
            title="Scroll right to see more columns"
            className={cn(
              'absolute right-3 top-1/2 z-20 inline-flex h-8 -translate-y-1/2 items-center gap-1 rounded-full bg-sp-brand text-xs font-medium text-white shadow-lg hover:bg-sp-brand-700',
              hasScrolledSideways ? 'w-8 justify-center' : 'px-3'
            )}
          >
            {hasScrolledSideways ? null : <span>More columns</span>}
            <ChevronsRight className="size-4" aria-hidden />
          </button>
        </>
      ) : null}
    </div>
  );
}

interface ClientRowProps {
  item: VisibleClient;
  rowPos: number;
  columns: SheetColumn[];
  totalColumns: number;
  showAllErrors: boolean;
  isFocused: boolean;
  isExpanded: boolean;
  onToggleExpanded: (clientId: string) => void;
  onOpenDetails: (clientId: string) => void;
  dispatch: Dispatch<BuilderAction>;
}

const ClientRow = memo(function ClientRow({
  item,
  rowPos,
  columns,
  totalColumns,
  showAllErrors,
  isFocused,
  isExpanded,
  onToggleExpanded,
  onOpenDetails,
  dispatch,
}: ClientRowProps) {
  const { client, rowNumber, validation } = item;
  const blank = isClientBlank(client);
  const reveal = !blank && (client.touched || showAllErrors);
  const shown = visibleIssues(validation.issues, {
    reveal,
    editing: isFocused && !showAllErrors,
  });
  const controller = client.people[0];
  const additionalCount = client.people
    .slice(1)
    .filter((p) => !isPersonBlank(p)).length;
  const additionalHaveIssues = shown.some(
    (issue) =>
      (issue.target.scope === 'person' && issue.target.personIndex > 0) ||
      issue.target.field === 'people'
  );

  const cellProps = (col: number, column: SheetColumn) => {
    const ref = fieldRef(column);
    const fieldIssues = ref ? issuesFor(shown, ref) : [];
    const severity = worstSeverity(fieldIssues);
    return {
      'data-row': rowPos,
      'data-col': col,
      'data-client': client.id,
      'aria-label': `Row ${rowNumber} ${column.templateHeader}`,
      'aria-invalid': severity === 'error' || undefined,
      title: fieldIssues[0]?.message ?? columnHint(column),
      className: cn(cellInputClass, fieldStateClass[severity ?? 'none']),
    };
  };

  const setBase = (key: GridColumnKey, value: string) =>
    dispatch({ type: 'setGridValue', clientId: client.id, key, value });

  const textCell = (
    col: number,
    column: SheetColumn,
    value: string,
    placeholder?: string
  ) => (
    <input
      type="text"
      value={value}
      placeholder={
        placeholder ??
        (rowNumber === 1
          ? EXAMPLE_PLACEHOLDER[column.id as GridColumnKey]
          : undefined)
      }
      onChange={(event) =>
        setBase(column.id as GridColumnKey, event.target.value)
      }
      spellCheck={false}
      autoComplete="off"
      {...cellProps(col, column)}
    />
  );

  const renderCell = (column: SheetColumn, col: number) => {
    if (column.detail) {
      const field = column.detail;
      const isBusiness = column.section === 'business';
      const value =
        (isBusiness ? client.details : controller.details)[field.id] ?? '';
      return (
        <DetailInput
          field={field}
          value={value}
          onChange={(next) =>
            dispatch({
              type: 'setDetail',
              clientId: client.id,
              personIndex: isBusiness ? null : 0,
              field: field.id,
              value: next,
            })
          }
          {...cellProps(col, column)}
        />
      );
    }
    switch (column.id as GridColumnKey) {
      case 'externalId':
        return textCell(col, column, client.externalId);
      case 'organizationName':
        return textCell(col, column, client.organizationName);
      case 'organizationType':
        return (
          <OrganizationTypeSelect
            value={client.organizationType}
            onChange={(value) => setBase('organizationType', value)}
            {...cellProps(col, column)}
          />
        );
      case 'email':
        return textCell(
          col,
          column,
          client.email,
          controller.email.trim() || 'Same as controller email'
        );
      case 'firstName':
        return textCell(col, column, controller.firstName);
      case 'middleName':
        return textCell(col, column, controller.middleName);
      case 'lastName':
        return textCell(col, column, controller.lastName);
      case 'personEmail':
        return textCell(col, column, controller.email);
      case 'isBeneficialOwner':
        return (
          <RoleCheckbox
            checked={controller.isBeneficialOwner}
            onChange={(checked) =>
              dispatch({
                type: 'setPersonRole',
                clientId: client.id,
                personIndex: 0,
                role: 'isBeneficialOwner',
                value: checked,
              })
            }
            label={`Row ${rowNumber} controller owns 25% or more`}
            title={columnHint(column)}
            data-row={rowPos}
            data-col={col}
            data-client={client.id}
          />
        );
    }
  };

  return (
    <>
      <tr data-client-row={client.id} className="group align-middle">
        <td
          className={cn(
            STICKY_FIRST,
            'z-[1] border-b border-jpm-gray-100 bg-white px-2 py-1 text-xs text-jpm-gray-500'
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <StatusIcon
              blank={blank}
              validation={validation}
              showErrors={reveal}
            />
            {rowNumber}
          </span>
        </td>
        {columns.map((column, col) => {
          const previous = columns[col - 1];
          const startsGroup =
            col > 0 &&
            (previous.group !== column.group ||
              previous.section !== column.section);
          return (
            <td
              key={column.id}
              data-tour={col === 0 && rowPos === 0 ? 'client-id' : undefined}
              className={cn(
                'border-b border-jpm-gray-100 px-1 py-1',
                col === 0 && cn(STICKY_SECOND, 'z-[1] bg-white'),
                startsGroup && 'border-l',
                column.id === 'isBeneficialOwner' && 'text-center'
              )}
            >
              {renderCell(column, col)}
            </td>
          );
        })}
        <td className="border-b border-l border-jpm-gray-100 px-1 py-1">
          <button
            type="button"
            onClick={() => onToggleExpanded(client.id)}
            aria-expanded={isExpanded}
            className={cn(
              'inline-flex h-8 w-full items-center gap-1 rounded px-2 text-xs font-medium hover:bg-jpm-gray-100',
              additionalHaveIssues
                ? 'text-red-700'
                : additionalCount > 0
                  ? 'text-jpm-gray-900'
                  : 'text-sp-brand'
            )}
          >
            {isExpanded ? (
              <ChevronDown className="size-3.5" aria-hidden />
            ) : (
              <ChevronRight className="size-3.5" aria-hidden />
            )}
            {additionalCount > 0 ? `${additionalCount} more` : 'Add'}
          </button>
        </td>
        <td className="border-b border-jpm-gray-100 px-1 py-1 text-center">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-jpm-gray-400 opacity-60 hover:text-red-600 group-hover:opacity-100"
            onClick={() =>
              dispatch({ type: 'removeClient', clientId: client.id })
            }
            aria-label={`Delete row ${rowNumber}`}
            title="Delete this client"
          >
            <Trash2 />
          </Button>
        </td>
      </tr>
      {shown.length > 0 ? (
        <tr data-client-row={client.id}>
          <td className="border-b border-jpm-gray-100" />
          <td
            colSpan={totalColumns - 1}
            className="border-b border-jpm-gray-100 px-3 pb-2 pt-0.5"
          >
            <div className="sticky left-20 w-fit max-w-[calc(100vw-10rem)]">
              <IssueList
                issues={shown}
                onFix={(fix) =>
                  dispatch({
                    type: 'applyFixes',
                    fixes: [{ clientId: client.id, fix }],
                  })
                }
              />
            </div>
          </td>
        </tr>
      ) : null}
      {isExpanded ? (
        <tr data-client-row={client.id}>
          <td className="border-b border-jpm-gray-100 bg-jpm-gray-50" />
          <td
            colSpan={totalColumns - 1}
            className="border-b border-jpm-gray-100 bg-jpm-gray-50 px-3 py-3"
          >
            <div className="sticky left-20 w-fit max-w-[calc(100vw-10rem)]">
              <PeopleEditor
                client={client}
                issues={shown}
                dispatch={dispatch}
                onOpenDetails={() => onOpenDetails(client.id)}
              />
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
});

function PeopleEditor({
  client,
  issues,
  dispatch,
  onOpenDetails,
}: {
  client: ClientDraft;
  issues: Issue[];
  dispatch: Dispatch<BuilderAction>;
  onOpenDetails: () => void;
}) {
  const others = client.people
    .map((person, index) => ({ person, index }))
    .slice(1);

  const setField = (personIndex: number, field: PersonField, value: string) =>
    dispatch({
      type: 'setPersonField',
      clientId: client.id,
      personIndex,
      field,
      value,
    });

  const fieldClass = (personIndex: number, field: PersonField) =>
    fieldStateClass[
      worstSeverity(
        issuesFor(issues, { scope: 'person', personIndex, field })
      ) ?? 'none'
    ];

  return (
    <div className="max-w-5xl space-y-2">
      <p className="text-xs text-jpm-gray-600">
        Add each other individual who <strong>owns 25% or more</strong> of the
        business. Don’t add the controller again — if they own 25% or more, tick{' '}
        <strong>Owner 25%+</strong> on their row instead.
      </p>
      {others.length > 0 ? (
        <table className="w-full table-fixed text-sm">
          <thead className="text-left text-xs text-jpm-gray-600">
            <tr>
              <th className="w-10 py-1 font-medium">#</th>
              <th className="py-1 font-medium">First name *</th>
              <th className="py-1 font-medium">Middle (optional)</th>
              <th className="py-1 font-medium">Last name *</th>
              <th className="w-64 py-1 font-medium">Email (optional)</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {others.map(({ person, index }) => (
              <tr key={person.id}>
                <td className="py-1 text-xs text-jpm-gray-500">{index + 1}</td>
                {(
                  ['firstName', 'middleName', 'lastName', 'email'] as const
                ).map((field) => (
                  <td key={field} className="py-1 pr-1">
                    <input
                      type="text"
                      value={person[field]}
                      onChange={(event) =>
                        setField(index, field, event.target.value)
                      }
                      aria-label={`Person ${index + 1} ${PERSON_FIELD_LABEL[field]}`}
                      spellCheck={false}
                      autoComplete="off"
                      className={cn(
                        cellInputClass,
                        'border-jpm-gray-200 bg-white',
                        fieldClass(index, field)
                      )}
                    />
                  </td>
                ))}
                <td className="py-1 text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-jpm-gray-400 hover:text-red-600"
                    onClick={() =>
                      dispatch({
                        type: 'removePerson',
                        clientId: client.id,
                        personIndex: index,
                      })
                    }
                    aria-label={`Remove person ${index + 1}`}
                  >
                    <Trash2 />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => dispatch({ type: 'addPerson', clientId: client.id })}
        >
          <UserPlus aria-hidden />
          Add beneficial owner
        </Button>
        {others.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-sp-brand"
            onClick={onOpenDetails}
          >
            <ListPlus aria-hidden />
            Add their optional details (ID, birth date, address…)
          </Button>
        ) : null}
      </div>
    </div>
  );
}
