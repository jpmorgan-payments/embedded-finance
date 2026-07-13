import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import type {
  OnboardingDeltaModeConfig,
  OnboardingDeltaModeProp,
} from '@/core/OnboardingFlow/types/onboarding.types';

import {
  getActiveOwners,
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
} from './dataUtils';

/** Default max pending fields allowed for delta mode (host-overridable). */
export const DEFAULT_DELTA_MODE_MAX_PENDING_FIELDS = 5;

/** Default review UX when delta mode is enabled without an explicit variant. */
export const DEFAULT_DELTA_MODE_VARIANT = 'panel' as const;

/**
 * Normalize the public `deltaMode` prop into a config object, or `null` when off.
 */
export function resolveDeltaModeConfig(
  deltaMode: OnboardingDeltaModeProp | undefined
): OnboardingDeltaModeConfig | null {
  if (deltaMode === true) {
    return {
      enabled: true,
      maxPendingFields: DEFAULT_DELTA_MODE_MAX_PENDING_FIELDS,
      variant: DEFAULT_DELTA_MODE_VARIANT,
    };
  }
  if (deltaMode === false || deltaMode == null) {
    return null;
  }
  if (!deltaMode.enabled) {
    return null;
  }
  return {
    enabled: true,
    maxPendingFields:
      deltaMode.maxPendingFields ?? DEFAULT_DELTA_MODE_MAX_PENDING_FIELDS,
    variant: deltaMode.variant ?? DEFAULT_DELTA_MODE_VARIANT,
  };
}

/**
 * Count pending fields for delta-mode eligibility without running Zod schemas
 * (schemas use React hooks and cannot run outside components).
 *
 * Counts:
 * - Outstanding operational question IDs
 * - Missing business EIN (US org with empty `organizationIds`)
 * - Missing controller tax ID / birthDate
 * - Missing owner tax IDs (non-controller beneficial owners)
 */
export function countPendingOnboardingFields(
  clientData: ClientResponse | undefined
): number {
  if (!clientData) {
    return Number.POSITIVE_INFINITY;
  }

  let count = clientData.outstanding?.questionIds?.length ?? 0;

  const orgParty = getOrganizationParty(clientData);
  const orgDetails = orgParty?.organizationDetails;
  if (
    orgDetails?.countryOfFormation === 'US' &&
    (!orgDetails.organizationIds || orgDetails.organizationIds.length === 0)
  ) {
    count += 1;
  }

  const controllerParty = getPartyByAssociatedPartyFilters(clientData, {
    partyType: 'INDIVIDUAL',
    roles: ['CONTROLLER'],
  });
  const individualDetails = controllerParty?.individualDetails;
  if (individualDetails?.countryOfResidence === 'US') {
    if (
      !individualDetails.individualIds ||
      individualDetails.individualIds.length === 0
    ) {
      count += 1;
    }
  }
  if (individualDetails && !individualDetails.birthDate) {
    count += 1;
  }

  const activeOwners = getActiveOwners(clientData) ?? [];
  for (const owner of activeOwners) {
    if (!owner.roles?.includes('CONTROLLER')) {
      const details = owner.individualDetails;
      if (
        details?.countryOfResidence === 'US' &&
        (!details.individualIds || details.individualIds.length === 0)
      ) {
        count += 1;
      }
      if (details && !details.birthDate) {
        count += 1;
      }
    }
  }

  return count;
}

/**
 * Whether delta mode should be active for the current client payload.
 * Requires the host flag plus pending-field count within the configured cap.
 */
export function isDeltaModeActive(
  deltaMode: OnboardingDeltaModeProp | undefined,
  clientData: ClientResponse | undefined
): boolean {
  const config = resolveDeltaModeConfig(deltaMode);
  if (!config) {
    return false;
  }
  if (!clientData?.id) {
    return false;
  }
  const pendingCount = countPendingOnboardingFields(clientData);
  const maxPending =
    config.maxPendingFields ?? DEFAULT_DELTA_MODE_MAX_PENDING_FIELDS;
  return pendingCount <= maxPending;
}
