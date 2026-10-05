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

/** Operations configured for the client's exact country and legal entity type. */
export function getEligibleMaintenanceOperations(
  client: MaintenanceClient,
  eligibility: readonly ApprovedClientMaintenanceEligibilityRule[]
): ReadonlySet<ApprovedClientMaintenanceOperation> {
  const organization = getClientOrganization(client);
  const country = organization?.organizationDetails?.countryOfFormation;
  const organizationType = organization?.organizationDetails?.organizationType;
  if (!country || !organizationType) return new Set();

  return new Set(
    eligibility
      .filter(
        (rule) =>
          rule.country === country && rule.organizationType === organizationType
      )
      .flatMap((rule) => rule.operations)
  );
}
