/**
 * Client-centric draft model. Users think in "businesses and their people",
 * so the UI edits this shape and the CSV builder flattens it into one row per
 * party. `people[0]` is always the controller, who is also the authorized
 * user (completes onboarding and receives the login email). Anyone else is a
 * beneficial owner.
 */
import { hasDetailValues, type DetailValues } from './details';

export interface PersonDraft {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  /** Only used for the controller; other people are always beneficial owners. */
  isBeneficialOwner: boolean;
  /** Optional details (birth date, phone, home address, ID…). */
  details: DetailValues;
}

export interface ClientDraft {
  id: string;
  externalId: string;
  organizationName: string;
  organizationType: string;
  /** Business email. Blank means "use the controller's email". */
  email: string;
  people: PersonDraft[];
  /** Optional business details (DBA, phone, address, tax ID…). */
  details: DetailValues;
  /** Set once the user has edited or imported this client; gates error display. */
  touched: boolean;
}

export type ClientField =
  'externalId' | 'organizationName' | 'organizationType' | 'email';
export type PersonField = 'firstName' | 'middleName' | 'lastName' | 'email';
export type PersonRoleFlag = 'isBeneficialOwner';
export type NameField = 'firstName' | 'middleName' | 'lastName';

let sequence = 0;
export function createId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

export function createPerson(
  overrides: Partial<PersonDraft> = {}
): PersonDraft {
  return {
    id: createId('p'),
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    isBeneficialOwner: false,
    details: {},
    ...overrides,
  };
}

export function createClient(
  overrides: Partial<ClientDraft> = {}
): ClientDraft {
  return {
    id: createId('c'),
    externalId: '',
    organizationName: '',
    organizationType: '',
    email: '',
    people: [createPerson()],
    details: {},
    touched: false,
    ...overrides,
  };
}

export function isPersonBlank(person: PersonDraft): boolean {
  return (
    !person.firstName.trim() &&
    !person.middleName.trim() &&
    !person.lastName.trim() &&
    !person.email.trim() &&
    !person.isBeneficialOwner &&
    !hasDetailValues(person.details)
  );
}

/** Completely empty rows are ignored by validation and the export. */
export function isClientBlank(client: ClientDraft): boolean {
  return (
    !client.externalId.trim() &&
    !client.organizationName.trim() &&
    !client.organizationType.trim() &&
    !client.email.trim() &&
    !hasDetailValues(client.details) &&
    client.people.every(isPersonBlank)
  );
}

/** Additional people (owners / controllers) that will be written to the file. */
export function getAdditionalPeople(client: ClientDraft): PersonDraft[] {
  return client.people.slice(1).filter((person) => !isPersonBlank(person));
}

export function getEffectiveBusinessEmail(client: ClientDraft): string {
  return client.email.trim() || (client.people[0]?.email.trim() ?? '');
}

/**
 * Spreadsheet columns, in order. Shared by the grid, Excel paste, the blank
 * spreadsheet template, and spreadsheet import.
 */
export type GridColumnKey =
  | 'externalId'
  | 'organizationName'
  | 'organizationType'
  | 'email'
  | 'firstName'
  | 'middleName'
  | 'lastName'
  | 'personEmail'
  | 'isBeneficialOwner';

export interface GridColumn {
  key: GridColumnKey;
  label: string;
  /** Header text in the downloadable spreadsheet template. */
  templateHeader: string;
  aliases: string[];
}

export const GRID_COLUMNS: GridColumn[] = [
  {
    key: 'externalId',
    label: 'Client ID',
    templateHeader: 'Client ID',
    aliases: ['externalId', 'Client external ID', 'Seller ID', 'Merchant ID'],
  },
  {
    key: 'organizationName',
    label: 'Legal business name',
    templateHeader: 'Legal business name',
    aliases: [
      'organizationDetails.organizationName',
      'Business name',
      'Legal name',
      'Organization name',
      'Company name',
    ],
  },
  {
    key: 'organizationType',
    label: 'Business type',
    templateHeader: 'Business type',
    aliases: [
      'organizationDetails.organizationType',
      'Organization type',
      'Entity type',
      'Legal structure',
    ],
  },
  {
    key: 'email',
    label: 'Business email',
    templateHeader: 'Business email (optional)',
    aliases: ['Business email', 'Organization email', 'Company email'],
  },
  {
    key: 'firstName',
    label: 'First name',
    templateHeader: 'Controller first name',
    aliases: [
      'First name',
      'individualDetails.firstName',
      'Authorized user first name',
    ],
  },
  {
    key: 'middleName',
    label: 'Middle name',
    templateHeader: 'Controller middle name (optional)',
    aliases: [
      'Middle name',
      'Controller middle name',
      'individualDetails.middleName',
      'Authorized user middle name',
      'Authorized user middle name (optional)',
    ],
  },
  {
    key: 'lastName',
    label: 'Last name',
    templateHeader: 'Controller last name',
    aliases: [
      'Last name',
      'individualDetails.lastName',
      'Authorized user last name',
    ],
  },
  {
    key: 'personEmail',
    label: 'Email',
    templateHeader: 'Controller email',
    aliases: [
      'Controller email address',
      'Authorized user email',
      'Authorized user email address',
      'Invitation email',
    ],
  },
  {
    key: 'isBeneficialOwner',
    label: 'Owner 25%+',
    templateHeader: 'Controller owns 25% or more (Y/N)',
    aliases: [
      'Controller is beneficial owner',
      'Controller is beneficial owner (Y/N)',
      'Authorized user owns 25% or more (Y/N)',
      'Authorized user is beneficial owner',
      'Authorized user is beneficial owner (Y/N)',
      'Beneficial owner',
    ],
  },
];

/** Headers from earlier template versions that are no longer needed. */
export const RETIRED_TEMPLATE_HEADERS = [
  'Authorized user is controller (Y/N)',
  'Authorized user is controller',
];
