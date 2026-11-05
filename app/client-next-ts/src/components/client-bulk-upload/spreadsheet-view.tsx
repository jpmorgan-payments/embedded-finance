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
import { ChevronDown, ChevronRight, Trash2, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  isBulkUploadHeader,
  matchGridHeader,
  parseDelimitedText,
} from '@/lib/client-bulk-upload/csv';
import {
  GRID_COLUMNS,
  isClientBlank,
  isPersonBlank,
  type ClientDraft,
  type GridColumnKey,
  type PersonField,
} from '@/lib/client-bulk-upload/model';
import type { BuilderAction } from '@/lib/client-bulk-upload/state';
import type {
  ClientValidation,
  Issue,
} from '@/lib/client-bulk-upload/validate';
import { cn } from '@/lib/utils';

import {
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
  /** Every client matching the current filter, in order (paste can spill past the page). */
  orderedIds: string[];
  showAllErrors: boolean;
  canAppendOnEnter: boolean;
  dispatch: Dispatch<BuilderAction>;
  onHeaderPaste: (text: string) => void;
}

const COLUMN_WIDTH: Record<GridColumnKey, string> = {
  externalId: 'w-36',
  organizationName: 'w-60',
  organizationType: 'w-56',
  email: 'w-56',
  firstName: 'w-32',
  middleName: 'w-28',
  lastName: 'w-32',
  personEmail: 'w-56',
  isBeneficialOwner: 'w-20',
  isController: 'w-20',
};

const COLUMN_HINT: Partial<Record<GridColumnKey, string>> = {
  externalId: 'Your own unique identifier for this business (1–50 characters)',
  organizationName: 'Legal name of the business',
  email:
    'Email of the controller or authorized user, used for micro-deposit notifications. Leave blank to use the authorized user’s email',
  firstName: 'Legal first name',
  lastName: 'Legal last name',
  personEmail:
    'This person is sent an email to set up a login and complete onboarding',
  isBeneficialOwner: 'Tick if this person owns 25% or more of the business',
  isController:
    'Tick if this person has significant responsibility and control over the business, such as an executive officer or senior manager',
};

const REQUIRED: Partial<Record<GridColumnKey, boolean>> = {
  externalId: true,
  organizationName: true,
  organizationType: true,
  firstName: true,
  lastName: true,
  personEmail: true,
};

const FIELD_REF: Record<GridColumnKey, FieldRef | null> = {
  externalId: { scope: 'client', field: 'externalId' },
  organizationName: { scope: 'client', field: 'organizationName' },
  organizationType: { scope: 'client', field: 'organizationType' },
  email: { scope: 'client', field: 'email' },
  firstName: { scope: 'person', personIndex: 0, field: 'firstName' },
  middleName: { scope: 'person', personIndex: 0, field: 'middleName' },
  lastName: { scope: 'person', personIndex: 0, field: 'lastName' },
  personEmail: { scope: 'person', personIndex: 0, field: 'email' },
  isBeneficialOwner: null,
  isController: null,
};

const TOTAL_COLUMNS = GRID_COLUMNS.length + 3;

const PERSON_FIELD_LABEL: Record<PersonField, string> = {
  firstName: 'first name',
  middleName: 'middle name',
  lastName: 'last name',
  email: 'email',
};

const cellInputClass =
  'h-8 w-full rounded border border-transparent bg-transparent px-2 text-sm text-jpm-gray-900 placeholder:text-jpm-gray-400 hover:border-jpm-gray-200 focus:border-sp-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-sp-brand/20';

function rowIdFrom(element: EventTarget | null): string | null {
  if (!(element instanceof HTMLElement)) return null;
  return (
    element.closest<HTMLElement>('[data-client-row]')?.dataset.clientRow ?? null
  );
}

export function SpreadsheetView({
  rows,
  orderedIds,
  showAllErrors,
  canAppendOnEnter,
  dispatch,
  onHeaderPaste,
}: SpreadsheetViewProps) {
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const pendingFocus = useRef<{ row: number; col: number } | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

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
          type: 'setGridValue',
          clientId,
          key: GRID_COLUMNS[col].key,
          value: text,
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
      startColumn: col,
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

  return (
    <div className="max-h-[70vh] min-h-[320px] overflow-auto rounded-lg border border-jpm-gray-200 bg-white">
      <table className="w-max min-w-full table-fixed border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-10 bg-jpm-gray-50 text-left">
          <tr className="text-xs uppercase tracking-wide text-jpm-gray-600">
            <th className="w-16 border-b border-jpm-gray-200 bg-jpm-gray-50" />
            <th
              colSpan={4}
              className="border-b border-l border-jpm-gray-200 bg-jpm-gray-50 px-2 py-2 font-semibold"
            >
              Business
            </th>
            <th
              colSpan={6}
              className="border-b border-l border-jpm-gray-200 bg-sp-accent px-2 py-2 font-semibold text-sp-brand-800"
            >
              Authorized user · receives the onboarding invitation
            </th>
            <th className="border-b border-l border-jpm-gray-200 bg-jpm-gray-50 px-2 py-2 font-semibold">
              Others
            </th>
            <th className="w-12 border-b border-jpm-gray-200 bg-jpm-gray-50" />
          </tr>
          <tr className="text-xs text-jpm-gray-700">
            <th className="w-16 border-b border-jpm-gray-200 bg-jpm-gray-50 px-2 py-2 font-medium">
              Row
            </th>
            {GRID_COLUMNS.map((column, index) => (
              <th
                key={column.key}
                title={COLUMN_HINT[column.key]}
                className={cn(
                  COLUMN_WIDTH[column.key],
                  'border-b border-jpm-gray-200 bg-jpm-gray-50 px-2 py-2 font-medium',
                  (index === 0 || index === 4) && 'border-l',
                  (column.key === 'isBeneficialOwner' ||
                    column.key === 'isController') &&
                    'text-center'
                )}
              >
                {column.label}
                {REQUIRED[column.key] ? (
                  <span className="text-red-600" aria-hidden>
                    {' '}
                    *
                  </span>
                ) : null}
                {column.key === 'email' || column.key === 'middleName' ? (
                  <span className="font-normal text-jpm-gray-500">
                    {' '}
                    (optional)
                  </span>
                ) : null}
              </th>
            ))}
            <th
              className="w-36 border-b border-l border-jpm-gray-200 bg-jpm-gray-50 px-2 py-2 font-medium"
              title="Other beneficial owners and controllers (optional)"
            >
              Owners & controllers
            </th>
            <th className="w-12 border-b border-jpm-gray-200 bg-jpm-gray-50">
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
              showAllErrors={showAllErrors}
              isFocused={focusedId === item.client.id}
              isExpanded={expanded.has(item.client.id)}
              onToggleExpanded={toggleExpanded}
              dispatch={dispatch}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface ClientRowProps {
  item: VisibleClient;
  rowPos: number;
  showAllErrors: boolean;
  isFocused: boolean;
  isExpanded: boolean;
  onToggleExpanded: (clientId: string) => void;
  dispatch: Dispatch<BuilderAction>;
}

const ClientRow = memo(function ClientRow({
  item,
  rowPos,
  showAllErrors,
  isFocused,
  isExpanded,
  onToggleExpanded,
  dispatch,
}: ClientRowProps) {
  const { client, rowNumber, validation } = item;
  const blank = isClientBlank(client);
  const reveal = !blank && (client.touched || showAllErrors);
  const shown = visibleIssues(validation.issues, {
    reveal,
    editing: isFocused && !showAllErrors,
  });
  const authorizedUser = client.people[0];
  const additionalCount = client.people
    .slice(1)
    .filter((p) => !isPersonBlank(p)).length;
  const additionalHaveIssues = shown.some(
    (issue) =>
      (issue.target.scope === 'person' && issue.target.personIndex > 0) ||
      issue.target.field === 'people'
  );

  const setValue = (key: GridColumnKey, value: string) =>
    dispatch({ type: 'setGridValue', clientId: client.id, key, value });

  const stateFor = (key: GridColumnKey) => {
    const ref = FIELD_REF[key];
    const fieldIssues = ref ? issuesFor(shown, ref) : [];
    const severity = worstSeverity(fieldIssues);
    return {
      className: fieldStateClass[severity ?? 'none'],
      title: fieldIssues[0]?.message ?? COLUMN_HINT[key],
      invalid: severity === 'error',
    };
  };

  const cellProps = (col: number, key: GridColumnKey) => {
    const state = stateFor(key);
    return {
      'data-row': rowPos,
      'data-col': col,
      'data-client': client.id,
      'aria-label': `Row ${rowNumber} ${GRID_COLUMNS[col].templateHeader}`,
      'aria-invalid': state.invalid || undefined,
      title: state.title,
      className: cn(cellInputClass, state.className),
    };
  };

  const textCell = (
    col: number,
    key: GridColumnKey,
    value: string,
    placeholder?: string
  ) => (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => setValue(key, event.target.value)}
      spellCheck={false}
      autoComplete="off"
      {...cellProps(col, key)}
    />
  );

  const rowTint = blank
    ? ''
    : validation.errorCount > 0 && reveal
      ? 'bg-red-50/30'
      : '';

  return (
    <>
      <tr
        data-client-row={client.id}
        className={cn('group align-middle', rowTint)}
      >
        <td className="border-b border-jpm-gray-100 px-2 py-1 text-xs text-jpm-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <StatusIcon
              blank={blank}
              validation={validation}
              showErrors={reveal}
            />
            {rowNumber}
          </span>
        </td>
        <td className="border-b border-l border-jpm-gray-100 px-1 py-1">
          {textCell(0, 'externalId', client.externalId)}
        </td>
        <td className="border-b border-jpm-gray-100 px-1 py-1">
          {textCell(1, 'organizationName', client.organizationName)}
        </td>
        <td className="border-b border-jpm-gray-100 px-1 py-1">
          <OrganizationTypeSelect
            value={client.organizationType}
            onChange={(value) => setValue('organizationType', value)}
            {...cellProps(2, 'organizationType')}
          />
        </td>
        <td className="border-b border-jpm-gray-100 px-1 py-1">
          {textCell(
            3,
            'email',
            client.email,
            authorizedUser.email.trim() || 'Same as user email'
          )}
        </td>
        <td className="border-b border-l border-jpm-gray-100 px-1 py-1">
          {textCell(4, 'firstName', authorizedUser.firstName)}
        </td>
        <td className="border-b border-jpm-gray-100 px-1 py-1">
          {textCell(5, 'middleName', authorizedUser.middleName)}
        </td>
        <td className="border-b border-jpm-gray-100 px-1 py-1">
          {textCell(6, 'lastName', authorizedUser.lastName)}
        </td>
        <td className="border-b border-jpm-gray-100 px-1 py-1">
          {textCell(7, 'personEmail', authorizedUser.email)}
        </td>
        {(['isBeneficialOwner', 'isController'] as const).map((key, offset) => (
          <td
            key={key}
            className="border-b border-jpm-gray-100 px-1 py-1 text-center"
          >
            <RoleCheckbox
              checked={authorizedUser[key]}
              onChange={(checked) =>
                dispatch({
                  type: 'setPersonRole',
                  clientId: client.id,
                  personIndex: 0,
                  role: key,
                  value: checked,
                })
              }
              label={`Row ${rowNumber} authorized user ${key === 'isController' ? 'is a controller' : 'owns 25% or more'}`}
              title={COLUMN_HINT[key]}
              data-row={rowPos}
              data-col={8 + offset}
              data-client={client.id}
            />
          </td>
        ))}
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
        <tr data-client-row={client.id} className={rowTint}>
          <td className="border-b border-jpm-gray-100" />
          <td
            colSpan={TOTAL_COLUMNS - 1}
            className="border-b border-jpm-gray-100 px-3 pb-2 pt-0.5"
          >
            <IssueList
              issues={shown}
              onFix={(fix) =>
                dispatch({
                  type: 'applyFixes',
                  fixes: [{ clientId: client.id, fix }],
                })
              }
            />
          </td>
        </tr>
      ) : null}
      {isExpanded ? (
        <tr data-client-row={client.id}>
          <td className="border-b border-jpm-gray-100 bg-jpm-gray-50" />
          <td
            colSpan={TOTAL_COLUMNS - 1}
            className="border-b border-jpm-gray-100 bg-jpm-gray-50 px-3 py-3"
          >
            <PeopleEditor client={client} issues={shown} dispatch={dispatch} />
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
}: {
  client: ClientDraft;
  issues: Issue[];
  dispatch: Dispatch<BuilderAction>;
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

  const fieldClass = (personIndex: number, field: PersonField | 'roles') =>
    fieldStateClass[
      worstSeverity(
        issuesFor(issues, { scope: 'person', personIndex, field })
      ) ?? 'none'
    ];

  return (
    <div className="max-w-5xl space-y-2">
      <p className="text-xs text-jpm-gray-600">
        Add each other individual who <strong>owns 25% or more</strong> or who
        is a <strong>controller</strong>. Don’t repeat the authorized user —
        tick their roles in the main row instead. Email is required for
        controllers.
      </p>
      {others.length > 0 ? (
        <table className="w-full table-fixed text-sm">
          <thead className="text-left text-xs text-jpm-gray-600">
            <tr>
              <th className="w-10 py-1 font-medium">#</th>
              <th className="py-1 font-medium">First name *</th>
              <th className="py-1 font-medium">Middle (optional)</th>
              <th className="py-1 font-medium">Last name *</th>
              <th className="w-64 py-1 font-medium">Email</th>
              <th className="w-24 py-1 text-center font-medium">Owner 25%+</th>
              <th className="w-24 py-1 text-center font-medium">Controller</th>
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
                {(['isBeneficialOwner', 'isController'] as const).map(
                  (role) => (
                    <td key={role} className="py-1 text-center">
                      <RoleCheckbox
                        checked={person[role]}
                        onChange={(checked) =>
                          dispatch({
                            type: 'setPersonRole',
                            clientId: client.id,
                            personIndex: index,
                            role,
                            value: checked,
                          })
                        }
                        label={`Person ${index + 1} ${role === 'isController' ? 'is a controller' : 'owns 25% or more'}`}
                        invalid={
                          fieldClass(index, 'roles') === fieldStateClass.error
                        }
                      />
                    </td>
                  )
                )}
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => dispatch({ type: 'addPerson', clientId: client.id })}
      >
        <UserPlus aria-hidden />
        Add owner or controller
      </Button>
    </div>
  );
}
