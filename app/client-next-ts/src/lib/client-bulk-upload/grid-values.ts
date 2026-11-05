import {
  isDetailFieldId,
  normalizeDetailValue,
  type DetailFieldId,
} from './details';
import type { ClientDraft, GridColumnKey, PersonDraft } from './model';
import { cleanCell, normalizeOrganizationType, parseYesNo } from './normalize';
import type { ColumnId } from './sheet-columns';

/**
 * Sets an optional detail on the business (personIndex null) or on a person.
 * Returns the original object when nothing changes.
 */
export function setDetailValue(
  client: ClientDraft,
  personIndex: number | null,
  field: DetailFieldId,
  raw: string
): ClientDraft {
  const value = normalizeDetailValue(field, raw);
  if (personIndex === null) {
    if ((client.details[field] ?? '') === value) return client;
    return { ...client, details: { ...client.details, [field]: value } };
  }
  const person = client.people[personIndex];
  if (!person || (person.details[field] ?? '') === value) return client;
  const people = [...client.people];
  people[personIndex] = {
    ...person,
    details: { ...person.details, [field]: value },
  };
  return { ...client, people };
}

/** Writes a spreadsheet cell: core columns or optional details (authorized user for person fields). */
export function setCellValue(
  client: ClientDraft,
  column: ColumnId,
  raw: string
): ClientDraft {
  if (isDetailFieldId(column)) {
    return setDetailValue(
      client,
      column.startsWith('business.') ? null : 0,
      column,
      raw
    );
  }
  return setGridValue(client, column, raw);
}

/**
 * Writes one spreadsheet cell into a client, normalizing it the same way for
 * typing, Excel paste and file import. Returns the original object when the
 * value is unchanged so memoized rows don't re-render.
 */
export function setGridValue(
  client: ClientDraft,
  key: GridColumnKey,
  raw: string
): ClientDraft {
  const value = cleanCell(raw);
  switch (key) {
    case 'externalId':
    case 'organizationName':
    case 'email':
      return client[key] === value ? client : { ...client, [key]: value };
    case 'organizationType': {
      const normalized = normalizeOrganizationType(value);
      return client.organizationType === normalized
        ? client
        : { ...client, organizationType: normalized };
    }
    case 'firstName':
    case 'middleName':
    case 'lastName':
      return updateAuthorizedUser(client, { [key]: value });
    case 'personEmail':
      return updateAuthorizedUser(client, { email: value });
    case 'isBeneficialOwner':
    case 'isController':
      return updateAuthorizedUser(client, {
        [key]: parseYesNo(value) ?? false,
      });
  }
}

function updateAuthorizedUser(
  client: ClientDraft,
  patch: Partial<PersonDraft>
): ClientDraft {
  const [authorizedUser, ...others] = client.people;
  const changed = (Object.keys(patch) as (keyof PersonDraft)[]).some(
    (field) => authorizedUser[field] !== patch[field]
  );
  if (!changed) return client;
  return { ...client, people: [{ ...authorizedUser, ...patch }, ...others] };
}

export function getGridValue(client: ClientDraft, key: GridColumnKey): string {
  const authorizedUser = client.people[0];
  switch (key) {
    case 'externalId':
    case 'organizationName':
    case 'organizationType':
    case 'email':
      return client[key];
    case 'firstName':
    case 'middleName':
    case 'lastName':
      return authorizedUser[key];
    case 'personEmail':
      return authorizedUser.email;
    case 'isBeneficialOwner':
    case 'isController':
      return authorizedUser[key] ? 'Y' : 'N';
  }
}
