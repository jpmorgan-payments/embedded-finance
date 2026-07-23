import { objectKeys } from '@/utils/objectEntries';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { partyFieldMap } from '@/core/OnboardingFlow/config/fieldMap';
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
 * Fields that count toward delta-mode eligibility, sourced entirely from
 * `partyFieldMap` entries flagged with `deltaEligibility`. fieldMap is the
 * single source of truth: WHICH fields count, WHERE their value lives (the
 * entry's `path`), and whether the check is US-only — so this heuristic no
 * longer hard-codes API shape. Built once at module load (fieldMap is static).
 */
type EligibilityField = { path: string; usOnly: boolean };

const {
  organization: ORG_ELIGIBILITY_FIELDS,
  individual: INDIVIDUAL_ELIGIBILITY_FIELDS,
} = objectKeys(partyFieldMap).reduce<{
  organization: EligibilityField[];
  individual: EligibilityField[];
}>(
  (acc, key) => {
    const config = partyFieldMap[key];
    const rule = config?.deltaEligibility;
    if (rule && config.path) {
      acc[rule.party].push({
        path: config.path,
        usOnly: rule.usOnly ?? false,
      });
    }
    return acc;
  },
  { organization: [], individual: [] }
);

/** Read a nested value from a party by dot-path (the fieldMap `path`). */
function getValueAtPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') {
      return undefined;
    }
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

/** A required value is "pending" when it is absent, blank, or an empty array. */
function isEmptyValue(value: unknown): boolean {
  return (
    value == null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Count the eligibility fields on a party whose value (read via the fieldMap
 * `path`) is missing, honoring each field's `usOnly` gate.
 */
function countMissingEligibilityFields(
  party: unknown,
  fields: ReadonlyArray<EligibilityField>,
  partyIsUS: boolean
): number {
  return fields.filter(
    (field) =>
      (partyIsUS || !field.usOnly) &&
      isEmptyValue(getValueAtPath(party, field.path))
  ).length;
}

/**
 * Count pending fields for delta-mode eligibility. This is a deliberately light
 * heuristic (see DELTA_MODE_SPEC §5.2) — it does NOT run the Zod schemas
 * (they're hook-based) and does NOT need to match the panel's full Zod-driven
 * set. Undercounting is safe: delta still activates and the panel surfaces the
 * real missing fields. The counted fields are declared in `partyFieldMap` via
 * `deltaEligibility` (fieldMap is the source of truth), never hard-coded here.
 *
 * Counts:
 * - Outstanding operational question IDs
 * - Missing organization eligibility fields
 * - Missing controller eligibility fields
 * - Missing owner eligibility fields (non-controller beneficial owners)
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
  if (orgDetails) {
    count += countMissingEligibilityFields(
      orgParty,
      ORG_ELIGIBILITY_FIELDS,
      orgDetails.countryOfFormation === 'US'
    );
  }

  const controllerParty = getPartyByAssociatedPartyFilters(clientData, {
    partyType: 'INDIVIDUAL',
    roles: ['CONTROLLER'],
  });
  const controllerDetails = controllerParty?.individualDetails;
  if (controllerDetails) {
    count += countMissingEligibilityFields(
      controllerParty,
      INDIVIDUAL_ELIGIBILITY_FIELDS,
      controllerDetails.countryOfResidence === 'US'
    );
  }

  for (const owner of getActiveOwners(clientData) ?? []) {
    const ownerDetails = owner.individualDetails;
    if (!owner.roles?.includes('CONTROLLER') && ownerDetails) {
      count += countMissingEligibilityFields(
        owner,
        INDIVIDUAL_ELIGIBILITY_FIELDS,
        ownerDetails.countryOfResidence === 'US'
      );
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
