/**
 * Optional details that can be added for the business and for each
 * individual. Field paths and rules follow the public create-client API
 * reference; where the published rule and the checks applied when the file is
 * processed differ, the stricter of the two applies so a file that passes
 * here is not rejected later. Only US businesses and US residents are
 * supported.
 */
import {
  cleanCell,
  findInvalidNameChars,
  normalizeKey,
  suggestNameFix,
  transliterateName,
} from './normalize';

export type PartyKind = 'business' | 'person';

/** Lowercases a leading capitalized word but keeps acronyms (ID, ZIP, NAICS). */
export const lowerFirst = (text: string) =>
  text.replace(
    /^([A-Z])([a-z])/,
    (_, first: string, second: string) => first.toLowerCase() + second
  );

export type DetailGroupId =
  | 'businessProfile'
  | 'businessPhone'
  | 'businessAddress'
  | 'businessTaxId'
  | 'personProfile'
  | 'personPhone'
  | 'personAddress'
  | 'personId';

export type DetailFieldId =
  | 'business.dbaName'
  | 'business.description'
  | 'business.naics'
  | 'business.yearOfFormation'
  | 'business.website'
  | 'business.phone'
  | 'business.addressType'
  | 'business.addressLine1'
  | 'business.addressLine2'
  | 'business.city'
  | 'business.state'
  | 'business.postalCode'
  | 'business.taxIdType'
  | 'business.taxId'
  | 'person.nameSuffix'
  | 'person.birthDate'
  | 'person.jobTitle'
  | 'person.jobTitleDescription'
  | 'person.natureOfOwnership'
  | 'person.language'
  | 'person.phone'
  | 'person.addressLine1'
  | 'person.addressLine2'
  | 'person.city'
  | 'person.state'
  | 'person.postalCode'
  | 'person.idType'
  | 'person.idValue';

export type DetailValues = Partial<Record<DetailFieldId, string>>;

export interface DetailOption {
  value: string;
  label: string;
  aliases?: string[];
}

export interface DetailGroup {
  id: DetailGroupId;
  party: PartyKind;
  label: string;
  description: string;
}

export interface DetailField {
  id: DetailFieldId;
  group: DetailGroupId;
  label: string;
  hint?: string;
  placeholder?: string;
  input: 'text' | 'select' | 'textarea';
  options?: DetailOption[];
  /** Used on export when the field is left blank but its group is filled in. */
  defaultValue?: string;
  sensitive?: boolean;
  /** Tailwind width for the spreadsheet column. */
  width: string;
}

export const DETAIL_GROUPS: DetailGroup[] = [
  {
    id: 'businessProfile',
    party: 'business',
    label: 'Business profile',
    description: 'DBA name, description, NAICS code, year formed, website',
  },
  {
    id: 'businessPhone',
    party: 'business',
    label: 'Business phone',
    description: 'US phone number',
  },
  {
    id: 'businessAddress',
    party: 'business',
    label: 'Business address',
    description: 'US street address (no PO boxes)',
  },
  {
    id: 'businessTaxId',
    party: 'business',
    label: 'Business tax ID',
    description: 'EIN, or SSN/ITIN for sole proprietorships and LLCs',
  },
  {
    id: 'personProfile',
    party: 'person',
    label: 'Personal details',
    description: 'Birth date, job title, suffix, ownership, language',
  },
  {
    id: 'personPhone',
    party: 'person',
    label: 'Personal phone',
    description: 'US phone number',
  },
  {
    id: 'personAddress',
    party: 'person',
    label: 'Home address',
    description: 'US residential address (no PO boxes)',
  },
  {
    id: 'personId',
    party: 'person',
    label: 'Personal ID',
    description: 'SSN, ITIN, passport or driver’s license',
  },
];

export const US_STATES: DetailOption[] = [
  ['AL', 'Alabama'],
  ['AK', 'Alaska'],
  ['AZ', 'Arizona'],
  ['AR', 'Arkansas'],
  ['CA', 'California'],
  ['CO', 'Colorado'],
  ['CT', 'Connecticut'],
  ['DE', 'Delaware'],
  ['DC', 'District of Columbia'],
  ['FL', 'Florida'],
  ['GA', 'Georgia'],
  ['HI', 'Hawaii'],
  ['ID', 'Idaho'],
  ['IL', 'Illinois'],
  ['IN', 'Indiana'],
  ['IA', 'Iowa'],
  ['KS', 'Kansas'],
  ['KY', 'Kentucky'],
  ['LA', 'Louisiana'],
  ['ME', 'Maine'],
  ['MD', 'Maryland'],
  ['MA', 'Massachusetts'],
  ['MI', 'Michigan'],
  ['MN', 'Minnesota'],
  ['MS', 'Mississippi'],
  ['MO', 'Missouri'],
  ['MT', 'Montana'],
  ['NE', 'Nebraska'],
  ['NV', 'Nevada'],
  ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'],
  ['NY', 'New York'],
  ['NC', 'North Carolina'],
  ['ND', 'North Dakota'],
  ['OH', 'Ohio'],
  ['OK', 'Oklahoma'],
  ['OR', 'Oregon'],
  ['PA', 'Pennsylvania'],
  ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'],
  ['SD', 'South Dakota'],
  ['TN', 'Tennessee'],
  ['TX', 'Texas'],
  ['UT', 'Utah'],
  ['VT', 'Vermont'],
  ['VA', 'Virginia'],
  ['WA', 'Washington'],
  ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
  ['AS', 'American Samoa'],
  ['GU', 'Guam'],
  ['MP', 'Northern Mariana Islands'],
  ['PR', 'Puerto Rico'],
  ['UM', 'U.S. Minor Outlying Islands'],
  ['VI', 'U.S. Virgin Islands'],
].map(([value, name]) => ({
  value,
  label: `${value} – ${name}`,
  aliases: [name],
}));

const BUSINESS_ADDRESS_TYPES: DetailOption[] = [
  {
    value: 'BUSINESS_ADDRESS',
    label: 'Business address',
    aliases: ['Business'],
  },
  { value: 'LEGAL_ADDRESS', label: 'Legal address', aliases: ['Legal'] },
];

const BUSINESS_TAX_ID_TYPES: DetailOption[] = [
  {
    value: 'EIN',
    label: 'EIN',
    aliases: ['Employer Identification Number', 'TIN'],
  },
  { value: 'SSN', label: 'SSN', aliases: ['Social Security Number'] },
  {
    value: 'ITIN',
    label: 'ITIN',
    aliases: ['Individual Taxpayer Identification Number'],
  },
];

const PERSON_ID_TYPES: DetailOption[] = [
  { value: 'SSN', label: 'SSN', aliases: ['Social Security Number'] },
  {
    value: 'ITIN',
    label: 'ITIN',
    aliases: ['Individual Taxpayer Identification Number'],
  },
  { value: 'PASSPORT', label: 'Passport' },
  {
    value: 'DRIVERS_LICENSE',
    label: 'Driver’s license',
    aliases: ["Driver's license", 'Drivers license', 'DL'],
  },
  {
    value: 'OTHER_GOVERNMENT_ID',
    label: 'Other government ID',
    aliases: ['Other'],
  },
];

const JOB_TITLES: DetailOption[] = [
  { value: 'CEO', label: 'CEO', aliases: ['Chief Executive Officer'] },
  { value: 'CFO', label: 'CFO', aliases: ['Chief Financial Officer'] },
  { value: 'COO', label: 'COO', aliases: ['Chief Operating Officer'] },
  { value: 'President', label: 'President' },
  {
    value: 'Chairman',
    label: 'Chairman',
    aliases: ['Chair', 'Chairperson', 'Chairwoman'],
  },
  { value: 'Senior Branch Manager', label: 'Senior Branch Manager' },
  { value: 'Other', label: 'Other' },
];

const OWNERSHIP: DetailOption[] = [
  { value: 'Direct', label: 'Direct' },
  { value: 'Indirect', label: 'Indirect' },
];

const LANGUAGES: DetailOption[] = [
  { value: 'en-US', label: 'English (US)', aliases: ['English', 'EN'] },
  {
    value: 'fr-CA',
    label: 'French (Canada)',
    aliases: ['French', 'Français', 'FR'],
  },
];

function addressFields(party: PartyKind): DetailField[] {
  const group: DetailGroupId =
    party === 'business' ? 'businessAddress' : 'personAddress';
  return [
    {
      id: `${party}.addressLine1` as DetailFieldId,
      group,
      label: 'Address line 1',
      placeholder: 'e.g. 102 Main St',
      hint: 'Street address. PO boxes and private mailboxes aren’t accepted.',
      input: 'text',
      width: 'w-56',
    },
    {
      id: `${party}.addressLine2` as DetailFieldId,
      group,
      label: 'Address line 2',
      placeholder: 'e.g. Suite 200',
      input: 'text',
      width: 'w-40',
    },
    {
      id: `${party}.city` as DetailFieldId,
      group,
      label: 'City',
      input: 'text',
      width: 'w-36',
    },
    {
      id: `${party}.state` as DetailFieldId,
      group,
      label: 'State',
      input: 'select',
      options: US_STATES,
      width: 'w-44',
    },
    {
      id: `${party}.postalCode` as DetailFieldId,
      group,
      label: 'ZIP code',
      placeholder: 'e.g. 10001',
      input: 'text',
      width: 'w-28',
    },
  ];
}

/** Column order in the spreadsheet and in the exported file. */
export const DETAIL_FIELDS: DetailField[] = [
  {
    id: 'business.dbaName',
    group: 'businessProfile',
    label: 'DBA name',
    hint: 'The name the business trades under, if different from its legal name.',
    input: 'text',
    width: 'w-48',
  },
  {
    id: 'business.description',
    group: 'businessProfile',
    label: 'Business description',
    hint: 'What the business does, 10–1,000 characters.',
    input: 'textarea',
    width: 'w-64',
  },
  {
    id: 'business.naics',
    group: 'businessProfile',
    label: 'NAICS code',
    hint: '6-digit North American Industry Classification System code.',
    placeholder: 'e.g. 722511',
    input: 'text',
    width: 'w-28',
  },
  {
    id: 'business.yearOfFormation',
    group: 'businessProfile',
    label: 'Year formed',
    placeholder: 'e.g. 2015',
    input: 'text',
    width: 'w-24',
  },
  {
    id: 'business.website',
    group: 'businessProfile',
    label: 'Website',
    placeholder: 'e.g. www.acme.com',
    input: 'text',
    width: 'w-48',
  },
  {
    id: 'business.phone',
    group: 'businessPhone',
    label: 'Business phone',
    placeholder: 'e.g. 212 555 0100',
    hint: 'US number, 10 digits.',
    input: 'text',
    width: 'w-36',
  },
  {
    id: 'business.addressType',
    group: 'businessAddress',
    label: 'Address type',
    input: 'select',
    options: BUSINESS_ADDRESS_TYPES,
    defaultValue: 'BUSINESS_ADDRESS',
    width: 'w-40',
  },
  ...addressFields('business'),
  {
    id: 'business.taxIdType',
    group: 'businessTaxId',
    label: 'Tax ID type',
    input: 'select',
    options: BUSINESS_TAX_ID_TYPES,
    defaultValue: 'EIN',
    hint: 'SSN or ITIN only for sole proprietorships and LLCs.',
    width: 'w-28',
  },
  {
    id: 'business.taxId',
    group: 'businessTaxId',
    label: 'Tax ID number',
    placeholder: 'e.g. 12-3456789',
    hint: '9 digits.',
    input: 'text',
    sensitive: true,
    width: 'w-36',
  },
  {
    id: 'person.nameSuffix',
    group: 'personProfile',
    label: 'Suffix',
    placeholder: 'e.g. Jr.',
    input: 'text',
    width: 'w-20',
  },
  {
    id: 'person.birthDate',
    group: 'personProfile',
    label: 'Birth date',
    placeholder: 'YYYY-MM-DD',
    hint: 'Must be 18 or older. MM/DD/YYYY is also accepted.',
    input: 'text',
    sensitive: true,
    width: 'w-32',
  },
  {
    id: 'person.jobTitle',
    group: 'personProfile',
    label: 'Job title',
    input: 'select',
    options: JOB_TITLES,
    width: 'w-44',
  },
  {
    id: 'person.jobTitleDescription',
    group: 'personProfile',
    label: 'Job title (if Other)',
    hint: 'Required when the job title is Other, up to 50 characters.',
    input: 'text',
    width: 'w-40',
  },
  {
    id: 'person.natureOfOwnership',
    group: 'personProfile',
    label: 'Ownership',
    hint: 'For owners: whether they own the business directly or through another entity.',
    input: 'select',
    options: OWNERSHIP,
    width: 'w-28',
  },
  {
    id: 'person.language',
    group: 'personProfile',
    label: 'Language',
    hint: 'Language for onboarding emails.',
    input: 'select',
    options: LANGUAGES,
    width: 'w-36',
  },
  {
    id: 'person.phone',
    group: 'personPhone',
    label: 'Phone',
    placeholder: 'e.g. 212 555 0100',
    hint: 'US number, 10 digits.',
    input: 'text',
    width: 'w-36',
  },
  ...addressFields('person'),
  {
    id: 'person.idType',
    group: 'personId',
    label: 'ID type',
    input: 'select',
    options: PERSON_ID_TYPES,
    defaultValue: 'SSN',
    width: 'w-40',
  },
  {
    id: 'person.idValue',
    group: 'personId',
    label: 'ID number',
    placeholder: 'e.g. 123-45-6789',
    input: 'text',
    sensitive: true,
    width: 'w-36',
  },
];

const FIELD_BY_ID = new Map(DETAIL_FIELDS.map((field) => [field.id, field]));

export function getDetailField(id: DetailFieldId): DetailField {
  const field = FIELD_BY_ID.get(id);
  if (!field) throw new Error(`Unknown detail field ${id}`);
  return field;
}

export function isDetailFieldId(value: string): value is DetailFieldId {
  return FIELD_BY_ID.has(value as DetailFieldId);
}

export function getGroup(id: DetailGroupId): DetailGroup {
  return DETAIL_GROUPS.find((group) => group.id === id)!;
}

export function fieldsOfGroup(id: DetailGroupId): DetailField[] {
  return DETAIL_FIELDS.filter((field) => field.group === id);
}

export function groupsOf(party: PartyKind): DetailGroup[] {
  return DETAIL_GROUPS.filter((group) => group.party === party);
}

export function hasDetailValues(values: DetailValues | undefined): boolean {
  return !!values && Object.values(values).some((value) => !!value?.trim());
}

export function isGroupUsed(
  values: DetailValues | undefined,
  group: DetailGroupId
): boolean {
  return (
    !!values && fieldsOfGroup(group).some((field) => !!values[field.id]?.trim())
  );
}

/* ------------------------------------------------------------------------ */
/* Normalization                                                            */
/* ------------------------------------------------------------------------ */

function matchOption(options: DetailOption[], raw: string): string | undefined {
  const key = normalizeKey(raw);
  if (!key) return undefined;
  const option = options.find((candidate) =>
    [candidate.value, candidate.label, ...(candidate.aliases ?? [])].some(
      (spelling) => normalizeKey(spelling) === key
    )
  );
  return option?.value;
}

/** Cleans a typed, pasted or imported value; select values map to their codes. */
export function normalizeDetailValue(id: DetailFieldId, raw: string): string {
  const value = cleanCell(raw);
  const field = getDetailField(id);
  if (field.input === 'select' && field.options) {
    return value.trim()
      ? (matchOption(field.options, value) ?? value.trim())
      : '';
  }
  return value;
}

export const digitsOnly = (value: string) => value.replace(/\D/g, '');

/** US phone numbers: drop formatting and a leading country code 1. */
export function normalizePhone(value: string): string {
  const digits = digitsOnly(value);
  return digits.length === 11 && digits.startsWith('1')
    ? digits.slice(1)
    : digits;
}

/** Accepts YYYY-MM-DD, YYYY/MM/DD, MM/DD/YYYY and MM-DD-YYYY. */
export function parseDate(
  value: string
): { iso: string; date: Date } | undefined {
  const trimmed = value.trim();
  let year: number;
  let month: number;
  let day: number;
  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(trimmed);
  if (match) {
    [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else {
    match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(trimmed);
    if (!match) return undefined;
    [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return undefined;
  }
  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { iso, date };
}

/* ------------------------------------------------------------------------ */
/* Validation                                                               */
/* ------------------------------------------------------------------------ */

export interface DetailIssue {
  field: DetailFieldId;
  severity: 'error' | 'warning';
  message: string;
  required?: boolean;
  fix?: string;
}

export interface DetailContext {
  /** Prefix for messages, e.g. "Authorized user" or "Person 2"; empty for the business. */
  who: string;
  organizationType?: string;
  today?: Date;
}

const ADDRESS_LINE_PATTERN = /^[a-zA-Z0-9()\-/.,&_' #]*$/;
const PO_BOX_PATTERN = /\b(po|pob|po box|p\.o\.|p\.o box|p\.o\. box)\s*\d+/i;
const PMB_PATTERN = /(^pmb\s*|\spmb\s)|private mail ?box/i;
const ZIP_PATTERN = /^\d{5}(-\d{4})?$/;
const ID_VALUE_PATTERN = /^[A-Za-z0-9\-/.\s+&]*$/;
const ONLY_SPECIAL_CHARS = /^[-/.\s+&]*$/;
const ITIN_PATTERN = /^9\d{2}(5[0-5]|6[0-5]|7\d|8[0-8]|9[0-2]|9[4-9])\d{4}$/;
const INVALID_TAX_NUMBERS = new Set([
  '111111111',
  '222222222',
  '333333333',
  '444444444',
  '555555555',
  '666666666',
  '777777777',
  '888888888',
  '999999999',
  '000000000',
  '123456789',
  '987654321',
  '012345678',
]);
const SSN_ITIN_BUSINESS_TYPES = new Set([
  'SOLE_PROPRIETORSHIP',
  'LIMITED_LIABILITY_COMPANY',
]);

function label(context: DetailContext, group: DetailGroupId): string {
  const groupLabel = getGroup(group).label;
  return context.who
    ? `${context.who} – ${lowerFirst(groupLabel)}`
    : groupLabel;
}

function checkOption(
  issues: DetailIssue[],
  field: DetailField,
  value: string,
  prefix: string
): void {
  if (!value || !field.options) return;
  if (!field.options.some((option) => option.value === value)) {
    issues.push({
      field: field.id,
      severity: 'error',
      message: `${prefix}: "${value}" isn't an accepted ${lowerFirst(field.label)}. Choose one from the list`,
    });
  }
}

function checkText(
  issues: DetailIssue[],
  id: DetailFieldId,
  value: string,
  prefix: string,
  rules: {
    min?: number;
    max: number;
    namePattern?: boolean;
    addressPattern?: boolean;
  }
): void {
  if (!value) return;
  const field = getDetailField(id);
  const name = lowerFirst(field.label);
  if (rules.min && value.length < rules.min) {
    issues.push({
      field: id,
      severity: 'error',
      message: `${prefix}: ${name} must be at least ${rules.min} characters`,
    });
  }
  if (value.length > rules.max) {
    issues.push({
      field: id,
      severity: 'error',
      message: `${prefix}: ${name} is too long (${value.length}/${rules.max} characters)`,
    });
  }
  if (rules.namePattern) {
    const invalid = findInvalidNameChars(value);
    if (invalid.length > 0) {
      issues.push({
        field: id,
        severity: 'error',
        message: `${prefix}: ${name} has characters that aren't accepted (${invalid.join(' ')})`,
        fix: suggestNameFix(value),
      });
    }
  }
  if (rules.addressPattern && !ADDRESS_LINE_PATTERN.test(value)) {
    const fixed = transliterateName(value);
    issues.push({
      field: id,
      severity: 'error',
      message: `${prefix}: ${name} can only use letters A–Z, numbers, spaces and ( ) - / . , & _ ' #`,
      fix:
        fixed !== value && ADDRESS_LINE_PATTERN.test(fixed) ? fixed : undefined,
    });
  }
}

function requireIn(
  issues: DetailIssue[],
  values: DetailValues,
  ids: DetailFieldId[],
  prefix: string
): void {
  for (const id of ids) {
    if (!values[id]?.trim()) {
      issues.push({
        field: id,
        severity: 'error',
        required: true,
        message: `${prefix}: enter the ${lowerFirst(getDetailField(id).label)}`,
      });
    }
  }
}

function validatePhone(
  issues: DetailIssue[],
  id: DetailFieldId,
  value: string,
  prefix: string
): void {
  if (!value) return;
  if (!/^[\d\s()+.-]*$/.test(value) || normalizePhone(value).length !== 10) {
    issues.push({
      field: id,
      severity: 'error',
      message: `${prefix}: enter a 10-digit US phone number`,
    });
  }
}

function validateAddress(
  issues: DetailIssue[],
  party: PartyKind,
  values: DetailValues,
  prefix: string
): void {
  const id = (name: string) => `${party}.${name}` as DetailFieldId;
  requireIn(
    issues,
    values,
    [id('addressLine1'), id('city'), id('state'), id('postalCode')],
    prefix
  );
  for (const lineId of [id('addressLine1'), id('addressLine2')]) {
    const line = values[lineId]?.trim() ?? '';
    checkText(issues, lineId, line, prefix, { max: 60, addressPattern: true });
    if (PO_BOX_PATTERN.test(line)) {
      issues.push({
        field: lineId,
        severity: 'error',
        message: `${prefix}: PO boxes aren't accepted`,
      });
    } else if (PMB_PATTERN.test(line)) {
      issues.push({
        field: lineId,
        severity: 'error',
        message: `${prefix}: private mailboxes aren't accepted`,
      });
    }
  }
  if (/^\d+$/.test(values[id('addressLine1')]?.trim() ?? '')) {
    issues.push({
      field: id('addressLine1'),
      severity: 'error',
      message: `${prefix}: address line 1 can't be only numbers`,
    });
  }
  checkText(issues, id('city'), values[id('city')]?.trim() ?? '', prefix, {
    max: 40,
  });
  checkOption(
    issues,
    getDetailField(id('state')),
    values[id('state')]?.trim() ?? '',
    prefix
  );
  const zip = values[id('postalCode')]?.trim() ?? '';
  if (zip && (!ZIP_PATTERN.test(zip) || zip.startsWith('00000'))) {
    const padded = /^\d{4}(-\d{4})?$/.test(zip) ? `0${zip}` : undefined;
    issues.push({
      field: id('postalCode'),
      severity: 'error',
      message: padded
        ? `${prefix}: ZIP code needs 5 digits — spreadsheets often drop a leading zero`
        : `${prefix}: enter a 5-digit ZIP code (or ZIP+4, e.g. 10001-1234)`,
      fix: padded,
    });
  }
}

/** SSN, ITIN and EIN: 9 digits, not an obviously invalid number. */
function validateTaxNumber(
  issues: DetailIssue[],
  id: DetailFieldId,
  value: string,
  type: string,
  prefix: string
): void {
  const digits = digitsOnly(value);
  const kind = type === 'EIN' ? 'EIN' : type;
  if (!/^[\d\s-]+$/.test(value) || digits.length !== 9) {
    issues.push({
      field: id,
      severity: 'error',
      message:
        digits.length === 8
          ? `${prefix}: ${kind} must be 9 digits — check for a dropped leading zero`
          : `${prefix}: ${kind} must be 9 digits`,
    });
    return;
  }
  if (INVALID_TAX_NUMBERS.has(digits)) {
    issues.push({
      field: id,
      severity: 'error',
      message: `${prefix}: enter a valid ${kind}`,
    });
    return;
  }
  if (type === 'ITIN' && !ITIN_PATTERN.test(digits)) {
    issues.push({
      field: id,
      severity: 'error',
      message: `${prefix}: this isn't a valid ITIN (ITINs start with 9)`,
    });
  }
}

function age(birth: Date, today: Date): number {
  let years = today.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() &&
      today.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) years -= 1;
  return years;
}

export function validateBusinessDetails(
  values: DetailValues,
  context: DetailContext
): DetailIssue[] {
  const issues: DetailIssue[] = [];
  const v = (id: DetailFieldId) => values[id]?.trim() ?? '';
  const today = context.today ?? new Date();

  const profile = label(context, 'businessProfile');
  checkText(issues, 'business.dbaName', v('business.dbaName'), profile, {
    max: 100,
    namePattern: true,
  });
  checkText(
    issues,
    'business.description',
    v('business.description'),
    profile,
    {
      min: 10,
      max: 1000,
    }
  );
  if (v('business.naics') && !/^\d{6}$/.test(v('business.naics'))) {
    issues.push({
      field: 'business.naics',
      severity: 'error',
      message: `${profile}: NAICS code must be 6 digits`,
    });
  }
  const year = v('business.yearOfFormation');
  if (
    year &&
    (!/^\d{4}$/.test(year) ||
      Number(year) < 1800 ||
      Number(year) > today.getFullYear())
  ) {
    issues.push({
      field: 'business.yearOfFormation',
      severity: 'error',
      message: `${profile}: enter the 4-digit year the business was formed (not in the future)`,
    });
  }
  const website = v('business.website');
  if (website) {
    checkText(issues, 'business.website', website, profile, { max: 500 });
    if (/\s/.test(website) || !/[a-z0-9-]\.[a-z]{2,}/i.test(website)) {
      issues.push({
        field: 'business.website',
        severity: 'error',
        message: `${profile}: enter a website address like www.acme.com`,
      });
    }
  }

  validatePhone(
    issues,
    'business.phone',
    v('business.phone'),
    label(context, 'businessPhone')
  );

  if (isGroupUsed(values, 'businessAddress')) {
    const prefix = label(context, 'businessAddress');
    checkOption(
      issues,
      getDetailField('business.addressType'),
      v('business.addressType'),
      prefix
    );
    validateAddress(issues, 'business', values, prefix);
  }

  if (isGroupUsed(values, 'businessTaxId')) {
    const prefix = label(context, 'businessTaxId');
    const type = v('business.taxIdType') || 'EIN';
    checkOption(
      issues,
      getDetailField('business.taxIdType'),
      v('business.taxIdType'),
      prefix
    );
    requireIn(issues, values, ['business.taxId'], prefix);
    if (v('business.taxId')) {
      validateTaxNumber(
        issues,
        'business.taxId',
        v('business.taxId'),
        type,
        prefix
      );
    }
    if (
      (type === 'SSN' || type === 'ITIN') &&
      context.organizationType &&
      !SSN_ITIN_BUSINESS_TYPES.has(context.organizationType)
    ) {
      issues.push({
        field: 'business.taxIdType',
        severity: 'error',
        message: `${prefix}: ${type} is only accepted for sole proprietorships and LLCs. Use the EIN`,
      });
    }
  }
  return issues;
}

export function validatePersonDetails(
  values: DetailValues,
  context: DetailContext
): DetailIssue[] {
  const issues: DetailIssue[] = [];
  const v = (id: DetailFieldId) => values[id]?.trim() ?? '';
  const today = context.today ?? new Date();
  const profile = label(context, 'personProfile');

  checkText(issues, 'person.nameSuffix', v('person.nameSuffix'), profile, {
    max: 5,
    namePattern: true,
  });

  const birth = v('person.birthDate');
  if (birth) {
    const parsed = parseDate(birth);
    if (!parsed) {
      issues.push({
        field: 'person.birthDate',
        severity: 'error',
        message: `${profile}: enter the birth date as YYYY-MM-DD (or MM/DD/YYYY)`,
      });
    } else {
      const years = age(parsed.date, today);
      if (years < 18 || years > 125) {
        issues.push({
          field: 'person.birthDate',
          severity: 'error',
          message:
            years < 18
              ? `${profile}: the person must be 18 or older`
              : `${profile}: check the birth year`,
        });
      }
    }
  }

  for (const id of [
    'person.jobTitle',
    'person.natureOfOwnership',
    'person.language',
  ] as const) {
    checkOption(issues, getDetailField(id), v(id), profile);
  }
  if (v('person.jobTitle') === 'Other' && !v('person.jobTitleDescription')) {
    issues.push({
      field: 'person.jobTitleDescription',
      severity: 'error',
      required: true,
      message: `${profile}: describe the job title (required when the job title is Other)`,
    });
  }
  checkText(
    issues,
    'person.jobTitleDescription',
    v('person.jobTitleDescription'),
    profile,
    {
      max: 50,
    }
  );

  validatePhone(
    issues,
    'person.phone',
    v('person.phone'),
    label(context, 'personPhone')
  );

  if (isGroupUsed(values, 'personAddress')) {
    validateAddress(issues, 'person', values, label(context, 'personAddress'));
  }

  if (isGroupUsed(values, 'personId')) {
    const prefix = label(context, 'personId');
    const type = v('person.idType') || 'SSN';
    checkOption(
      issues,
      getDetailField('person.idType'),
      v('person.idType'),
      prefix
    );
    requireIn(issues, values, ['person.idValue'], prefix);
    const value = v('person.idValue');
    if (value) {
      if (type === 'SSN' || type === 'ITIN') {
        validateTaxNumber(issues, 'person.idValue', value, type, prefix);
      } else if (
        value.length > 20 ||
        !ID_VALUE_PATTERN.test(value) ||
        ONLY_SPECIAL_CHARS.test(value)
      ) {
        issues.push({
          field: 'person.idValue',
          severity: 'error',
          message: `${prefix}: ID number can be up to 20 letters, numbers, spaces and - / . + &`,
        });
      }
    }
  }
  return issues;
}

/* ------------------------------------------------------------------------ */
/* CSV mapping                                                              */
/* ------------------------------------------------------------------------ */

const ORG = 'organizationDetails';
const IND = 'individualDetails';

function writeAddress(
  out: Record<string, string>,
  base: string,
  addressType: string,
  line1: string,
  line2: string,
  city: string,
  state: string,
  postalCode: string
): void {
  out[`${base}.addressType`] = addressType;
  out[`${base}.addressLines.0`] = line1;
  if (line2) out[`${base}.addressLines.1`] = line2;
  out[`${base}.city`] = city;
  out[`${base}.state`] = state;
  out[`${base}.postalCode`] = postalCode;
  out[`${base}.country`] = 'US';
}

/** CSV columns for the business row. Values are trimmed and normalized. */
export function businessDetailsToCsv(
  values: DetailValues
): Record<string, string> {
  const v = (id: DetailFieldId) => values[id]?.trim() ?? '';
  const out: Record<string, string> = {};
  if (v('business.dbaName')) out[`${ORG}.dbaName`] = v('business.dbaName');
  if (v('business.description'))
    out[`${ORG}.organizationDescription`] = v('business.description');
  if (v('business.naics')) {
    out[`${ORG}.industry.codeType`] = 'NAICS';
    out[`${ORG}.industry.code`] = v('business.naics');
  }
  if (v('business.yearOfFormation'))
    out[`${ORG}.yearOfFormation`] = v('business.yearOfFormation');
  if (v('business.website')) out[`${ORG}.website`] = v('business.website');
  if (v('business.phone')) {
    out[`${ORG}.phone.phoneType`] = 'BUSINESS_PHONE';
    out[`${ORG}.phone.countryCode`] = '+1';
    out[`${ORG}.phone.phoneNumber`] = normalizePhone(v('business.phone'));
  }
  if (isGroupUsed(values, 'businessAddress')) {
    writeAddress(
      out,
      `${ORG}.addresses.0`,
      v('business.addressType') || 'BUSINESS_ADDRESS',
      v('business.addressLine1'),
      v('business.addressLine2'),
      v('business.city'),
      v('business.state'),
      v('business.postalCode')
    );
  }
  if (isGroupUsed(values, 'businessTaxId')) {
    out[`${ORG}.organizationIds.0.idType`] = v('business.taxIdType') || 'EIN';
    out[`${ORG}.organizationIds.0.value`] = digitsOnly(v('business.taxId'));
    out[`${ORG}.organizationIds.0.issuer`] = 'US';
  }
  return out;
}

/** CSV columns for an individual's row. */
export function personDetailsToCsv(
  values: DetailValues
): Record<string, string> {
  const v = (id: DetailFieldId) => values[id]?.trim() ?? '';
  const out: Record<string, string> = {};
  if (v('person.nameSuffix')) out[`${IND}.nameSuffix`] = v('person.nameSuffix');
  if (v('person.birthDate')) {
    out[`${IND}.birthDate`] =
      parseDate(v('person.birthDate'))?.iso ?? v('person.birthDate');
  }
  if (v('person.jobTitle')) out[`${IND}.jobTitle`] = v('person.jobTitle');
  if (v('person.jobTitleDescription')) {
    out[`${IND}.jobTitleDescription`] = v('person.jobTitleDescription');
  }
  if (v('person.natureOfOwnership'))
    out[`${IND}.natureOfOwnership`] = v('person.natureOfOwnership');
  if (v('person.language'))
    out['preferences.defaultLanguage'] = v('person.language');
  if (v('person.phone')) {
    out[`${IND}.phone.phoneType`] = 'MOBILE_PHONE';
    out[`${IND}.phone.countryCode`] = '+1';
    out[`${IND}.phone.phoneNumber`] = normalizePhone(v('person.phone'));
  }
  if (isGroupUsed(values, 'personAddress')) {
    writeAddress(
      out,
      `${IND}.addresses.0`,
      'RESIDENTIAL_ADDRESS',
      v('person.addressLine1'),
      v('person.addressLine2'),
      v('person.city'),
      v('person.state'),
      v('person.postalCode')
    );
  }
  if (isGroupUsed(values, 'personId')) {
    const type = v('person.idType') || 'SSN';
    out[`${IND}.individualIds.0.idType`] = type;
    out[`${IND}.individualIds.0.value`] =
      type === 'SSN' || type === 'ITIN'
        ? digitsOnly(v('person.idValue'))
        : v('person.idValue');
    out[`${IND}.individualIds.0.issuer`] = 'US';
  }
  return out;
}

function addressColumns(base: string): string[] {
  return [
    `${base}.addressType`,
    `${base}.addressLines.0`,
    `${base}.addressLines.1`,
    `${base}.city`,
    `${base}.state`,
    `${base}.postalCode`,
    `${base}.country`,
  ];
}

/** Every optional column the tool can write, in file order. */
export const DETAIL_CSV_COLUMNS: string[] = [
  `${ORG}.dbaName`,
  `${ORG}.organizationDescription`,
  `${ORG}.industry.codeType`,
  `${ORG}.industry.code`,
  `${ORG}.yearOfFormation`,
  `${ORG}.website`,
  `${ORG}.phone.phoneType`,
  `${ORG}.phone.countryCode`,
  `${ORG}.phone.phoneNumber`,
  ...addressColumns(`${ORG}.addresses.0`),
  `${ORG}.organizationIds.0.idType`,
  `${ORG}.organizationIds.0.value`,
  `${ORG}.organizationIds.0.issuer`,
  `${IND}.nameSuffix`,
  `${IND}.birthDate`,
  `${IND}.jobTitle`,
  `${IND}.jobTitleDescription`,
  `${IND}.natureOfOwnership`,
  'preferences.defaultLanguage',
  `${IND}.phone.phoneType`,
  `${IND}.phone.countryCode`,
  `${IND}.phone.phoneNumber`,
  ...addressColumns(`${IND}.addresses.0`),
  `${IND}.individualIds.0.idType`,
  `${IND}.individualIds.0.value`,
  `${IND}.individualIds.0.issuer`,
];

/** CSV columns that hold sensitive values (masked in the preview). */
export const SENSITIVE_CSV_COLUMNS = new Set([
  `${ORG}.organizationIds.0.value`,
  `${IND}.birthDate`,
  `${IND}.individualIds.0.value`,
]);

const SUPPORTED_IMPORT_PATTERNS: RegExp[] = [
  /^organizationDetails\.(dbaName|organizationDescription|yearOfFormation|website)$/,
  /^organizationDetails\.industry\.(codeType|code)$/,
  /^(organizationDetails|individualDetails)\.phone\.(phoneType|countryCode|phoneNumber)$/,
  /^(organizationDetails|individualDetails)\.addresses\.\d+\.(addressType|addressLines\.\d+|city|state|postalCode|country)$/,
  /^organizationDetails\.organizationIds\.\d+\.(idType|value|issuer)$/,
  /^individualDetails\.individualIds\.\d+\.(idType|value|issuer)$/,
  /^individualDetails\.(nameSuffix|birthDate|jobTitle|jobTitleDescription|natureOfOwnership)$/,
  /^preferences\.defaultLanguage$/,
];

export function isSupportedDetailColumn(header: string): boolean {
  return SUPPORTED_IMPORT_PATTERNS.some((pattern) => pattern.test(header));
}

type Getter = (path: string) => string;

interface ImportedAddress {
  index: number;
  type: string;
  lines: string[];
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

function readAddresses(get: Getter, base: string): ImportedAddress[] {
  const result: ImportedAddress[] = [];
  for (let index = 0; index < 5; index += 1) {
    const prefix = `${base}.addresses.${index}`;
    const lines = [0, 1, 2, 3, 4]
      .map((n) => get(`${prefix}.addressLines.${n}`))
      .filter(Boolean);
    const address = {
      index,
      type: get(`${prefix}.addressType`).toUpperCase(),
      lines,
      city: get(`${prefix}.city`),
      state: get(`${prefix}.state`),
      postalCode: get(`${prefix}.postalCode`),
      country: get(`${prefix}.country`).toUpperCase(),
    };
    if (
      address.type ||
      lines.length ||
      address.city ||
      address.state ||
      address.postalCode
    ) {
      result.push(address);
    }
  }
  return result;
}

function applyAddress(
  out: DetailValues,
  party: PartyKind,
  address: ImportedAddress,
  notes: string[],
  where: string
): void {
  const set = (name: string, value: string) => {
    if (value)
      out[`${party}.${name}` as DetailFieldId] = normalizeDetailValue(
        `${party}.${name}` as DetailFieldId,
        value
      );
  };
  set('addressLine1', address.lines[0] ?? '');
  set('addressLine2', address.lines.slice(1).join(' '));
  set('city', address.city);
  set('state', address.state);
  set('postalCode', address.postalCode);
  if (address.lines.length > 2) {
    notes.push(
      `${where}: address lines 2–${address.lines.length} were combined into line 2`
    );
  }
  if (address.country && address.country !== 'US') {
    notes.push(
      `${where}: address country "${address.country}" — only US addresses are supported`
    );
  }
}

/** Reads the optional business columns from an imported business row. */
export function readBusinessDetails(
  get: Getter,
  notes: string[],
  where: string
): DetailValues {
  const out: DetailValues = {};
  const set = (id: DetailFieldId, value: string) => {
    if (value) out[id] = normalizeDetailValue(id, value);
  };
  set('business.dbaName', get(`${ORG}.dbaName`));
  set('business.description', get(`${ORG}.organizationDescription`));
  set('business.naics', get(`${ORG}.industry.code`));
  set('business.yearOfFormation', get(`${ORG}.yearOfFormation`));
  set('business.website', get(`${ORG}.website`));
  set('business.phone', get(`${ORG}.phone.phoneNumber`));
  const addresses = readAddresses(get, ORG);
  if (addresses.length > 0) {
    const primary =
      addresses.find(
        (a) => a.type === 'BUSINESS_ADDRESS' || a.type === 'LEGAL_ADDRESS'
      ) ?? addresses[0];
    if (primary.type && primary.type !== 'BUSINESS_ADDRESS')
      set('business.addressType', primary.type);
    applyAddress(out, 'business', primary, notes, where);
    if (addresses.length > 1) {
      notes.push(
        `${where}: only one business address is supported; the others were left out`
      );
    }
  }
  const ids = [0, 1, 2, 3, 4, 5]
    .map((index) => ({
      type: get(`${ORG}.organizationIds.${index}.idType`).toUpperCase(),
      value: get(`${ORG}.organizationIds.${index}.value`),
    }))
    .filter((id) => id.type || id.value);
  if (ids.length > 0) {
    if (ids[0].type && ids[0].type !== 'EIN')
      set('business.taxIdType', ids[0].type);
    set('business.taxId', ids[0].value);
    if (ids.length > 1) {
      notes.push(
        `${where}: only one business tax ID is supported; the others were left out`
      );
    }
  }
  return out;
}

/** Reads the optional individual columns from an imported individual row. */
export function readPersonDetails(
  get: Getter,
  notes: string[],
  where: string
): DetailValues {
  const out: DetailValues = {};
  const set = (id: DetailFieldId, value: string) => {
    if (value) out[id] = normalizeDetailValue(id, value);
  };
  set('person.nameSuffix', get(`${IND}.nameSuffix`));
  set('person.birthDate', get(`${IND}.birthDate`));
  set('person.jobTitle', get(`${IND}.jobTitle`));
  set('person.jobTitleDescription', get(`${IND}.jobTitleDescription`));
  set('person.natureOfOwnership', get(`${IND}.natureOfOwnership`));
  set('person.language', get('preferences.defaultLanguage'));
  set('person.phone', get(`${IND}.phone.phoneNumber`));
  const addresses = readAddresses(get, IND);
  if (addresses.length > 0) {
    const home =
      addresses.find((a) => a.type === 'RESIDENTIAL_ADDRESS') ?? addresses[0];
    applyAddress(out, 'person', home, notes, where);
    if (addresses.length > 1) {
      notes.push(
        `${where}: only the home address is supported; other addresses were left out`
      );
    }
  }
  const ids = [0, 1, 2, 3, 4, 5]
    .map((index) => ({
      type: get(`${IND}.individualIds.${index}.idType`).toUpperCase(),
      value: get(`${IND}.individualIds.${index}.value`),
    }))
    .filter((id) => id.type || id.value);
  if (ids.length > 0) {
    if (ids[0].type && ids[0].type !== 'SSN') set('person.idType', ids[0].type);
    set('person.idValue', ids[0].value);
    if (ids.length > 1) {
      notes.push(
        `${where}: only one ID per person is supported; the others were left out`
      );
    }
  }
  return out;
}

/** Masks a sensitive value for display: keeps the last 4 characters of IDs. */
export function maskSensitive(
  id: DetailFieldId | string,
  value: string
): string {
  if (!value) return '';
  if (id === 'person.birthDate' || id.endsWith('birthDate'))
    return '••••-••-••';
  const visible = value.replace(/\s/g, '').slice(-4);
  return `•••••${visible}`;
}
