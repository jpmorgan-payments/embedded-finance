/**
 * Bulk client upload file format, as described in the upload instructions.
 *
 * Each column header is an API field name (dot notation, e.g. `roles.0`), so
 * header names and coded values must match exactly. Businesses and
 * individuals each get their own row; individuals link to their business
 * through `parentExternalId`.
 */
import type { OrganizationType, Role } from '@ef-api/smbdo-schemas';

export const CSV_HEADERS = [
  'partyType',
  'roles.0',
  'roles.1',
  'roles.2',
  'externalId',
  'parentExternalId',
  'email',
  'organizationDetails.organizationName',
  'organizationDetails.organizationType',
  'organizationDetails.countryOfFormation',
  'products.0',
  'individualDetails.firstName',
  'individualDetails.middleName',
  'individualDetails.lastName',
  'individualDetails.countryOfResidence',
] as const;

export type CsvHeader = (typeof CSV_HEADERS)[number];
export type CsvRow = Record<CsvHeader, string>;

export const PARTY_TYPE = {
  ORGANIZATION: 'ORGANIZATION',
  INDIVIDUAL: 'INDIVIDUAL',
} as const;

export const ROLES = {
  CLIENT: 'CLIENT',
  AUTHORIZED_USER: 'AUTHORIZED_USER',
  BENEFICIAL_OWNER: 'BENEFICIAL_OWNER',
  CONTROLLER: 'CONTROLLER',
} as const satisfies Partial<Record<Role, Role>>;

export const FIXED_VALUES = {
  countryOfFormation: 'US',
  countryOfResidence: 'US',
  product: 'EMBEDDED_PAYMENTS',
} as const;

export const LIMITS = {
  externalIdMax: 50,
  organizationNameMax: 500,
  emailMax: 320,
  emailLocalMax: 64,
  emailDomainMax: 255,
  firstNameMax: 40,
  middleNameMax: 30,
  lastNameMax: 40,
  maxBeneficialOwners: 4,
  maxDataRowsPerFile: 10_000,
  maxFileBytes: 10 * 1024 * 1024,
} as const;

/** Allowed characters for first, middle and last names (API pattern). */
export const NAME_PATTERN = /^[a-zA-Z0-9()_/&+%@#;,.: \-']*$/;
export const NAME_ALLOWED_CHAR = /[a-zA-Z0-9()_/&+%@#;,.: \-']/;

export interface OrganizationTypeOption {
  value: OrganizationType;
  label: string;
  /** Extra spellings accepted when pasting or importing. */
  aliases: string[];
}

export const ORGANIZATION_TYPES: OrganizationTypeOption[] = [
  {
    value: 'LIMITED_LIABILITY_COMPANY',
    label: 'Limited liability company (LLC)',
    aliases: ['LLC', 'L.L.C.'],
  },
  {
    value: 'C_CORPORATION',
    label: 'C corporation',
    aliases: ['C corp', 'C-corp'],
  },
  {
    value: 'S_CORPORATION',
    label: 'S corporation',
    aliases: ['S corp', 'S-corp'],
  },
  {
    value: 'SOLE_PROPRIETORSHIP',
    label: 'Sole proprietorship',
    aliases: ['Sole prop', 'Sole proprietor'],
  },
  {
    value: 'GENERAL_PARTNERSHIP',
    label: 'General partnership',
    aliases: ['GP'],
  },
  {
    value: 'LIMITED_PARTNERSHIP',
    label: 'Limited partnership (LP)',
    aliases: ['LP'],
  },
  {
    value: 'LIMITED_LIABILITY_PARTNERSHIP',
    label: 'Limited liability partnership (LLP)',
    aliases: ['LLP'],
  },
];

export function getOrganizationTypeLabel(value: string): string | undefined {
  return ORGANIZATION_TYPES.find((option) => option.value === value)?.label;
}
