import type { MaintenanceParty } from '../models/maintenanceApi.types';
import type { PartyChange } from './buildMaintenanceProjection';

const humanizeEnum = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .join(' ')
    .replace(/^./, (character) => character.toUpperCase());

const buildIndividualName = (party: MaintenanceParty) =>
  [
    party.individualDetails?.firstName,
    party.individualDetails?.middleName,
    party.individualDetails?.lastName,
  ]
    .filter(Boolean)
    .join(' ');

export type MaintenancePartyIdentity = {
  displayName: string;
  previousName?: string;
};

export function getMaintenancePartyIdentity(
  party: MaintenanceParty,
  change: PartyChange | undefined,
  notProvided: string
): MaintenancePartyIdentity {
  const approvedName = buildIndividualName(party) || notProvided;
  if (!change) return { displayName: approvedName };

  const proposedParty: MaintenanceParty = {
    ...party,
    individualDetails: {
      ...party.individualDetails,
      ...change.proposal.individualDetails,
    },
  };
  const proposedName = buildIndividualName(proposedParty) || notProvided;

  return proposedName === approvedName
    ? { displayName: approvedName }
    : { displayName: proposedName, previousName: approvedName };
}

export function formatMaintenanceRoles(
  roles: string[] | undefined,
  translateRole: (role: string, fallback: string) => string,
  noRoles: string
) {
  if (!roles?.length) return noRoles;
  return roles
    .map((role) => translateRole(role, humanizeEnum(role)))
    .join(' · ');
}
