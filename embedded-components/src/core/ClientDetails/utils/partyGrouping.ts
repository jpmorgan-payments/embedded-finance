/**
 * Party grouping for Review-and-attest–style sections (Organization, Controller, Beneficial owners).
 */

import type {
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';

export function getOrganizationParty(
  client: ClientResponse | undefined
): PartyResponse | undefined {
  return client?.parties?.find(
    (party) =>
      party.partyType === 'ORGANIZATION' &&
      party.roles?.includes('CLIENT') &&
      party.active !== false
  );
}

export function getControllerParty(
  client: ClientResponse | undefined
): PartyResponse | undefined {
  return client?.parties?.find(
    (party) =>
      party.partyType === 'INDIVIDUAL' &&
      party.roles?.includes('CONTROLLER') &&
      party.active !== false
  );
}

export function getBeneficialOwnerParties(
  client: ClientResponse | undefined
): PartyResponse[] {
  return (
    client?.parties?.filter(
      (party) =>
        party.partyType === 'INDIVIDUAL' &&
        party.roles?.includes('BENEFICIAL_OWNER') &&
        party.active !== false
    ) ?? []
  );
}

export interface ClientDetailsSectionGroup {
  id: string;
  label: string;
  type:
    | 'client-info'
    | 'organization'
    | 'controller'
    | 'beneficial-owners'
    | 'question-responses'
    | 'results';
  hasContent: boolean;
}

// Mapping from section type to i18n key
const SECTION_I18N_KEYS: Record<ClientDetailsSectionGroup['type'], string> = {
  'client-info': 'clientInfo',
  organization: 'organization',
  controller: 'controller',
  'beneficial-owners': 'beneficialOwners',
  'question-responses': 'questionResponses',
  results: 'verificationResults',
};

// Fallback labels (used when no translation function provided)
const SECTION_LABELS: Record<ClientDetailsSectionGroup['type'], string> = {
  'client-info': 'Client information',
  organization: 'Organization',
  controller: 'Controller',
  'beneficial-owners': 'Beneficial owners',
  'question-responses': 'Question responses',
  results: 'Verification results',
};

/**
 * Get the label for a section type, using translation if available.
 */
function getSectionLabel(
  type: ClientDetailsSectionGroup['type'],
  t?: (key: string) => string
): string {
  if (t) {
    return t(`client-details:sections.${SECTION_I18N_KEYS[type]}`);
  }
  return SECTION_LABELS[type];
}

/**
 * Section order follows business sense:
 * 1. Client information – application summary (status, products, created)
 * 2. Verification results – KYC/identity outcome (so status is visible early)
 * 3. Organization – the business entity
 * 4. Controller – key individual
 * 5. Beneficial owners – other stakeholders
 * 6. Question responses – operational/regulatory answers
 *
 * @param client - The client response data
 * @param t - Optional translation function for i18n support
 */
export function getClientDetailsSections(
  client: ClientResponse,
  t?: (key: string) => string
): ClientDetailsSectionGroup[] {
  const org = getOrganizationParty(client);
  const controller = getControllerParty(client);
  const beneficialOwners = getBeneficialOwnerParties(client);
  const hasResults = !!client.results;

  const sections: ClientDetailsSectionGroup[] = [
    {
      id: 'client-info',
      label: getSectionLabel('client-info', t),
      type: 'client-info',
      hasContent: true,
    },
    {
      id: 'results',
      label: getSectionLabel('results', t),
      type: 'results',
      hasContent: hasResults,
    },
    {
      id: 'organization',
      label: getSectionLabel('organization', t),
      type: 'organization',
      hasContent: !!org,
    },
    {
      id: 'controller',
      label: getSectionLabel('controller', t),
      type: 'controller',
      hasContent: !!controller,
    },
    {
      id: 'beneficial-owners',
      label: getSectionLabel('beneficial-owners', t),
      type: 'beneficial-owners',
      hasContent: beneficialOwners.length > 0,
    },
    {
      id: 'question-responses',
      label: getSectionLabel('question-responses', t),
      type: 'question-responses',
      hasContent: true,
    },
  ];
  return sections.filter((s) => s.hasContent) as ClientDetailsSectionGroup[];
}
