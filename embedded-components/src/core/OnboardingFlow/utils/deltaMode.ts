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

// Temporary highlight applied to a delta section card when it is navigated to.
// Listed as literals so Tailwind's content scanner emits these classes (they're
// only ever added via classList, never as a static className).
const DELTA_SECTION_HIGHLIGHT_CLASSES = [
  'eb-ring-2',
  'eb-ring-primary',
  'eb-ring-offset-2',
  'eb-ring-offset-background',
];
const DELTA_SECTION_HIGHLIGHT_MS = 1600;

/**
 * Scroll to a delta pending-section card and briefly flash a highlight ring, so
 * that clicking a sidebar timeline item, a progress pill, or "Save & continue"
 * makes it obvious which box was targeted (scrolling alone is easy to miss).
 */
export function scrollToDeltaSection(key: string): void {
  const el = document.getElementById(`delta-section-${key}`);
  if (!el) {
    return;
  }

  el.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Restart cleanly if the ring is still showing from a rapid previous click.
  el.classList.remove(...DELTA_SECTION_HIGHLIGHT_CLASSES);
  // Force a reflow so re-adding the classes retriggers the transition.
  el.getBoundingClientRect();
  el.classList.add(
    'eb-transition-shadow',
    'eb-duration-300',
    ...DELTA_SECTION_HIGHLIGHT_CLASSES
  );

  window.setTimeout(() => {
    el.classList.remove(...DELTA_SECTION_HIGHLIGHT_CLASSES);
  }, DELTA_SECTION_HIGHLIGHT_MS);
}
