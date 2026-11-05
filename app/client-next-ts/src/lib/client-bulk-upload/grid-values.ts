import type { ClientDraft, GridColumnKey, PersonDraft } from './model';
import { cleanCell, normalizeOrganizationType, parseYesNo } from './normalize';

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
