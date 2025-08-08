import { i18n } from '@/i18n/config';

import {
  ClientQuestionResponse,
  ClientResponse,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { AssociatedPartyFilters } from '@/core/OnboardingFlow/types/flow.types';
import { ClientContext } from '@/core/OnboardingFlow/types/form.types';

export function getAllOwners(clientData: ClientResponse | undefined) {
  return clientData?.parties?.filter(
    (party) =>
      party?.partyType === 'INDIVIDUAL' &&
      party?.roles?.includes('BENEFICIAL_OWNER')
  );
}

export function getActiveOwners(clientData: ClientResponse | undefined) {
  return getAllOwners(clientData)?.filter((owner) => owner.active);
}

export function getInactiveOwners(clientData: ClientResponse | undefined) {
  return getAllOwners(clientData)?.filter((owner) => !owner.active);
}

export function getClientContext(
  clientData: ClientResponse | undefined
): ClientContext {
  const organizationParty = clientData?.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  );

  return {
    product: clientData?.products?.[0],
    jurisdiction: organizationParty?.organizationDetails?.jurisdiction,
    entityType: organizationParty?.organizationDetails?.organizationType,
  };
}

export const getPartyByAssociatedPartyFilters = (
  clientData?: ClientResponse,
  associatedPartyFilters?: AssociatedPartyFilters
) => {
  return (
    clientData?.parties?.find((party) => {
      return (
        party.active &&
        party.partyType === associatedPartyFilters?.partyType &&
        associatedPartyFilters?.roles?.every((role) =>
          party.roles?.includes(role)
        )
      );
    }) ?? {}
  );
};

export const getOrganizationParty = (clientData?: ClientResponse) => {
  return clientData?.parties?.find(
    (party) =>
      party.active &&
      party.partyType === 'ORGANIZATION' &&
      party.roles?.includes('CLIENT')
  );
};

export const getControllerParty = (clientData?: ClientResponse) => {
  return clientData?.parties?.find(
    (party) =>
      party.active &&
      party.partyType === 'INDIVIDUAL' &&
      party.roles?.includes('CONTROLLER')
  );
};

export const getPartyName = (partyData?: PartyResponse) => {
  if (!partyData) return '';

  const { individualDetails, organizationDetails } = partyData;

  const { firstName, middleName, lastName, nameSuffix } =
    individualDetails || {};

  if (organizationDetails?.organizationName) {
    return organizationDetails.organizationName;
  }

  return [firstName, middleName, lastName, nameSuffix]
    .filter(Boolean)
    .join(' ')
    .trim();
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatQuestionResponse = (response: ClientQuestionResponse) => {
  if (response.questionId === '30005') {
    return currencyFormatter.format(Number(response.values?.[0]) || 0);
  }
  const formattedResponse = response.values?.join(', ') || '';

  if (formattedResponse === 'false') {
    return i18n.t('common:no');
  }
  if (formattedResponse === 'true') {
    return i18n.t('common:yes');
  }
  return formattedResponse;
};

export const clientHasOutstandingDocRequests = (
  clientData: ClientResponse | undefined
): boolean => {
  return (clientData?.outstanding.documentRequestIds?.length ?? 0) > 0;
};

export const convertClientToSoleProprietorship = (
  clientData: ClientResponse | undefined
): ClientResponse | undefined => {
  if (!clientData) return undefined;

  const updatedClientData = { ...clientData };

  // Update organization type to SOLE_PROPRIETORSHIP
  const orgParty = getOrganizationParty(updatedClientData);
  const controllerParty = getControllerParty(updatedClientData);

  if (orgParty) {
    orgParty.organizationDetails = {
      ...orgParty.organizationDetails,
      organizationType: 'SOLE_PROPRIETORSHIP',
      countryOfFormation: 'US',
    };

    if (controllerParty) {
      orgParty.organizationDetails.organizationName =
        getPartyName(controllerParty);
    }
  }

  if (controllerParty) {
    if (!controllerParty.roles?.includes('BENEFICIAL_OWNER')) {
      controllerParty.roles = [
        ...(controllerParty.roles || []),
        'BENEFICIAL_OWNER',
      ];
    }
  }

  return updatedClientData;
};
