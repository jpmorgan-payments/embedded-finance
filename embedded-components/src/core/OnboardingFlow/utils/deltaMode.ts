import { objectKeys } from '@/utils/objectEntries';

import type {
  ClientResponse,
  QuestionResponse,
} from '@/api/generated/smbdo.schemas';
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
      defaultControllerNotAnOwner: false,
      reviewSectionsDisplay: 'collapsible',
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
    defaultControllerNotAnOwner: deltaMode.defaultControllerNotAnOwner ?? false,
    reviewSectionsDisplay: deltaMode.reviewSectionsDisplay ?? 'collapsible',
  };
}

/**
 * Fields that count toward delta-mode eligibility, sourced entirely from
 * `partyFieldMap` entries flagged with `deltaEligibility`. fieldMap is the
 * single source of truth: WHICH fields count, WHERE their value lives (the
 * entry's `path`), and whether the check is US-only — so this heuristic no
 * longer hard-codes API shape. Built once at module load (fieldMap is static).
 */
type EligibilityField = { path: string; usOnly: boolean; isAddress: boolean };

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
        isAddress: config.presentation?.customEditor === 'address',
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
 * An address is "pending" unless its required parts are all present. The party
 * payload stores addresses as an array of objects; the schema requires a first
 * address line, city, state, postal code and country. A presence-only check
 * (non-empty array) would treat a partial address (e.g. missing state) as done,
 * so we look at the first address object's required leaves.
 */
function isAddressPending(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) {
    return true;
  }
  const address = value[0] as Record<string, unknown> | undefined;
  if (!address) {
    return true;
  }
  const lines = address.addressLines;
  const hasLine = Array.isArray(lines)
    ? lines.some((line) => String(line ?? '').trim() !== '')
    : String(lines ?? '').trim() !== '';
  return (
    !hasLine ||
    isEmptyValue(address.city) ||
    isEmptyValue(address.state) ||
    isEmptyValue(address.postalCode) ||
    isEmptyValue(address.country)
  );
}

/**
 * Count the eligibility fields on a party whose value (read via the fieldMap
 * `path`) is missing, honoring each field's `usOnly` gate. Address fields use a
 * completeness check (all required leaves present) rather than presence only.
 */
function countMissingEligibilityFields(
  party: unknown,
  fields: ReadonlyArray<EligibilityField>,
  partyIsUS: boolean
): number {
  return fields.filter((field) => {
    if (!partyIsUS && field.usOnly) {
      return false;
    }
    const value = getValueAtPath(party, field.path);
    return field.isAddress ? isAddressPending(value) : isEmptyValue(value);
  }).length;
}

/**
 * IDs of questions that are conditional children (gated by a parent's answer).
 * A question is a child when another question lists it under `subQuestions`, or
 * when its own `parentQuestionId` is set.
 */
function getConditionalChildQuestionIds(
  questionDefinitions: QuestionResponse[]
): Set<string> {
  const childIds = new Set<string>();
  for (const question of questionDefinitions) {
    (question.subQuestions ?? []).forEach((sq) =>
      (sq.questionIds ?? []).forEach((id) => childIds.add(String(id)))
    );
    if (
      question.parentQuestionId != null &&
      `${question.parentQuestionId}` !== '' &&
      question.id != null
    ) {
      childIds.add(String(question.id));
    }
  }
  return childIds;
}

/**
 * Count outstanding operational-details questions, EXCLUDING conditional
 * sub-questions. A conditional child only applies once its parent is answered a
 * triggering way, so counting it up front over-states the remaining work and
 * can wrongly push a client past `maxPendingFields`. Children are identified
 * from the fetched question definitions. Without definitions (e.g. unit tests,
 * or the fetch hasn't resolved) every outstanding ID counts — the prior
 * behavior — which is safe because undercounting, not overcounting, is the
 * risk we guard against.
 */
function countOutstandingTopLevelQuestions(
  outstandingQuestionIds: string[] | undefined,
  questionDefinitions: QuestionResponse[] | undefined
): number {
  const ids = outstandingQuestionIds ?? [];
  if (ids.length === 0) {
    return 0;
  }
  if (!questionDefinitions || questionDefinitions.length === 0) {
    return ids.length;
  }
  const childIds = getConditionalChildQuestionIds(questionDefinitions);
  return ids.filter((id) => !childIds.has(String(id))).length;
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
 * - Outstanding top-level operational question IDs (conditional sub-questions
 *   are excluded — their parent answer gates them; see
 *   {@link countOutstandingTopLevelQuestions})
 * - Missing organization eligibility fields
 * - Missing controller eligibility fields
 * - Missing owner eligibility fields (non-controller beneficial owners)
 */
export function countPendingOnboardingFields(
  clientData: ClientResponse | undefined,
  questionDefinitions?: QuestionResponse[]
): number {
  if (!clientData) {
    return Number.POSITIVE_INFINITY;
  }

  // Delta mode is a "fill in the last few fields" path and assumes the
  // controller party already exists. When there is no controller party at all
  // (or it has no details yet), the entire controller section is still
  // outstanding — far more than a delta's worth of work — so the client is
  // ineligible regardless of what else is filled in. Returning Infinity keeps
  // the pending count honest so the `maxPendingFields` cap can't be slipped by
  // simply not counting the missing controller's fields.
  const controllerParty = getPartyByAssociatedPartyFilters(clientData, {
    partyType: 'INDIVIDUAL',
    roles: ['CONTROLLER'],
  });
  const controllerDetails = controllerParty?.individualDetails;
  if (!controllerParty?.id || !controllerDetails) {
    return Number.POSITIVE_INFINITY;
  }

  let count = countOutstandingTopLevelQuestions(
    clientData.outstanding?.questionIds,
    questionDefinitions
  );

  const orgParty = getOrganizationParty(clientData);
  const orgDetails = orgParty?.organizationDetails;
  if (orgDetails) {
    count += countMissingEligibilityFields(
      orgParty,
      ORG_ELIGIBILITY_FIELDS,
      orgDetails.countryOfFormation === 'US'
    );
  }

  count += countMissingEligibilityFields(
    controllerParty,
    INDIVIDUAL_ELIGIBILITY_FIELDS,
    controllerDetails.countryOfResidence === 'US'
  );

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
  clientData: ClientResponse | undefined,
  questionDefinitions?: QuestionResponse[]
): boolean {
  const config = resolveDeltaModeConfig(deltaMode);
  if (!config) {
    return false;
  }
  if (!clientData?.id) {
    return false;
  }
  const pendingCount = countPendingOnboardingFields(
    clientData,
    questionDefinitions
  );
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
