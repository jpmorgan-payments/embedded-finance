import Papa from 'papaparse';

import {
  businessDetailsToCsv,
  DETAIL_CSV_COLUMNS,
  isSupportedDetailColumn,
  personDetailsToCsv,
  readBusinessDetails,
  readPersonDetails,
} from './details';
import { setCellValue } from './grid-values';
import {
  createClient,
  createPerson,
  getAdditionalPeople,
  getEffectiveBusinessEmail,
  isClientBlank,
  RETIRED_TEMPLATE_HEADERS,
  type ClientDraft,
  type PersonDraft,
} from './model';
import {
  cleanCell,
  normalizeKey,
  normalizeOrganizationType,
  parseYesNo,
} from './normalize';
import {
  CSV_HEADERS,
  FIXED_VALUES,
  LIMITS,
  PARTY_TYPE,
  ROLES,
  type CsvRow,
} from './schema';
import {
  ALL_SHEET_COLUMNS,
  BASE_COLUMN_IDS,
  buildSheetColumns,
  type ColumnId,
  type SheetColumn,
} from './sheet-columns';
import { buildPersonExternalId } from './validate';

const CSV_NEWLINE = '\r\n';

function emptyRow(): CsvRow {
  return Object.fromEntries(CSV_HEADERS.map((h) => [h, '']));
}

/**
 * Roles in the order they are written: the controller first, then the
 * authorized user role that always goes with it. Everyone else is a
 * beneficial owner.
 */
function personRoles(person: PersonDraft, isController: boolean): string[] {
  if (!isController) return [ROLES.BENEFICIAL_OWNER];
  const roles: string[] = [ROLES.CONTROLLER, ROLES.AUTHORIZED_USER];
  if (person.isBeneficialOwner) roles.push(ROLES.BENEFICIAL_OWNER);
  return roles;
}

/**
 * One business row plus one row per person. Roles are packed into
 * roles.0..2 without gaps, and `products.0` belongs on the business row only
 * (it is not an individual field in the upload instructions). Optional
 * details are added as extra columns.
 */
export function buildClientRows(client: ClientDraft): CsvRow[] {
  const clientId = client.externalId.trim();
  const businessRow: CsvRow = {
    ...emptyRow(),
    partyType: PARTY_TYPE.ORGANIZATION,
    'roles.0': ROLES.CLIENT,
    externalId: clientId,
    email: getEffectiveBusinessEmail(client),
    'organizationDetails.organizationName': client.organizationName.trim(),
    'organizationDetails.organizationType': client.organizationType.trim(),
    'organizationDetails.countryOfFormation': FIXED_VALUES.countryOfFormation,
    'products.0': FIXED_VALUES.product,
    ...businessDetailsToCsv(client.details),
  };

  const people = [client.people[0], ...getAdditionalPeople(client)];
  const personRows = people.map((person, index) => {
    const roles = personRoles(person, index === 0);
    const row: CsvRow = {
      ...emptyRow(),
      partyType: PARTY_TYPE.INDIVIDUAL,
      externalId: buildPersonExternalId(clientId, index + 1),
      parentExternalId: clientId,
      email: person.email.trim(),
      'individualDetails.firstName': person.firstName.trim(),
      'individualDetails.middleName': person.middleName.trim(),
      'individualDetails.lastName': person.lastName.trim(),
      'individualDetails.countryOfResidence': FIXED_VALUES.countryOfResidence,
      ...personDetailsToCsv(person.details),
    };
    roles.forEach((role, roleIndex) => {
      row[`roles.${roleIndex}`] = role;
    });
    return row;
  });

  return [businessRow, ...personRows];
}

export function buildCsvRows(clients: ClientDraft[]): CsvRow[] {
  return clients
    .filter((client) => !isClientBlank(client))
    .flatMap(buildClientRows);
}

/** The template columns, followed by any optional columns that hold data. */
export function getCsvHeaders(rows: CsvRow[]): string[] {
  const used = new Set<string>();
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      if (value) used.add(key);
    }
  }
  return [
    ...CSV_HEADERS,
    ...DETAIL_CSV_COLUMNS.filter((column) => used.has(column)),
  ];
}

function serializeLines(
  rows: CsvRow[],
  headers: string[],
  includeHeader: boolean
): string {
  const text = Papa.unparse(
    {
      fields: headers,
      data: rows.map((row) => headers.map((header) => row[header] ?? '')),
    },
    { newline: CSV_NEWLINE, header: includeHeader, quotes: false }
  );
  return text ? text + CSV_NEWLINE : '';
}

/** UTF-8 without a byte order mark, so the first header name stays exact. */
export function serializeCsv(
  rows: CsvRow[],
  headers = getCsvHeaders(rows)
): string {
  return serializeLines(rows, headers, true);
}

export interface CsvFilePart {
  fileName: string;
  content: string;
  clientCount: number;
  rowCount: number;
}

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function buildFileName(
  date: Date,
  clientCount: number,
  part?: { index: number; total: number }
): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const suffix = part ? `-part-${part.index}-of-${part.total}` : '';
  const noun = clientCount === 1 ? 'client' : 'clients';
  return `client-bulk-upload-${yyyy}-${mm}-${dd}-${clientCount}-${noun}${suffix}.csv`;
}

/**
 * Builds one file, or several when the upload limits in the instructions
 * (10,000 rows or 10 MB) would be exceeded. A business and its people always
 * stay in the same file. Every part uses the same columns.
 */
export function buildCsvFiles(
  clients: ClientDraft[],
  options: { date?: Date; maxRows?: number; maxBytes?: number } = {}
): CsvFilePart[] {
  const {
    date = new Date(),
    maxRows = LIMITS.maxDataRowsPerFile,
    maxBytes = LIMITS.maxFileBytes,
  } = options;
  const active = clients.filter((client) => !isClientBlank(client));
  const rowsByClient = active.map(buildClientRows);
  const headers = getCsvHeaders(rowsByClient.flat());
  const headerBytes = byteLength(serializeLines([], headers, true));

  const groups: { rows: CsvRow[]; clientCount: number; bytes: number }[] = [];
  let current = { rows: [] as CsvRow[], clientCount: 0, bytes: headerBytes };

  rowsByClient.forEach((rows) => {
    const bytes = byteLength(serializeLines(rows, headers, false));
    const wouldOverflow =
      current.clientCount > 0 &&
      (current.rows.length + rows.length > maxRows ||
        current.bytes + bytes > maxBytes);
    if (wouldOverflow) {
      groups.push(current);
      current = { rows: [], clientCount: 0, bytes: headerBytes };
    }
    current.rows.push(...rows);
    current.clientCount += 1;
    current.bytes += bytes;
  });
  if (current.clientCount > 0) groups.push(current);

  return groups.map((group, index) => ({
    fileName: buildFileName(
      date,
      group.clientCount,
      groups.length > 1 ? { index: index + 1, total: groups.length } : undefined
    ),
    content: serializeCsv(group.rows, headers),
    clientCount: group.clientCount,
    rowCount: group.rows.length,
  }));
}

const BASE_SHEET_COLUMNS = buildSheetColumns(new Set());

/** Blank spreadsheet (one row per business) with the given columns. */
export function buildSpreadsheetTemplate(
  columns: SheetColumn[] = BASE_SHEET_COLUMNS
): string {
  return (
    Papa.unparse([columns.map((column) => column.templateHeader)], {
      newline: CSV_NEWLINE,
    }) + CSV_NEWLINE
  );
}

/* ------------------------------------------------------------------------ */
/* Import                                                                   */
/* ------------------------------------------------------------------------ */

export type ImportFormat = 'bulk-upload' | 'spreadsheet' | 'positional';

export interface ImportResult {
  format: ImportFormat;
  clients: ClientDraft[];
  notes: string[];
}

export function parseDelimitedText(
  text: string,
  delimiter: string = ''
): string[][] {
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), {
    delimiter,
    skipEmptyLines: 'greedy',
  });
  return result.data.filter((row) => row.some((cell) => cell.trim() !== ''));
}

const SHEET_HEADER_LOOKUP = new Map<string, ColumnId>();
for (const column of ALL_SHEET_COLUMNS) {
  for (const spelling of [column.templateHeader, ...column.aliases]) {
    const key = normalizeKey(spelling);
    if (!SHEET_HEADER_LOOKUP.has(key)) SHEET_HEADER_LOOKUP.set(key, column.id);
  }
}

/** Maps a header row to spreadsheet columns, or returns null if it isn't a header. */
export function matchGridHeader(
  row: string[]
): (ColumnId | undefined)[] | null {
  const mapped = row.map((cell) => SHEET_HEADER_LOOKUP.get(normalizeKey(cell)));
  const matches = mapped.filter(Boolean).length;
  return matches >= 2 || (row.length === 1 && matches === 1) ? mapped : null;
}

export function isBulkUploadHeader(row: string[]): boolean {
  const keys = new Set(row.map(normalizeKey));
  return keys.has('partytype') && keys.has('externalid');
}

function rowsToClients(
  rows: string[][],
  columns: (ColumnId | undefined)[],
  firstRowNumber: number,
  notes: string[]
): ClientDraft[] {
  const clients: ClientDraft[] = [];
  rows.forEach((row, rowIndex) => {
    let client = createClient({ touched: true });
    columns.forEach((column, columnIndex) => {
      if (!column) return;
      const cell = row[columnIndex] ?? '';
      if (column === 'isBeneficialOwner' && parseYesNo(cell) === undefined) {
        notes.push(
          `Row ${firstRowNumber + rowIndex}: "${cell}" isn't Yes or No — left unticked`
        );
      }
      client = setCellValue(client, column, cell);
    });
    if (!isClientBlank(client)) clients.push(client);
  });
  return clients;
}

function importSpreadsheet(
  rows: string[][],
  positionalColumns: ColumnId[]
): ImportResult {
  const notes: string[] = [];
  const headerColumns = matchGridHeader(rows[0] ?? []);
  if (headerColumns) {
    const retired = new Set(RETIRED_TEMPLATE_HEADERS.map(normalizeKey));
    const ignored = rows[0].filter(
      (cell, i) =>
        cell.trim() && !headerColumns[i] && !retired.has(normalizeKey(cell))
    );
    if (ignored.length > 0) {
      notes.push(`Ignored columns: ${ignored.join(', ')}`);
    }
    return {
      format: 'spreadsheet',
      clients: rowsToClients(rows.slice(1), headerColumns, 2, notes),
      notes,
    };
  }
  const widest = Math.max(0, ...rows.map((row) => row.length));
  if (widest > positionalColumns.length) {
    notes.push(
      `Rows have ${widest} columns; only the first ${positionalColumns.length} were used`
    );
  }
  return {
    format: 'positional',
    clients: rowsToClients(rows, positionalColumns, 1, notes),
    notes,
  };
}

interface ImportedPerson {
  person: PersonDraft;
  roles: Set<string>;
  rowNumber: number;
  originalId: string;
}

function displayName(person: PersonDraft): string {
  return `${person.firstName} ${person.lastName}`.trim() || 'this person';
}

/**
 * Each business has one controller, who is also the authorized user; anyone
 * else must be a beneficial owner. Picks the controller from the imported
 * roles and explains every role that had to change.
 */
function assignControllerRoles(
  entries: ImportedPerson[],
  label: string,
  notes: string[]
): { controller?: ImportedPerson; others: ImportedPerson[] } {
  const has = (entry: ImportedPerson, role: string) => entry.roles.has(role);
  const controller =
    entries.find(
      (e) => has(e, ROLES.CONTROLLER) && has(e, ROLES.AUTHORIZED_USER)
    ) ??
    entries.find((e) => has(e, ROLES.AUTHORIZED_USER)) ??
    entries.find((e) => has(e, ROLES.CONTROLLER));

  if (!controller) {
    notes.push(
      `${label} has no controller — add the person who completes onboarding`
    );
  } else if (!has(controller, ROLES.CONTROLLER)) {
    notes.push(
      `Row ${controller.rowNumber}: CONTROLLER role added — the authorized user must also be the controller`
    );
  } else if (!has(controller, ROLES.AUTHORIZED_USER)) {
    notes.push(
      `Row ${controller.rowNumber}: AUTHORIZED_USER role added to the controller — they receive the email to set up a login`
    );
  }

  const others: ImportedPerson[] = [];
  for (const entry of entries) {
    if (entry === controller) continue;
    const extraRoles = [ROLES.CONTROLLER, ROLES.AUTHORIZED_USER].filter(
      (role) => has(entry, role)
    );
    if (has(entry, ROLES.BENEFICIAL_OWNER)) {
      others.push(entry);
      if (extraRoles.length > 0) {
        notes.push(
          `Row ${entry.rowNumber}: ${extraRoles.join(' and ')} removed from ${displayName(entry.person)} — each business has one controller; kept as a beneficial owner`
        );
      }
    } else {
      notes.push(
        `Row ${entry.rowNumber}: ${displayName(entry.person)} left out — each business has one controller, and anyone else must be a beneficial owner (25%+)`
      );
    }
  }
  return { controller, others };
}

interface PartyRecord {
  rowNumber: number;
  get: (header: string) => string;
  roles: string[];
}

function importBulkUpload(rows: string[][]): ImportResult {
  const notes: string[] = [];
  const [header, ...dataRows] = rows;
  const indexByHeader = new Map<string, number>();
  const knownCore = new Map(CSV_HEADERS.map((h) => [normalizeKey(h), h]));
  const roleColumns: number[] = [];
  const ignored: string[] = [];

  header.forEach((cell, index) => {
    const name = cell.trim();
    if (/^roles\.\d+$/i.test(name)) {
      roleColumns.push(index);
      return;
    }
    const core = knownCore.get(normalizeKey(name));
    if (core) indexByHeader.set(core.toLowerCase(), index);
    else if (isSupportedDetailColumn(name))
      indexByHeader.set(name.toLowerCase(), index);
    else if (name) ignored.push(name);
  });
  if (ignored.length > 0) {
    notes.push(
      `Ignored columns this tool doesn't support: ${ignored.slice(0, 8).join(', ')}${ignored.length > 8 ? ` and ${ignored.length - 8} more` : ''}`
    );
  }

  const records: PartyRecord[] = dataRows.map((row, i) => ({
    rowNumber: i + 2,
    get: (path) => {
      const index = indexByHeader.get(path.toLowerCase());
      return index === undefined ? '' : cleanCell(row[index] ?? '').trim();
    },
    roles: roleColumns
      .map((index) => (row[index] ?? '').trim().toUpperCase())
      .filter(Boolean),
  }));

  const isOrganization = (record: PartyRecord) => {
    const partyType = record.get('partyType').toUpperCase();
    if (partyType === PARTY_TYPE.ORGANIZATION) return true;
    if (partyType === PARTY_TYPE.INDIVIDUAL) return false;
    return (
      record.roles.includes(ROLES.CLIENT) || !record.get('parentExternalId')
    );
  };

  const clients: ClientDraft[] = [];
  const clientById = new Map<string, ClientDraft>();
  const peopleByClient = new Map<ClientDraft, ImportedPerson[]>();
  let renumbered = 0;

  for (const record of records.filter(isOrganization)) {
    const externalId = record.get('externalId');
    const client = createClient({
      externalId,
      organizationName: record.get('organizationDetails.organizationName'),
      organizationType: normalizeOrganizationType(
        record.get('organizationDetails.organizationType')
      ),
      email: record.get('email'),
      people: [],
      details: readBusinessDetails(
        record.get,
        notes,
        `Row ${record.rowNumber}`
      ),
      touched: true,
    });
    const country = record.get('organizationDetails.countryOfFormation');
    if (country && country.toUpperCase() !== FIXED_VALUES.countryOfFormation) {
      notes.push(
        `Row ${record.rowNumber}: country of formation "${country}" changed to US — this file supports US businesses only`
      );
    }
    clients.push(client);
    peopleByClient.set(client, []);
    if (externalId && !clientById.has(externalId)) {
      clientById.set(externalId, client);
    }
  }

  for (const record of records.filter((r) => !isOrganization(r))) {
    const parentId = record.get('parentExternalId');
    let client = clientById.get(parentId);
    if (!client) {
      client = createClient({
        externalId: parentId,
        people: [],
        touched: true,
      });
      clients.push(client);
      peopleByClient.set(client, []);
      if (parentId) clientById.set(parentId, client);
      notes.push(
        parentId
          ? `Row ${record.rowNumber}: no business row for client ID "${parentId}" — added an empty business to complete`
          : `Row ${record.rowNumber}: person has no parentExternalId — added an empty business to complete`
      );
    }
    if (record.get('products.0')) {
      notes.push(
        `Row ${record.rowNumber}: product removed from a person row (it belongs on the business row only)`
      );
    }
    const country = record.get('individualDetails.countryOfResidence');
    if (country && country.toUpperCase() !== FIXED_VALUES.countryOfResidence) {
      notes.push(
        `Row ${record.rowNumber}: country of residence "${country}" changed to US — this file supports US residents only`
      );
    }
    const person = createPerson({
      firstName: record.get('individualDetails.firstName'),
      middleName: record.get('individualDetails.middleName'),
      lastName: record.get('individualDetails.lastName'),
      email: record.get('email'),
      isBeneficialOwner: record.roles.includes(ROLES.BENEFICIAL_OWNER),
      details: readPersonDetails(record.get, notes, `Row ${record.rowNumber}`),
    });
    const list = peopleByClient.get(client) ?? [];
    list.push({
      person,
      roles: new Set(record.roles),
      rowNumber: record.rowNumber,
      originalId: record.get('externalId'),
    });
    peopleByClient.set(client, list);
  }

  const finalClients = clients.map((client) => {
    const entries = peopleByClient.get(client) ?? [];
    const label = client.externalId
      ? `Client "${client.externalId}"`
      : 'A client';
    const { controller, others } = assignControllerRoles(entries, label, notes);
    const ordered = controller ? [controller, ...others] : others;
    ordered.forEach((entry, index) => {
      const ordinal = controller ? index + 1 : index + 2;
      const expectedId = buildPersonExternalId(client.externalId, ordinal);
      if (entry.originalId && entry.originalId !== expectedId) renumbered += 1;
    });
    const people = [
      controller?.person ?? createPerson(),
      ...others.map((entry) => entry.person),
    ];
    return { ...client, people };
  });

  if (renumbered > 0) {
    notes.push(
      `${renumbered} person ID${renumbered === 1 ? ' was' : 's were'} renumbered to the <client ID>_1, _2 … pattern`
    );
  }

  return { format: 'bulk-upload', clients: finalClients, notes };
}

/**
 * Accepts the bulk upload CSV itself (to check or fix an existing file), the
 * blank spreadsheet template, or rows copied from any spreadsheet in the
 * on-screen column order.
 */
export function importFromText(
  text: string,
  options: { positionalColumns?: ColumnId[] } = {}
): ImportResult {
  const rows = parseDelimitedText(text);
  if (rows.length === 0) {
    return { format: 'positional', clients: [], notes: ['No rows found'] };
  }
  if (isBulkUploadHeader(rows[0])) return importBulkUpload(rows);
  return importSpreadsheet(rows, options.positionalColumns ?? BASE_COLUMN_IDS);
}
