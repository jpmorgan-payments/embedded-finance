import {
  DETAIL_FIELDS,
  DETAIL_GROUPS,
  getGroup,
  lowerFirst,
  type DetailField,
  type DetailFieldId,
  type DetailGroupId,
} from './details';
import { GRID_COLUMNS, type GridColumn, type GridColumnKey } from './model';

export type ColumnId = GridColumnKey | DetailFieldId;

export interface SheetColumn {
  id: ColumnId;
  label: string;
  /** Header in the spreadsheet template; also recognized on import. */
  templateHeader: string;
  /** Other headers recognized on import (e.g. from earlier template versions). */
  aliases: string[];
  section: 'business' | 'controller';
  /** Optional group the column belongs to; undefined for the core columns. */
  group?: DetailGroupId;
  base?: GridColumn;
  detail?: DetailField;
}

const BUSINESS_BASE: GridColumnKey[] = [
  'externalId',
  'organizationName',
  'organizationType',
  'email',
];
const PERSON_BASE: GridColumnKey[] = [
  'firstName',
  'middleName',
  'lastName',
  'personEmail',
  'isBeneficialOwner',
];

function baseColumn(key: GridColumnKey): SheetColumn {
  const base = GRID_COLUMNS.find((column) => column.key === key)!;
  return {
    id: key,
    label: base.label,
    templateHeader: base.templateHeader,
    aliases: [base.label, ...base.aliases],
    section: BUSINESS_BASE.includes(key) ? 'business' : 'controller',
    base,
  };
}

function detailColumn(field: DetailField): SheetColumn {
  const isBusiness = field.id.startsWith('business.');
  const templateHeader = isBusiness
    ? /^(Business|DBA|NAICS|Year|Website)/.test(field.label)
      ? field.label
      : `Business ${lowerFirst(field.label)}`
    : `Controller ${lowerFirst(field.label)}`;
  return {
    id: field.id,
    label: field.label,
    templateHeader,
    aliases: isBusiness ? [] : [`Authorized user ${lowerFirst(field.label)}`],
    section: isBusiness ? 'business' : 'controller',
    group: field.group,
    detail: field,
  };
}

/** Core columns plus the optional groups that are switched on, in display order. */
export function buildSheetColumns(
  visibleGroups: ReadonlySet<DetailGroupId>
): SheetColumn[] {
  const detailsFor = (party: 'business' | 'person') =>
    DETAIL_FIELDS.filter(
      (field) =>
        getGroup(field.group).party === party && visibleGroups.has(field.group)
    ).map(detailColumn);
  return [
    ...BUSINESS_BASE.map(baseColumn),
    ...detailsFor('business'),
    ...PERSON_BASE.map(baseColumn),
    ...detailsFor('person'),
  ];
}

export const ALL_GROUP_IDS = new Set<DetailGroupId>(
  DETAIL_GROUPS.map((group) => group.id)
);

/** Every column the spreadsheet can show; used to recognize imported headers. */
export const ALL_SHEET_COLUMNS = buildSheetColumns(ALL_GROUP_IDS);

export const BASE_COLUMN_IDS: ColumnId[] = GRID_COLUMNS.map(
  (column) => column.key
);
