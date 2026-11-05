/**
 * Client-centric draft model. Users think in "businesses and their people",
 * so the UI edits this shape and the CSV builder flattens it into one row per
 * party. `people[0]` is always the authorized user (the invitation recipient).
 */

export interface PersonDraft {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  isBeneficialOwner: boolean;
  isController: boolean;
}

export interface ClientDraft {
  id: string;
  externalId: string;
  organizationName: string;
  organizationType: string;
  /** Business email. Blank means "use the authorized user's email". */
  email: string;
  people: PersonDraft[];
  /** Set once the user has edited or imported this client; gates error display. */
  touched: boolean;
}

export type ClientField =
  'externalId' | 'organizationName' | 'organizationType' | 'email';
export type PersonField = 'firstName' | 'middleName' | 'lastName' | 'email';
export type PersonRoleFlag = 'isBeneficialOwner' | 'isController';
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
    isController: false,
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
    !person.isController
  );
}

/** Completely empty rows are ignored by validation and the export. */
export function isClientBlank(client: ClientDraft): boolean {
  return (
    !client.externalId.trim() &&
    !client.organizationName.trim() &&
    !client.organizationType.trim() &&
    !client.email.trim() &&
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
  | 'isBeneficialOwner'
  | 'isController';

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
    templateHeader: 'Authorized user first name',
    aliases: ['First name', 'individualDetails.firstName'],
  },
  {
    key: 'middleName',
    label: 'Middle name',
    templateHeader: 'Authorized user middle name (optional)',
    aliases: [
      'Middle name',
      'Authorized user middle name',
      'individualDetails.middleName',
    ],
  },
  {
    key: 'lastName',
    label: 'Last name',
    templateHeader: 'Authorized user last name',
    aliases: ['Last name', 'individualDetails.lastName'],
  },
  {
    key: 'personEmail',
    label: 'Email',
    templateHeader: 'Authorized user email',
    aliases: ['Authorized user email address', 'Invitation email'],
  },
  {
    key: 'isBeneficialOwner',
    label: 'Owner 25%+',
    templateHeader: 'Authorized user owns 25% or more (Y/N)',
    aliases: [
      'Authorized user is beneficial owner',
      'Authorized user is beneficial owner (Y/N)',
      'Beneficial owner',
    ],
  },
  {
    key: 'isController',
    label: 'Controller',
    templateHeader: 'Authorized user is controller (Y/N)',
    aliases: ['Authorized user is controller', 'Controller'],
  },
];
