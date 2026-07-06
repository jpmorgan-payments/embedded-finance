import type { BankAccountFormData } from '@/core/RecipientWidgets/components/BankAccountForm';

/**
 * Fills in individual account-holder name/type fields from a known party when
 * the host did not explicitly provide them. Mutates the passed object.
 */
function enrichIndividualParty(
  enriched: Partial<BankAccountFormData>,
  party: Record<string, unknown>
) {
  const details = party.individualDetails as
    | { firstName?: string; lastName?: string }
    | undefined;
  if (details) {
    if (!enriched.firstName) enriched.firstName = details.firstName ?? '';
    if (!enriched.lastName) enriched.lastName = details.lastName ?? '';
  }
  if (!enriched.accountType) enriched.accountType = 'INDIVIDUAL';
}

/**
 * Fills in organization account-holder name/type fields from a known party when
 * the host did not explicitly provide them. Mutates the passed object.
 */
function enrichOrganizationParty(
  enriched: Partial<BankAccountFormData>,
  party: Record<string, unknown>
) {
  const details = party.organizationDetails as
    | { organizationName?: string }
    | undefined;
  if (details && !enriched.businessName) {
    enriched.businessName = details.organizationName ?? '';
  }
  if (!enriched.accountType) enriched.accountType = 'ORGANIZATION';
}

/**
 * Enriches initial values with account-holder name fields derived from a party.
 */
export function enrichInitialValuesWithPartyName(
  rawValues: Partial<BankAccountFormData>,
  party: Record<string, unknown>
): Partial<BankAccountFormData> {
  const enriched = { ...rawValues };
  if (party.partyType === 'INDIVIDUAL') {
    enrichIndividualParty(enriched, party);
  } else if (party.partyType === 'ORGANIZATION') {
    enrichOrganizationParty(enriched, party);
  }
  return enriched;
}
