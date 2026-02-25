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
  type:
    | 'client-info'
    | 'organization'
    | 'controller'
    | 'beneficial-owners'
    | 'question-responses'
    | 'results';
  hasContent: boolean;
}

// Mapping from section type to i18n key - exported for use in components
// The values match keys in client-details.json under "sections"
export const SECTION_I18N_KEYS = {
  'client-info': 'clientInfo',
  organization: 'organization',
  controller: 'controller',
  'beneficial-owners': 'beneficialOwners',
  'question-responses': 'questionResponses',
  results: 'verificationResults',
} as const satisfies Record<ClientDetailsSectionGroup['type'], string>;

// Type for the i18n key values
export type SectionI18nKey =
  (typeof SECTION_I18N_KEYS)[ClientDetailsSectionGroup['type']];

// Fallback labels (used when translation not available - for debugging)
const SECTION_LABELS: Record<ClientDetailsSectionGroup['type'], string> = {
  'client-info': 'Client information',
  organization: 'Organization',
  controller: 'Controller',
  'beneficial-owners': 'Beneficial owners',
  'question-responses': 'Question responses',
  results: 'Verification results',
};

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
 */
export function getClientDetailsSections(
  client: ClientResponse
): ClientDetailsSectionGroup[] {
  const org = getOrganizationParty(client);
  const controller = getControllerParty(client);
  const beneficialOwners = getBeneficialOwnerParties(client);
  const hasResults = !!client.results;

  const sections: ClientDetailsSectionGroup[] = [
    {
      id: 'client-info',
      type: 'client-info',
      hasContent: true,
    },
    {
      id: 'results',
      type: 'results',
      hasContent: hasResults,
    },
    {
      id: 'organization',
      type: 'organization',
      hasContent: !!org,
    },
    {
      id: 'controller',
      type: 'controller',
      hasContent: !!controller,
    },
    {
      id: 'beneficial-owners',
      type: 'beneficial-owners',
      hasContent: beneficialOwners.length > 0,
    },
    {
      id: 'question-responses',
      type: 'question-responses',
      hasContent: true,
    },
  ];
  return sections.filter((s) => s.hasContent) as ClientDetailsSectionGroup[];
}
