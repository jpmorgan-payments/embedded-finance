import {
  getAdditionalPeople,
  isClientBlank,
  isPersonBlank,
  type ClientDraft,
  type ClientField,
  type NameField,
  type PersonDraft,
  type PersonField,
} from './model';
import {
  findInvalidNameChars,
  normalizeKey,
  suggestNameFix,
} from './normalize';
import { LIMITS, ORGANIZATION_TYPES } from './schema';

export type IssueSeverity = 'error' | 'warning';

export type IssueTarget =
  | { scope: 'client'; field: ClientField | 'people' }
  | { scope: 'person'; personIndex: number; field: PersonField | 'roles' };

export interface IssueFix {
  personIndex: number;
  field: NameField;
  value: string;
}

export interface Issue {
  severity: IssueSeverity;
  target: IssueTarget;
  message: string;
  /** A value is missing (as opposed to present but invalid). */
  required?: boolean;
  fix?: IssueFix;
}

export interface ClientValidation {
  issues: Issue[];
  errorCount: number;
  warningCount: number;
}

export interface ValidationSummary {
  byClientId: Map<string, ClientValidation>;
  activeClientCount: number;
  peopleCount: number;
  /** Data rows in the CSV (one per business plus one per person). */
  dataRowCount: number;
  errorCount: number;
  warningCount: number;
  clientsWithErrors: number;
  clientsWithWarnings: number;
  fixableCount: number;
}

const EMPTY_VALIDATION: ClientValidation = {
  issues: [],
  errorCount: 0,
  warningCount: 0,
};

const ORGANIZATION_TYPE_VALUES = new Set<string>(
  ORGANIZATION_TYPES.map((option) => option.value)
);

const EMAIL_LOCAL =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const EMAIL_DOMAIN =
  /^(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export function getEmailProblem(email: string): string | undefined {
  if (email.length > LIMITS.emailMax) {
    return `is too long (${email.length}/${LIMITS.emailMax} characters)`;
  }
  if (/\s/.test(email)) return "can't contain spaces";
  const at = email.lastIndexOf('@');
  if (at <= 0 || at === email.length - 1) {
    return 'is not a valid email address (example: name@company.com)';
  }
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > LIMITS.emailLocalMax) {
    return `has more than ${LIMITS.emailLocalMax} characters before the @`;
  }
  if (domain.length > LIMITS.emailDomainMax) {
    return `has more than ${LIMITS.emailDomainMax} characters after the @`;
  }
  if (!EMAIL_LOCAL.test(local) || !EMAIL_DOMAIN.test(domain)) {
    return 'is not a valid email address (example: name@company.com)';
  }
  return undefined;
}

/** Individual externalIds are derived from the client ID: <clientId>_1, _2, ... */
export function buildPersonExternalId(
  clientExternalId: string,
  ordinal: number
): string {
  return `${clientExternalId.trim()}_${ordinal}`;
}

export function getPersonExternalIds(client: ClientDraft): string[] {
  const count = 1 + getAdditionalPeople(client).length;
  return Array.from({ length: count }, (_, i) =>
    buildPersonExternalId(client.externalId, i + 1)
  );
}

export function personLabel(personIndex: number): string {
  return personIndex === 0 ? 'Authorized user' : `Person ${personIndex + 1}`;
}

const NAME_RULES: Record<
  NameField,
  { label: string; max: number; required: boolean }
> = {
  firstName: { label: 'first name', max: LIMITS.firstNameMax, required: true },
  middleName: {
    label: 'middle name',
    max: LIMITS.middleNameMax,
    required: false,
  },
  lastName: { label: 'last name', max: LIMITS.lastNameMax, required: true },
};

function validatePerson(
  person: PersonDraft,
  personIndex: number,
  issues: Issue[]
): void {
  const who = personLabel(personIndex);
  const isAuthorizedUser = personIndex === 0;

  (Object.keys(NAME_RULES) as NameField[]).forEach((field) => {
    const rule = NAME_RULES[field];
    const value = person[field].trim();
    const target: IssueTarget = { scope: 'person', personIndex, field };
    if (!value) {
      if (rule.required) {
        issues.push({
          severity: 'error',
          target,
          required: true,
          message: `${who}: enter the ${rule.label}`,
        });
      }
      return;
    }
    const invalidChars = findInvalidNameChars(value);
    if (invalidChars.length > 0) {
      const fixValue = suggestNameFix(value);
      issues.push({
        severity: 'error',
        target,
        message: `${who}: ${rule.label} has characters that aren't accepted (${invalidChars.join(' ')})`,
        fix: fixValue ? { personIndex, field, value: fixValue } : undefined,
      });
    }
    if (value.length > rule.max) {
      issues.push({
        severity: 'error',
        target,
        message: `${who}: ${rule.label} is too long (${value.length}/${rule.max} characters)`,
      });
    }
  });

  const email = person.email.trim();
  const emailTarget: IssueTarget = {
    scope: 'person',
    personIndex,
    field: 'email',
  };
  if (!email) {
    if (isAuthorizedUser) {
      issues.push({
        severity: 'error',
        target: emailTarget,
        required: true,
        message:
          'Authorized user: enter an email — the onboarding invitation is sent here',
      });
    } else if (person.isController) {
      issues.push({
        severity: 'error',
        target: emailTarget,
        required: true,
        message: `${who}: enter an email — it's required for controllers`,
      });
    }
  } else {
    const problem = getEmailProblem(email);
    if (problem) {
      issues.push({
        severity: 'error',
        target: emailTarget,
        message: `${who}: email ${problem}`,
      });
    }
  }

  if (!isAuthorizedUser && !person.isBeneficialOwner && !person.isController) {
    issues.push({
      severity: 'error',
      target: { scope: 'person', personIndex, field: 'roles' },
      required: true,
      message: `${who}: choose a role — Owner 25%+, Controller, or both`,
    });
  }
}

function personKey(person: PersonDraft): string {
  return normalizeKey(`${person.firstName}|${person.lastName}`);
}

type IdKind = 'client' | 'person';
interface IdOwner {
  row: number;
  kind: IdKind;
}

function validateClient(
  client: ClientDraft,
  rowNumber: number,
  context: {
    idOwners: Map<string, IdOwner[]>;
    idOwnersInsensitive: Map<string, Set<number>>;
    nameOwners: Map<string, number[]>;
  }
): ClientValidation {
  const issues: Issue[] = [];
  const externalId = client.externalId.trim();

  if (!externalId) {
    issues.push({
      severity: 'error',
      target: { scope: 'client', field: 'externalId' },
      required: true,
      message: 'Enter the client ID — your own unique ID for this business',
    });
  } else {
    const longestPersonId = getPersonExternalIds(client).at(-1) ?? '';
    if (externalId.length > LIMITS.externalIdMax) {
      issues.push({
        severity: 'error',
        target: { scope: 'client', field: 'externalId' },
        message: `Client ID is too long (${externalId.length}/${LIMITS.externalIdMax} characters)`,
      });
    } else if (longestPersonId.length > LIMITS.externalIdMax) {
      const maxLength =
        LIMITS.externalIdMax - (longestPersonId.length - externalId.length);
      issues.push({
        severity: 'error',
        target: { scope: 'client', field: 'externalId' },
        message: `Client ID is too long to build IDs for its people (${longestPersonId}). Use at most ${maxLength} characters`,
      });
    }

    const others = (id: string, kind?: IdKind) =>
      (context.idOwners.get(id) ?? [])
        .filter(
          (owner) => owner.row !== rowNumber && (!kind || owner.kind === kind)
        )
        .map((owner) => owner.row);
    const sameIdRows = others(externalId, 'client');
    const personIdRows = others(externalId, 'person');
    const clashingPersonIds = getPersonExternalIds(client).filter(
      (id) => others(id).length > 0
    );
    if (sameIdRows.length > 0) {
      issues.push({
        severity: 'error',
        target: { scope: 'client', field: 'externalId' },
        message: `Client ID "${externalId}" is also used in row ${formatRows(sameIdRows)}. Each business needs its own ID`,
      });
    } else if (personIdRows.length > 0) {
      issues.push({
        severity: 'error',
        target: { scope: 'client', field: 'externalId' },
        message: `Client ID "${externalId}" clashes with a person ID built for row ${formatRows(personIdRows)}. Choose a different ID`,
      });
    } else if (clashingPersonIds.length > 0) {
      issues.push({
        severity: 'error',
        target: { scope: 'client', field: 'externalId' },
        message: `The person IDs built from this client ID (${clashingPersonIds.join(', ')}) clash with an ID in row ${formatRows(clashingPersonIds.flatMap((id) => others(id)))}`,
      });
    } else {
      const caseOnlyRows = Array.from(
        context.idOwnersInsensitive.get(externalId.toLowerCase()) ?? []
      ).filter((row) => row !== rowNumber);
      if (caseOnlyRows.length > 0) {
        issues.push({
          severity: 'warning',
          target: { scope: 'client', field: 'externalId' },
          message: `Client ID differs only in upper/lower case from row ${formatRows(caseOnlyRows)}. Make sure these are different businesses`,
        });
      }
    }
  }

  const organizationName = client.organizationName.trim();
  if (!organizationName) {
    issues.push({
      severity: 'error',
      target: { scope: 'client', field: 'organizationName' },
      required: true,
      message: 'Enter the legal business name',
    });
  } else {
    if (organizationName.length > LIMITS.organizationNameMax) {
      issues.push({
        severity: 'error',
        target: { scope: 'client', field: 'organizationName' },
        message: `Legal business name is too long (${organizationName.length}/${LIMITS.organizationNameMax} characters)`,
      });
    }
    const sameNameRows = (
      context.nameOwners.get(normalizeKey(organizationName)) ?? []
    ).filter((row) => row !== rowNumber);
    if (sameNameRows.length > 0) {
      issues.push({
        severity: 'warning',
        target: { scope: 'client', field: 'organizationName' },
        message: `Same business name as row ${formatRows(sameNameRows)}. Check this isn't a duplicate`,
      });
    }
  }

  const organizationType = client.organizationType.trim();
  if (!organizationType) {
    issues.push({
      severity: 'error',
      target: { scope: 'client', field: 'organizationType' },
      required: true,
      message: 'Choose the business type',
    });
  } else if (!ORGANIZATION_TYPE_VALUES.has(organizationType)) {
    issues.push({
      severity: 'error',
      target: { scope: 'client', field: 'organizationType' },
      message: `"${organizationType}" isn't an accepted business type. Choose one from the list`,
    });
  }

  const businessEmail = client.email.trim();
  if (businessEmail) {
    const problem = getEmailProblem(businessEmail);
    if (problem) {
      issues.push({
        severity: 'error',
        target: { scope: 'client', field: 'email' },
        message: `Business email ${problem}`,
      });
    }
  }

  const seenPeople = new Map<string, number>();
  const seenEmails = new Map<string, number>();
  let beneficialOwners = 0;
  client.people.forEach((person, personIndex) => {
    if (personIndex > 0 && isPersonBlank(person)) return;
    validatePerson(person, personIndex, issues);
    if (person.isBeneficialOwner) beneficialOwners += 1;

    const key = personKey(person);
    const email = person.email.trim().toLowerCase();
    const earlierByName = key.length > 1 ? seenPeople.get(key) : undefined;
    const earlierByEmail = email ? seenEmails.get(email) : undefined;
    const earlier = earlierByName ?? earlierByEmail;
    if (earlier !== undefined) {
      issues.push({
        severity: 'warning',
        target: { scope: 'person', personIndex, field: 'firstName' },
        message: `${personLabel(personIndex)} looks like the same person as ${personLabel(earlier).toLowerCase()}. If one person has several roles, enter them once and tick each role`,
      });
    }
    if (key.length > 1 && !seenPeople.has(key))
      seenPeople.set(key, personIndex);
    if (email && !seenEmails.has(email)) seenEmails.set(email, personIndex);
  });

  if (beneficialOwners > LIMITS.maxBeneficialOwners) {
    issues.push({
      severity: 'error',
      target: { scope: 'client', field: 'people' },
      message: `${beneficialOwners} people are marked Owner 25%+. Each must own at least 25%, so there can be at most ${LIMITS.maxBeneficialOwners}`,
    });
  }

  return {
    issues,
    errorCount: issues.filter((issue) => issue.severity === 'error').length,
    warningCount: issues.filter((issue) => issue.severity === 'warning').length,
  };
}

function formatRows(rows: number[]): string {
  return Array.from(new Set(rows))
    .sort((a, b) => a - b)
    .join(', ');
}

function pushMapValue<K, V>(map: Map<K, V[]>, key: K, value: V): void {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

export function validateClients(clients: ClientDraft[]): ValidationSummary {
  const idOwners = new Map<string, IdOwner[]>();
  const idOwnersInsensitive = new Map<string, Set<number>>();
  const nameOwners = new Map<string, number[]>();

  clients.forEach((client, index) => {
    if (isClientBlank(client)) return;
    const rowNumber = index + 1;
    const externalId = client.externalId.trim();
    if (externalId) {
      pushMapValue(idOwners, externalId, { row: rowNumber, kind: 'client' });
      const lower = externalId.toLowerCase();
      const set = idOwnersInsensitive.get(lower) ?? new Set<number>();
      set.add(rowNumber);
      idOwnersInsensitive.set(lower, set);
      getPersonExternalIds(client).forEach((id) =>
        pushMapValue(idOwners, id, { row: rowNumber, kind: 'person' })
      );
    }
    const name = normalizeKey(client.organizationName);
    if (name) pushMapValue(nameOwners, name, rowNumber);
  });

  const byClientId = new Map<string, ClientValidation>();
  let activeClientCount = 0;
  let peopleCount = 0;
  let errorCount = 0;
  let warningCount = 0;
  let clientsWithErrors = 0;
  let clientsWithWarnings = 0;
  let fixableCount = 0;

  clients.forEach((client, index) => {
    if (isClientBlank(client)) {
      byClientId.set(client.id, EMPTY_VALIDATION);
      return;
    }
    activeClientCount += 1;
    peopleCount += 1 + getAdditionalPeople(client).length;
    const result = validateClient(client, index + 1, {
      idOwners,
      idOwnersInsensitive,
      nameOwners,
    });
    byClientId.set(client.id, result);
    errorCount += result.errorCount;
    warningCount += result.warningCount;
    if (result.errorCount > 0) clientsWithErrors += 1;
    if (result.warningCount > 0) clientsWithWarnings += 1;
    fixableCount += result.issues.filter((issue) => issue.fix).length;
  });

  return {
    byClientId,
    activeClientCount,
    peopleCount,
    dataRowCount: activeClientCount + peopleCount,
    errorCount,
    warningCount,
    clientsWithErrors,
    clientsWithWarnings,
    fixableCount,
  };
}

export function getClientValidation(
  summary: ValidationSummary,
  clientId: string
): ClientValidation {
  return summary.byClientId.get(clientId) ?? EMPTY_VALIDATION;
}
