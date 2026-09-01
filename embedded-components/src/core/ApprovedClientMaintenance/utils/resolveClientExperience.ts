import {
  isActiveMaintenanceStatus,
  isTerminalMaintenanceStatus,
  type MaintenanceClient,
  type MaintenanceParty,
} from '../models/maintenanceApi.types';

export type ClientExperienceResolution =
  | { kind: 'onboarding' }
  | { kind: 'approved-profile'; hasMaintenanceHistory: boolean }
  | { kind: 'maintenance' }
  | { kind: 'discovery-error'; reason: 'incomplete' };

type ResolveClientExperienceInput = {
  client?: MaintenanceClient;
  maintenanceParties?: MaintenanceParty[];
  isClientComplete: boolean;
  isMaintenanceComplete: boolean;
};

export function resolveClientExperience({
  client,
  maintenanceParties,
  isClientComplete,
  isMaintenanceComplete,
}: ResolveClientExperienceInput): ClientExperienceResolution {
  if (!isClientComplete || !isMaintenanceComplete || !client) {
    return { kind: 'discovery-error', reason: 'incomplete' };
  }

  const requests = [
    client.updateRequest,
    ...(maintenanceParties ?? []).map((party) => party.updateRequest),
  ].filter((request) => request !== undefined);
  const hasActiveMaintenance = requests.some((request) =>
    isActiveMaintenanceStatus(request.status)
  );
  if (hasActiveMaintenance) return { kind: 'maintenance' };

  const hasMaintenanceHistory = requests.some((request) =>
    isTerminalMaintenanceStatus(request.status)
  );
  if (hasMaintenanceHistory) {
    return { kind: 'approved-profile', hasMaintenanceHistory: true };
  }

  if (client.status === 'APPROVED') {
    return { kind: 'approved-profile', hasMaintenanceHistory: false };
  }

  return { kind: 'onboarding' };
}
