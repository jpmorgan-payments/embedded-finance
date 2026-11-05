import Papa from 'papaparse';

import { setGridValue } from './grid-values';
import {
  createClient,
  createPerson,
  getAdditionalPeople,
  getEffectiveBusinessEmail,
  GRID_COLUMNS,
  isClientBlank,
  type ClientDraft,
  type GridColumnKey,
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
  type CsvHeader,
  type CsvRow,
} from './schema';
import { buildPersonExternalId } from './validate';

const CSV_NEWLINE = '\r\n';

function emptyRow(): CsvRow {
  return Object.fromEntries(CSV_HEADERS.map((h) => [h, ''])) as CsvRow;
}

function personRoles(person: PersonDraft, isAuthorizedUser: boolean): string[] {
  const roles: string[] = [];
  if (person.isBeneficialOwner) roles.push(ROLES.BENEFICIAL_OWNER);
  if (person.isController) roles.push(ROLES.CONTROLLER);
  if (isAuthorizedUser) roles.push(ROLES.AUTHORIZED_USER);
  return roles;
}

/**
 * One business row plus one row per person. Roles are packed into
 * roles.0..2 without gaps, and `products.0` belongs on the business row only
 * (it is not an individual field in the upload instructions).
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
    };
    roles.forEach((role, roleIndex) => {
      row[`roles.${roleIndex}` as CsvHeader] = role;
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

function serializeLines(rows: CsvRow[], includeHeader: boolean): string {
  const text = Papa.unparse(
    {
      fields: [...CSV_HEADERS],
      data: rows.map((row) => CSV_HEADERS.map((header) => row[header])),
    },
    { newline: CSV_NEWLINE, header: includeHeader, quotes: false }
  );
  return text ? text + CSV_NEWLINE : '';
}

/** UTF-8 without a byte order mark, so the first header name stays exact. */
export function serializeCsv(rows: CsvRow[]): string {
  return serializeLines(rows, true);
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
 * stay in the same file.
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
  const headerBytes = byteLength(serializeLines([], true));

  const groups: { rows: CsvRow[]; clientCount: number; bytes: number }[] = [];
  let current = { rows: [] as CsvRow[], clientCount: 0, bytes: headerBytes };

  clients
    .filter((client) => !isClientBlank(client))
    .forEach((client) => {
      const rows = buildClientRows(client);
      const bytes = byteLength(serializeLines(rows, false));
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
    content: serializeCsv(group.rows),
    clientCount: group.clientCount,
    rowCount: group.rows.length,
  }));
}

/** Blank spreadsheet (one row per business) for collecting data in Excel. */
export function buildSpreadsheetTemplate(): string {
  return (
    Papa.unparse([GRID_COLUMNS.map((column) => column.templateHeader)], {
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

const GRID_HEADER_LOOKUP = new Map<string, GridColumnKey>();
for (const column of GRID_COLUMNS) {
  for (const spelling of [
    column.templateHeader,
    column.label,
    ...column.aliases,
  ]) {
    const key = normalizeKey(spelling);
    if (!GRID_HEADER_LOOKUP.has(key)) GRID_HEADER_LOOKUP.set(key, column.key);
  }
}

/** Maps a header row to grid columns, or returns null if it isn't a header. */
export function matchGridHeader(
  row: string[]
): (GridColumnKey | undefined)[] | null {
  const mapped = row.map((cell) => GRID_HEADER_LOOKUP.get(normalizeKey(cell)));
  const matches = mapped.filter(Boolean).length;
  return matches >= 2 || (row.length === 1 && matches === 1) ? mapped : null;
}

export function isBulkUploadHeader(row: string[]): boolean {
  const keys = new Set(row.map(normalizeKey));
  return keys.has('partytype') && keys.has('externalid');
}

function rowsToClients(
  rows: string[][],
  columns: (GridColumnKey | undefined)[],
  firstRowNumber: number,
  notes: string[]
): ClientDraft[] {
  const clients: ClientDraft[] = [];
  rows.forEach((row, rowIndex) => {
    let client = createClient({ touched: true });
    columns.forEach((key, columnIndex) => {
      if (!key) return;
      const cell = row[columnIndex] ?? '';
      if (
        (key === 'isBeneficialOwner' || key === 'isController') &&
        parseYesNo(cell) === undefined
      ) {
        notes.push(
          `Row ${firstRowNumber + rowIndex}: "${cell}" isn't Yes or No — left unticked`
        );
      }
      client = setGridValue(client, key, cell);
    });
    if (!isClientBlank(client)) clients.push(client);
  });
  return clients;
}

function importSpreadsheet(rows: string[][]): ImportResult {
  const notes: string[] = [];
  const headerColumns = matchGridHeader(rows[0] ?? []);
  if (headerColumns) {
    const ignored = rows[0].filter(
      (cell, i) => cell.trim() && !headerColumns[i]
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
  const columns = GRID_COLUMNS.map((column) => column.key);
  const widest = Math.max(0, ...rows.map((row) => row.length));
  if (widest > columns.length) {
    notes.push(
      `Rows have ${widest} columns; only the first ${columns.length} were used`
    );
  }
  return {
    format: 'positional',
    clients: rowsToClients(rows, columns, 1, notes),
    notes,
  };
}

interface PartyRecord {
  rowNumber: number;
  get: (header: CsvHeader) => string;
  roles: string[];
}

function importBulkUpload(rows: string[][]): ImportResult {
  const notes: string[] = [];
  const [header, ...dataRows] = rows;
  const indexByHeader = new Map<CsvHeader, number>();
  const knownByKey = new Map(CSV_HEADERS.map((h) => [normalizeKey(h), h]));
  const roleColumns: number[] = [];
  const ignored: string[] = [];

  header.forEach((cell, index) => {
    const known = knownByKey.get(normalizeKey(cell));
    if (/^roles\.\d+$/i.test(cell.trim())) roleColumns.push(index);
    if (known) indexByHeader.set(known, index);
    else if (cell.trim() && !/^roles\.\d+$/i.test(cell.trim()))
      ignored.push(cell.trim());
  });
  if (ignored.length > 0) {
    notes.push(
      `Ignored columns this file doesn't use: ${ignored.slice(0, 8).join(', ')}${ignored.length > 8 ? ` and ${ignored.length - 8} more` : ''}`
    );
  }

  const records: PartyRecord[] = dataRows.map((row, i) => ({
    rowNumber: i + 2,
    get: (h) => {
      const index = indexByHeader.get(h);
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
  const peopleByClient = new Map<
    ClientDraft,
    {
      person: PersonDraft;
      isAuthorizedUser: boolean;
      rowNumber: number;
      originalId: string;
    }[]
  >();
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
      isController: record.roles.includes(ROLES.CONTROLLER),
    });
    const list = peopleByClient.get(client) ?? [];
    list.push({
      person,
      isAuthorizedUser: record.roles.includes(ROLES.AUTHORIZED_USER),
      rowNumber: record.rowNumber,
      originalId: record.get('externalId'),
    });
    peopleByClient.set(client, list);
  }

  const finalClients = clients.map((client) => {
    const entries = peopleByClient.get(client) ?? [];
    const authorizedUsers = entries.filter((entry) => entry.isAuthorizedUser);
    const label = client.externalId
      ? `Client "${client.externalId}"`
      : 'A client';
    if (authorizedUsers.length === 0) {
      notes.push(
        `${label} has no authorized user — add the person who should receive the invitation`
      );
    } else if (authorizedUsers.length > 1) {
      notes.push(
        `${label} had ${authorizedUsers.length} authorized users; only one is allowed. Kept row ${authorizedUsers[0].rowNumber}, the others are listed as additional people`
      );
    }
    const primary = authorizedUsers[0];
    const ordered = primary
      ? [primary, ...entries.filter((entry) => entry !== primary)]
      : entries;
    ordered.forEach((entry, index) => {
      const ordinal = primary ? index + 1 : index + 2;
      const expectedId = buildPersonExternalId(client.externalId, ordinal);
      if (entry.originalId && entry.originalId !== expectedId) renumbered += 1;
    });
    const people = [
      primary?.person ?? createPerson(),
      ...ordered
        .filter((entry) => entry !== primary)
        .map((entry) => entry.person),
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
export function importFromText(text: string): ImportResult {
  const rows = parseDelimitedText(text);
  if (rows.length === 0) {
    return { format: 'positional', clients: [], notes: ['No rows found'] };
  }
  if (isBulkUploadHeader(rows[0])) return importBulkUpload(rows);
  return importSpreadsheet(rows);
}
