import type {
  ApprovedClientMaintenanceEligibilityRule,
  ApprovedClientMaintenanceOperation,
} from '../ApprovedClientMaintenance.types';
import type { MaintenanceClient } from '../models/maintenanceApi.types';

const getClientOrganization = (client: MaintenanceClient) =>
  client.parties?.find(
    (party) =>
      party.id === client.partyId ||
      (party.partyType === 'ORGANIZATION' && party.roles?.includes('CLIENT'))
  );

export function isMaintenanceOperationEligible(
  client: MaintenanceClient,
  eligibility: readonly ApprovedClientMaintenanceEligibilityRule[],
  operation: ApprovedClientMaintenanceOperation
) {
  const organization = getClientOrganization(client);
  const country = organization?.organizationDetails?.countryOfFormation;
  const organizationType = organization?.organizationDetails?.organizationType;
  if (!country || !organizationType) return false;

  return eligibility.some(
    (rule) =>
      rule.country === country &&
      rule.organizationType === organizationType &&
      rule.operations.includes(operation)
  );
}
