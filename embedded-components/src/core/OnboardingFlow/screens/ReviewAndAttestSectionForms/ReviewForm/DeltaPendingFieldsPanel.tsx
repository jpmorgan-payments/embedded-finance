import { Fragment, memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { objectKeys } from '@/utils/objectEntries';
import { toNestErrors } from '@hookform/resolvers';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2Icon,
  DollarSignIcon,
  TagIcon,
  Users2Icon,
  type LucideIcon,
} from 'lucide-react';
import {
  FormProvider,
  useForm,
  useFormContext,
  useFormState,
  useWatch,
  type Resolver,
  type ResolverResult,
  type UseFormReturn,
} from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import {
  getSmbdoGetClientQueryKey,
  useSmbdoUpdateClientLegacy,
  useUpdatePartyLegacy,
} from '@/api/generated/smbdo';
import { QuestionResponse } from '@/api/generated/smbdo.schemas';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge, Card } from '@/components/ui';
import {
  AddressFields,
  ControllerIdFields,
  OnboardingFormField,
} from '@/core/OnboardingFlow/components';
import { useIndustryTooltip } from '@/core/OnboardingFlow/components/IndustryTypeSelect';
import { partyFieldMap } from '@/core/OnboardingFlow/config/fieldMap';
import {
  COUNTRIES_OF_FORMATION,
  JOB_TITLES,
} from '@/core/OnboardingFlow/consts';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useOrganizationDescriptionTooltip } from '@/core/OnboardingFlow/forms/business-section-forms/IndustryForm/useOrganizationDescriptionTooltip';
import { useFlowUnsavedChangesSync } from '@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync';
import { useStableStepSchemas } from '@/core/OnboardingFlow/hooks/useStableStepSchemas';
import {
  createDynamicZodSchema,
  MONEY_INPUT_QUESTION_IDS,
} from '@/core/OnboardingFlow/screens/OperationalDetailsForm/OperationalDetailsForm.schema';
import { useQuestionTree } from '@/core/OnboardingFlow/screens/OperationalDetailsForm/useQuestionTree';
import type {
  SectionScreenConfig,
  StepConfig,
} from '@/core/OnboardingFlow/types/flow.types';
import type { OnboardingFormValuesSubmit } from '@/core/OnboardingFlow/types/form.types';
import {
  getActiveOwners,
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
  getPartyName,
} from '@/core/OnboardingFlow/utils/dataUtils';
import {
  getStepperValidation,
  type StepSchemaMap,
} from '@/core/OnboardingFlow/utils/flowUtils';
import {
  convertPartyResponseToFormValues,
  generatePartyRequestBody,
} from '@/core/OnboardingFlow/utils/formUtils';
import {
  isQuestionVisible as computeQuestionVisibility,
  getChildQuestions,
  isTopLevelQuestion,
  normalizeQuestionId,
} from '@/core/OnboardingFlow/utils/questionTree';

type DeltaPendingFieldsPanelProps = {
  sections: SectionScreenConfig[];
  form: UseFormReturn<Record<string, unknown>>;
  /**
   * Pre-built raw party step schemas (from `useDeltaPendingFieldsForm`). Passed
   * in so the panel does not invoke the hook-based schema factories itself — it
   * only runs pure `safeParse` for the live group-completion borders.
   */
  stepSchemas: StepSchemaMap;
  /**
   * Baseline pending groups (from GET client, computed once by the form hook).
   * Determines which fields render; does not shrink while the user types.
   */
  baselinePendingGroups: PendingStepGroup[];
};

type PendingField = {
  /** Root form field key from Zod (e.g. `birthDate`, `controllerIds`, `individualAddress`) */
  fieldKey: string;
  /**
   * Full Zod issue path joined (e.g. `individualAddress.city`, `controllerIds.0.value`).
   * Used as the RHF control name when more specific than the root key.
   */
  issuePath: string;
  /** RHF path for the editable control (may be nested under `owners.{partyId}.`) */
  formPath: string;
  partyId?: string;
};

type PendingStepGroup = {
  key: string;
  fields: PendingField[];
};

/** Whether a live delta form value answers an outstanding question. */
export function isDeltaQuestionAnswered(
  values: Record<string, unknown> | undefined,
  questionId: string
): boolean {
  const live = values?.[`question_${questionId}`];
  if (Array.isArray(live)) {
    return live.some((v) => String(v).trim() !== '');
  }
  if (live == null) {
    return false;
  }
  return String(live).trim() !== '';
}

/**
 * Expand a group's baseline pending fields with any dependent fields currently
 * revealed by a parent's LIVE value (e.g. `controllerJobTitle: 'Other'` reveals
 * `controllerJobTitleDescription`). Baseline groups are computed from GET data,
 * so a field that only becomes required after the user picks a value isn't in
 * `group.fields` — this adds it so the completion border, the "items left"
 * count, and the resolver all treat the revealed field as pending too (not just
 * the render).
 */
function expandGroupFieldsWithReveals(
  fields: PendingField[],
  liveValues: Record<string, unknown> | undefined
): PendingField[] {
  const expanded = [...fields];
  for (const field of fields) {
    const reveals =
      partyFieldMap[field.fieldKey as keyof typeof partyFieldMap]?.presentation
        ?.revealsFields;
    if (reveals?.length) {
      const prefix = field.formPath.slice(
        0,
        field.formPath.indexOf(field.fieldKey)
      );
      const liveValue = String(
        getValueAtPath(liveValues, field.formPath) ?? ''
      );
      for (const reveal of reveals) {
        if (reveal.whenValueIn.includes(liveValue)) {
          const formPath = `${prefix}${reveal.name}`;
          if (!expanded.some((f) => f.formPath === formPath)) {
            expanded.push({
              fieldKey: reveal.name,
              issuePath: formPath,
              formPath,
            });
          }
        }
      }
    }
  }
  return expanded;
}

/**
 * Resolve, for a single baseline pending group, which of its field form-paths
 * are still invalid under the live overlay. `resolved` is false when validation
 * could not run (missing party/step) — callers then treat all fields as
 * remaining. Shared by the group-completeness and field-count helpers so the
 * card borders, the finish gate, and the "items left" count stay in lockstep.
 */
function resolveGroupRemainingPaths(args: {
  group: PendingStepGroup;
  sections: SectionScreenConfig[];
  clientData: Parameters<typeof getStepperValidation>[2];
  ownerSteps: StepConfig[];
  liveOverlay: Record<string, unknown> | undefined;
  currentScreenId: Parameters<typeof getStepperValidation>[4];
  stepSchemas?: StepSchemaMap;
}): { resolved: boolean; remainingPaths: Set<string> } {
  const {
    group,
    sections,
    clientData,
    ownerSteps,
    liveOverlay,
    currentScreenId,
    stepSchemas,
  } = args;
  const [sectionId, maybeOwnerOrStep, maybeStep] = group.key.split(':');
  const isOwnerGroup = sectionId === 'owners-section';

  let stepValidationMap:
    | Record<string, { isValid: boolean; result?: any }>
    | undefined;
  let stepId: string | undefined;

  if (isOwnerGroup) {
    stepId = maybeStep;
    const owner = (getActiveOwners(clientData) ?? []).find(
      (o) => o.id === maybeOwnerOrStep
    );
    if (owner) {
      ({ stepValidationMap } = getStepperValidation(
        ownerSteps,
        owner,
        clientData,
        liveOverlay as Parameters<typeof getStepperValidation>[3],
        'owner-stepper',
        stepSchemas
      ));
    }
  } else {
    stepId = maybeOwnerOrStep;
    const section = sections.find((s) => s.id === sectionId);
    if (section?.type === 'stepper' && section.stepperConfig) {
      const partyData = section.stepperConfig.associatedPartyFilters
        ? getPartyByAssociatedPartyFilters(
            clientData,
            section.stepperConfig.associatedPartyFilters
          )
        : undefined;
      ({ stepValidationMap } = getStepperValidation(
        section.stepperConfig.steps,
        partyData,
        clientData,
        liveOverlay as Parameters<typeof getStepperValidation>[3],
        currentScreenId,
        stepSchemas
      ));
    }
  }

  if (!stepValidationMap || !stepId) {
    return { resolved: false, remainingPaths: new Set() };
  }
  const validation = stepValidationMap[stepId];
  if (validation?.isValid) {
    return { resolved: true, remainingPaths: new Set() };
  }
  if (!validation) {
    return { resolved: false, remainingPaths: new Set() };
  }
  const remainingPaths = new Set(
    (
      (validation.result?.error?.issues ?? []) as {
        path?: (string | number)[];
      }[]
    )
      .map((issue) => {
        const path = issue.path ?? [];
        if (!path.length) return '';
        const mapped = issuePathToFormPath(path);
        return isOwnerGroup
          ? `owners.${maybeOwnerOrStep}.${mapped.formPath}`
          : mapped.formPath;
      })
      .filter(Boolean)
  );
  return { resolved: true, remainingPaths };
}

/**
 * Party-group completeness for delta pending cards / finish gate.
 * Reuses the same getStepperValidation + remaining-path logic as the panel borders.
 *
 * When `touchedFields` is provided, a group is only reported complete once ALL
 * its fields have been blurred (touched) — so a valid-but-not-yet-blurred value
 * does not flip the completion border green before the user leaves the field
 * (blur-consistent with the form's onBlur validation). Omit `touchedFields`
 * (e.g. submit-gate callers) to report completeness purely on value validity.
 */
export function computeCompletedDeltaPendingGroupKeys(args: {
  baselinePendingGroups: PendingStepGroup[];
  sections: SectionScreenConfig[];
  clientData: Parameters<typeof getStepperValidation>[2];
  ownerSteps: StepConfig[];
  liveOverlay: Record<string, unknown> | undefined;
  currentScreenId: Parameters<typeof getStepperValidation>[4];
  stepSchemas?: StepSchemaMap;
  touchedFields?: unknown;
}): Set<string> {
  const {
    baselinePendingGroups,
    sections,
    clientData,
    ownerSteps,
    liveOverlay,
    currentScreenId,
    stepSchemas,
    touchedFields,
  } = args;
  const complete = new Set<string>();

  for (const group of baselinePendingGroups) {
    const { resolved, remainingPaths } = resolveGroupRemainingPaths({
      group,
      sections,
      clientData,
      ownerSteps,
      liveOverlay,
      currentScreenId,
      stepSchemas,
    });

    // Include any fields currently revealed by a live value (e.g. the job-title
    // description when "Other") so the group can't read complete while a
    // freshly-required reveal is still empty.
    const effectiveFields = expandGroupFieldsWithReveals(
      group.fields,
      liveOverlay
    );
    // A group only counts as complete once every one of its fields has been
    // blurred (when touched-gating is requested), matching the onBlur validation.
    const blurred =
      touchedFields === undefined ||
      effectiveFields.every((field) =>
        isDirtyTree(getValueAtPath(touchedFields, field.formPath))
      );

    if (
      resolved &&
      effectiveFields.every((field) => !remainingPaths.has(field.formPath)) &&
      blurred
    ) {
      complete.add(group.key);
    }
  }

  return complete;
}

/**
 * Field-level progress for ONE baseline pending group. A logical field (one
 * `fieldKey`, which may span several leaf paths such as an address's
 * city/state/line) counts as a single item, and is "complete" once every one
 * of its leaves is valid and — when `touchedFields` is supplied — blurred.
 * Shares `resolveGroupRemainingPaths` with the border / finish-gate logic so
 * the count never disagrees with the green completion borders.
 */
function countGroupFieldProgress(args: {
  group: PendingStepGroup;
  sections: SectionScreenConfig[];
  clientData: Parameters<typeof getStepperValidation>[2];
  ownerSteps: StepConfig[];
  liveOverlay: Record<string, unknown> | undefined;
  currentScreenId: Parameters<typeof getStepperValidation>[4];
  stepSchemas?: StepSchemaMap;
  touchedFields?: unknown;
}): { total: number; completed: number } {
  const { group, touchedFields } = args;
  const { resolved, remainingPaths } = resolveGroupRemainingPaths(args);

  // Include fields revealed by a live value (e.g. job-title description) so a
  // freshly-required reveal adds to the "items left" count too.
  const effectiveFields = expandGroupFieldsWithReveals(
    group.fields,
    args.liveOverlay
  );

  // Collapse leaf paths into logical fields so a composite (e.g. an address)
  // counts as ONE item, not one per sub-input.
  const leavesByKey = new Map<string, PendingField[]>();
  for (const field of effectiveFields) {
    const leaves = leavesByKey.get(field.fieldKey) ?? [];
    leaves.push(field);
    leavesByKey.set(field.fieldKey, leaves);
  }

  let total = 0;
  let completed = 0;
  for (const leaves of leavesByKey.values()) {
    total += 1;
    const valueComplete =
      resolved && leaves.every((f) => !remainingPaths.has(f.formPath));
    const blurred =
      touchedFields === undefined ||
      leaves.every((f) =>
        isDirtyTree(getValueAtPath(touchedFields, f.formPath))
      );
    if (valueComplete && blurred) {
      completed += 1;
    }
  }
  return { total, completed };
}

/**
 * Field-level progress keyed by group. Computed where the (hook-based)
 * validation runs — i.e. unconditionally at the top of render — so the pure
 * `buildDeltaSectionSummaries` aggregator can read it without calling schema
 * hooks itself.
 */
export function computeDeltaFieldProgressByGroup(args: {
  baselinePendingGroups: PendingStepGroup[];
  sections: SectionScreenConfig[];
  clientData: Parameters<typeof getStepperValidation>[2];
  ownerSteps: StepConfig[];
  liveOverlay: Record<string, unknown> | undefined;
  currentScreenId: Parameters<typeof getStepperValidation>[4];
  stepSchemas?: StepSchemaMap;
  touchedFields?: unknown;
}): Map<string, { total: number; completed: number }> {
  const {
    baselinePendingGroups,
    sections,
    clientData,
    ownerSteps,
    liveOverlay,
    currentScreenId,
    stepSchemas,
    touchedFields,
  } = args;
  const progress = new Map<string, { total: number; completed: number }>();
  for (const group of baselinePendingGroups) {
    progress.set(
      group.key,
      countGroupFieldProgress({
        group,
        sections,
        clientData,
        ownerSteps,
        liveOverlay,
        currentScreenId,
        stepSchemas,
        touchedFields,
      })
    );
  }
  return progress;
}

/**
 * Count the individual pending fields still left to complete — NOT the number
 * of step groups. Each logical field (composites collapse to one) is counted,
 * remaining until valid and — when `touchedFields` is supplied — blurred.
 */
export function countRemainingDeltaPendingFields(args: {
  baselinePendingGroups: PendingStepGroup[];
  sections: SectionScreenConfig[];
  clientData: Parameters<typeof getStepperValidation>[2];
  ownerSteps: StepConfig[];
  liveOverlay: Record<string, unknown> | undefined;
  currentScreenId: Parameters<typeof getStepperValidation>[4];
  stepSchemas?: StepSchemaMap;
  touchedFields?: unknown;
}): number {
  const {
    baselinePendingGroups,
    sections,
    clientData,
    ownerSteps,
    liveOverlay,
    currentScreenId,
    stepSchemas,
    touchedFields,
  } = args;

  let remaining = 0;
  for (const group of baselinePendingGroups) {
    const { total, completed } = countGroupFieldProgress({
      group,
      sections,
      clientData,
      ownerSteps,
      liveOverlay,
      currentScreenId,
      stepSchemas,
      touchedFields,
    });
    remaining += total - completed;
  }
  return remaining;
}

/**
 * Finish-gate for delta submit: every baseline pending party group must be
 * complete under live values, and every outstanding question must be answered.
 */
export function areDeltaPendingFieldsComplete(args: {
  baselinePendingGroups: PendingStepGroup[];
  sections: SectionScreenConfig[];
  clientData: Parameters<typeof getStepperValidation>[2];
  ownerSteps: StepConfig[];
  liveOverlay: Record<string, unknown> | undefined;
  currentScreenId: Parameters<typeof getStepperValidation>[4];
  outstandingQuestionIds: string[];
  liveFormValues: Record<string, unknown> | undefined;
  stepSchemas?: StepSchemaMap;
}): boolean {
  const completed = computeCompletedDeltaPendingGroupKeys(args);
  const partiesComplete = args.baselinePendingGroups.every((g) =>
    completed.has(g.key)
  );
  const questionsComplete = args.outstandingQuestionIds.every((id) =>
    isDeltaQuestionAnswered(args.liveFormValues, id)
  );
  return partiesComplete && questionsComplete;
}

/**
 * Collect the *specific* party-schema validation errors for each still-pending
 * delta field (e.g. "SSN must be 9 digits", invalid/known-bad SSN, ITIN rules).
 *
 * The delta form's own resolver only validates the operational-details
 * questions, so party fields (like tax IDs) are validated separately via
 * `getStepperValidation`. Without surfacing those messages, a filled-but-invalid
 * ID silently blocks "Save & continue" with no visible reason. Mapping the Zod
 * issues back onto the editable form paths lets the inline field messages tell
 * the user exactly what to fix.
 */
export function collectDeltaPendingFieldErrors(args: {
  baselinePendingGroups: PendingStepGroup[];
  sections: SectionScreenConfig[];
  clientData: Parameters<typeof getStepperValidation>[2];
  ownerSteps: StepConfig[];
  liveOverlay: Record<string, unknown> | undefined;
  currentScreenId: Parameters<typeof getStepperValidation>[4];
  stepSchemas?: StepSchemaMap;
}): Array<{ formPath: string; message: string }> {
  const {
    baselinePendingGroups,
    sections,
    clientData,
    ownerSteps,
    liveOverlay,
    currentScreenId,
    stepSchemas,
  } = args;
  const errors: Array<{ formPath: string; message: string }> = [];
  const seen = new Set<string>();

  for (const group of baselinePendingGroups) {
    const [sectionId, maybeOwnerOrStep, maybeStep] = group.key.split(':');
    const isOwnerGroup = sectionId === 'owners-section';

    let stepValidationMap:
      | Record<string, { isValid: boolean; result?: any }>
      | undefined;
    let stepId: string | undefined;

    if (isOwnerGroup) {
      const ownerId = maybeOwnerOrStep;
      stepId = maybeStep;
      const owner = (getActiveOwners(clientData) ?? []).find(
        (o) => o.id === ownerId
      );
      if (owner) {
        ({ stepValidationMap } = getStepperValidation(
          ownerSteps,
          owner,
          clientData,
          liveOverlay as Parameters<typeof getStepperValidation>[3],
          'owner-stepper',
          stepSchemas
        ));
      }
    } else {
      stepId = maybeOwnerOrStep;
      const section = sections.find((s) => s.id === sectionId);
      if (section?.type === 'stepper' && section.stepperConfig) {
        const partyData = section.stepperConfig.associatedPartyFilters
          ? getPartyByAssociatedPartyFilters(
              clientData,
              section.stepperConfig.associatedPartyFilters
            )
          : undefined;
        ({ stepValidationMap } = getStepperValidation(
          section.stepperConfig.steps,
          partyData,
          clientData,
          liveOverlay as Parameters<typeof getStepperValidation>[3],
          currentScreenId,
          stepSchemas
        ));
      }
    }

    if (stepValidationMap && stepId) {
      const validation = stepValidationMap[stepId];
      if (validation && !validation.isValid) {
        // Include reveal fields (e.g. job-title description when "Other") so
        // their errors surface and gate submit — not just the baseline fields.
        const effectiveFields = expandGroupFieldsWithReveals(
          group.fields,
          liveOverlay
        );
        const issues = (validation.result?.error?.issues ?? []) as {
          path?: (string | number)[];
          message?: string;
        }[];
        issues.forEach((issue) => {
          const path = issue.path ?? [];
          if (!path.length) {
            return;
          }
          const mapped = issuePathToFormPath(path);
          const formPath = isOwnerGroup
            ? `owners.${maybeOwnerOrStep}.${mapped.formPath}`
            : mapped.formPath;
          // Only surface errors on fields the delta panel actually renders for
          // this group (avoids attaching messages to non-editable paths).
          const belongsToGroup = effectiveFields.some(
            (field) => field.formPath === formPath
          );
          if (belongsToGroup && !seen.has(formPath)) {
            seen.add(formPath);
            errors.push({ formPath, message: issue.message ?? '' });
          }
        });
      }
    }
  }

  return errors;
}

/**
 * Baseline pending party groups from GET client (do not shrink while typing).
 * Returns raw i18n keys — callers resolve display text at render time.
 */
export function collectBaselineDeltaPendingGroups(args: {
  sections: SectionScreenConfig[];
  clientData: Parameters<typeof getStepperValidation>[2];
  savedFormValues: Parameters<typeof getStepperValidation>[3];
  currentScreenId: Parameters<typeof getStepperValidation>[4];
  ownerSteps: StepConfig[];
  stepSchemas?: StepSchemaMap;
}): PendingStepGroup[] {
  const {
    sections,
    clientData,
    savedFormValues,
    currentScreenId,
    ownerSteps,
    stepSchemas,
  } = args;
  const groups: PendingStepGroup[] = [];
  const baselineOverlay = savedFormValues;

  for (const section of sections) {
    if (
      section.type === 'stepper' &&
      section.stepperConfig &&
      section.id !== 'owners-section' &&
      section.id !== 'review-attest-section'
    ) {
      const partyData = section.stepperConfig.associatedPartyFilters
        ? getPartyByAssociatedPartyFilters(
            clientData,
            section.stepperConfig.associatedPartyFilters
          )
        : undefined;

      const { stepValidationMap } = getStepperValidation(
        section.stepperConfig.steps,
        partyData,
        clientData,
        baselineOverlay,
        currentScreenId,
        stepSchemas
      );

      const fieldsByStep = collectPendingFieldsFromValidation(
        stepValidationMap,
        section.stepperConfig.steps,
        partyData?.id
      );

      for (const step of section.stepperConfig.steps) {
        const fields = fieldsByStep.get(step.id);
        if (fields?.length) {
          groups.push({
            key: `${section.id}:${step.id}`,
            fields,
          });
        }
      }
    }
  }

  const activeOwners = getActiveOwners(clientData) ?? [];
  for (const owner of activeOwners) {
    if (owner.id && !owner.roles?.includes('CONTROLLER')) {
      const { stepValidationMap } = getStepperValidation(
        ownerSteps,
        owner,
        clientData,
        baselineOverlay,
        'owner-stepper',
        stepSchemas
      );

      const fieldsByStep = collectPendingFieldsFromValidation(
        stepValidationMap,
        ownerSteps,
        owner.id,
        `owners.${owner.id}`
      );

      for (const step of ownerSteps) {
        const fields = fieldsByStep.get(step.id);
        if (fields?.length) {
          groups.push({
            key: `owners-section:${owner.id}:${step.id}`,
            fields,
          });
        }
      }
    }
  }

  return groups;
}

/** Prefer the deepest useful path from a Zod issue for editing. */
function issuePathToFormPath(path: (string | number)[]): {
  fieldKey: string;
  issuePath: string;
  formPath: string;
} {
  const fieldKey = String(path[0] ?? '');
  const issuePath = path.map(String).join('.');

  // controllerIds / solePropSsn: edit the ID value when the issue is on the array/object
  if (fieldKey === 'controllerIds') {
    if (path.length >= 3) {
      return { fieldKey, issuePath, formPath: issuePath };
    }
    return { fieldKey, issuePath, formPath: 'controllerIds.0.value' };
  }

  // Nested object fields (address, phone): edit the specific leaf when present
  if (path.length > 1) {
    return { fieldKey, issuePath, formPath: issuePath };
  }

  return { fieldKey, issuePath, formPath: fieldKey };
}

/**
 * Collapse a group's pending leaves into render units. A composite editor
 * (address / identity) renders ONCE even when several of its leaves are pending
 * — otherwise the whole `AddressFields` / `ControllerIdFields` block would stack
 * once per missing leaf, breaking the field spacing. Simple fields still render
 * one per `formPath`.
 */
function dedupeCompositeFields(fields: PendingField[]): PendingField[] {
  const seen = new Set<string>();
  const units: PendingField[] = [];
  for (const field of fields) {
    const customEditor =
      partyFieldMap[field.fieldKey as keyof typeof partyFieldMap]?.presentation
        ?.customEditor;
    const isComposite =
      customEditor === 'address' || customEditor === 'identity';
    const dedupeKey = isComposite
      ? `composite:${field.fieldKey}`
      : field.formPath;
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      units.push(field);
    }
  }
  return units;
}

/**
 * Renders a field's dependent (revealed) fields based on the parent's LIVE
 * value — the delta equivalent of a step form's `{value === 'Other' && <Field/>}`.
 * Scoped `useWatch` so only this slot re-renders when the parent changes (no
 * panel-wide recompute). `namePrefix` scopes the revealed field's RHF path to
 * the same party as the parent (e.g. `owners.{id}.`).
 */
function DeltaRevealedFields({
  parentName,
  reveals,
  namePrefix,
  renderField,
}: {
  parentName: string;
  reveals: Array<{ name: string; whenValueIn: string[] }> | undefined;
  namePrefix: string;
  renderField: (field: PendingField) => React.ReactNode;
}) {
  const { control } = useFormContext();
  const parentValue = useWatch({
    control,
    name: parentName as never,
  }) as unknown as string | undefined;

  return (
    <>
      {(reveals ?? [])
        .filter((reveal) => reveal.whenValueIn.includes(parentValue ?? ''))
        .map((reveal) => {
          const formPath = `${namePrefix}${reveal.name}`;
          return renderField({
            fieldKey: reveal.name,
            issuePath: formPath,
            formPath,
          });
        })}
    </>
  );
}

function collectPendingFieldsFromValidation(
  stepValidationMap: Record<string, { isValid: boolean; result?: any }>,
  steps: StepConfig[],
  partyId: string | undefined,
  formPathPrefix?: string
): Map<string, PendingField[]> {
  const byStep = new Map<string, PendingField[]>();

  for (const step of steps) {
    if (step.stepType === 'form') {
      const validation = stepValidationMap[step.id];
      if (validation && !validation.isValid && validation.result?.error) {
        const seen = new Set<string>();
        const fields: PendingField[] = [];
        for (const issue of validation.result.error.issues) {
          const path = (issue.path ?? []) as (string | number)[];
          if (path.length) {
            const mapped = issuePathToFormPath(path);
            if (mapped.fieldKey && !seen.has(mapped.formPath)) {
              seen.add(mapped.formPath);
              fields.push({
                fieldKey: mapped.fieldKey,
                issuePath: mapped.issuePath,
                formPath: formPathPrefix
                  ? `${formPathPrefix}.${mapped.formPath}`
                  : mapped.formPath,
                partyId,
              });
            }
          }
        }

        if (fields.length > 0) {
          byStep.set(step.id, fields);
        }
      }
    }
  }

  return byStep;
}

// ---------------------------------------------------------------------------
// Section-grouped progress model (delta completion step)
// ---------------------------------------------------------------------------

export type DeltaSectionSummary = {
  /** Unique key: sectionId, `owners-section:{ownerId}`, or the questions section id. */
  key: string;
  Icon: LucideIcon;
  /** i18n key for the section title, OR a plain string (owner name). */
  titleKey: string;
  /** Whether titleKey is a plain string (not an i18n key). */
  titleIsLiteral?: boolean;
  /**
   * i18n key(s) for the section subtitle. An array is tried in order, so a
   * section-specific key can fall back to a generic one natively via `t`.
   */
  subtitleKey: string | string[];
  /** Party step-groups under this section (empty for the questions section). */
  groups: PendingStepGroup[];
  isQuestionsSection: boolean;
  /** Number of trackable items in this section. */
  total: number;
  completed: number;
};

/**
 * Count outstanding operational-details questions as INDIVIDUAL items, honoring
 * parent/child reveals. A question counts once; each sub-question its CURRENT
 * answer reveals is counted too (recursively). `completed` counts the answered
 * ones. Example: the sanctions question is 1 item; answering "Yes" reveals the
 * "which countries" child, making it 2 items (1 done, 1 left) — so the tracker
 * matches how many questions the user actually has to fill in.
 */
export function countDeltaQuestionProgress(args: {
  rootQuestionIds: string[];
  allQuestions: QuestionResponse[];
  getAnswerValues: (questionId: string) => unknown;
  isAnswered: (questionId: string) => boolean;
}): { total: number; completed: number } {
  const { rootQuestionIds, allQuestions, getAnswerValues, isAnswered } = args;
  const seen = new Set<string>();
  let total = 0;
  let completed = 0;

  const visit = (rawId: string): void => {
    const id = String(rawId);
    if (seen.has(id)) {
      return;
    }
    seen.add(id);
    total += 1;
    if (isAnswered(id)) {
      completed += 1;
    }
    const question = allQuestions.find((q) => String(q.id) === id);
    if (!question) {
      return;
    }
    const raw = getAnswerValues(id);
    const answerValues = (Array.isArray(raw) ? raw : []).map(String);
    (question.subQuestions ?? [])
      .filter((sq) => answerValues.includes(String(sq.anyValuesMatch)))
      .flatMap((sq) => (sq.questionIds ?? []).map(String))
      .forEach(visit);
  };

  rootQuestionIds.forEach((rootId) => visit(String(rootId)));
  return { total, completed };
}

/**
 * Bucket baseline pending groups into per-section summaries for the progress
 * tracker + grouped completion cards. Owners split into one summary per owner
 * so each person's outstanding fields read as their own contextual group.
 */
export function buildDeltaSectionSummaries(args: {
  baselinePendingGroups: PendingStepGroup[];
  fieldProgressByGroup: Map<string, { total: number; completed: number }>;
  sections: SectionScreenConfig[];
  questionProgress: { total: number; completed: number };
  clientData: Parameters<typeof getStepperValidation>[2];
}): DeltaSectionSummary[] {
  const {
    baselinePendingGroups,
    fieldProgressByGroup,
    sections,
    questionProgress,
    clientData,
  } = args;

  const order: string[] = [];
  const buckets = new Map<string, PendingStepGroup[]>();

  for (const group of baselinePendingGroups) {
    const [sectionId, maybeOwnerId] = group.key.split(':');
    const bucketKey =
      sectionId === 'owners-section'
        ? `owners-section:${maybeOwnerId}`
        : sectionId;
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, []);
      order.push(bucketKey);
    }
    buckets.get(bucketKey)!.push(group);
  }

  const activeOwners = getActiveOwners(clientData) ?? [];

  const summaries: DeltaSectionSummary[] = order.map((bucketKey) => {
    const groups = buckets.get(bucketKey)!;
    let total = 0;
    let completed = 0;
    for (const g of groups) {
      const p = fieldProgressByGroup.get(g.key);
      if (p) {
        total += p.total;
        completed += p.completed;
      }
    }

    if (bucketKey.startsWith('owners-section:')) {
      const ownerId = bucketKey.slice('owners-section:'.length);
      const owner = activeOwners.find((o) => o.id === ownerId);
      const ownerName = getPartyName(owner) || 'Owner';
      return {
        key: bucketKey,
        Icon: Users2Icon,
        titleKey: ownerName,
        titleIsLiteral: true,
        subtitleKey: 'reviewAndAttest.deltaCompletion.ownerSubtitle',
        groups,
        isQuestionsSection: false,
        total,
        completed,
      };
    }

    const section = sections.find((s) => s.id === bucketKey);
    return {
      key: bucketKey,
      Icon: section?.sectionConfig.icon ?? CheckCircle2Icon,
      titleKey: section?.sectionConfig.labelKey ?? bucketKey,
      subtitleKey: [
        `reviewAndAttest.deltaCompletion.sectionSubtitles.${bucketKey}`,
        'reviewAndAttest.deltaCompletion.genericSectionSubtitle',
      ],
      groups,
      isQuestionsSection: false,
      total,
      completed,
    };
  });

  if (questionProgress.total > 0) {
    summaries.push({
      key: 'additional-questions-section',
      Icon: TagIcon,
      titleKey: 'reviewAndAttest.operationalDetailsHeading',
      subtitleKey:
        'reviewAndAttest.deltaCompletion.sectionSubtitles.additional-questions-section',
      groups: [],
      isQuestionsSection: true,
      total: questionProgress.total,
      completed: questionProgress.completed,
    });
  }

  return summaries;
}

// OnboardingFormField input types that render without an `options` array. The
// delta panel builds only these directly from a field's `presentation.type`;
// options-based types (select/combobox/etc.) aren't produced by the current
// descriptors and fall back to a plain text input until one needs them.
const SIMPLE_DELTA_INPUT_TYPES = [
  'text',
  'email',
  'checkbox',
  'checkbox-basic',
  'array',
  'date',
  'textarea',
  'phone',
  'importantDate',
  'industrySelect',
] as const;
type SimpleDeltaInputType = (typeof SIMPLE_DELTA_INPUT_TYPES)[number];

/**
 * Inline editors for fields still pending on the delta-mode review screen,
 * grouped by section step (e.g. Personal → Your ID details).
 *
 * Owner steps are resolved from FlowContext (`staticScreens`) — do not import
 * `flowConfig` here (circular: flowConfig → ReviewForm → this module).
 *
 * Validation is fully native: the form's single resolver (see
 * `useDeltaPendingFieldsForm`) validates both questions and party fields on
 * blur, so each field shows its own `<FormMessage>` and this component only
 * derives the group-completion borders (pure `safeParse` at the blur /
 * question-change render cadence — never per keystroke).
 */
function DeltaPendingFieldsPanelComponent({
  sections,
  form,
  stepSchemas,
  baselinePendingGroups,
}: DeltaPendingFieldsPanelProps) {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const { clientData } = useOnboardingContext();
  const {
    currentScreenId,
    savedFormValues,
    staticScreens,
    setDeltaQuestionProgress,
  } = useFlowContext();
  // Shared field tooltips (same content as the IndustryForm step) so the delta
  // panel's `industry` and `organizationDescription` fields keep their popovers.
  const industryTooltip = useIndustryTooltip();
  const organizationDescriptionTooltip = useOrganizationDescriptionTooltip();

  // `isDirty` drives the unsaved-changes sync. `touchedFields` both (a) gates
  // the completion borders — a group only turns green once its fields are
  // blurred — and (b) re-renders the panel on blur so the borders refresh. We
  // deliberately do NOT read `isValidating`: with `reValidateMode: 'onChange'`
  // it toggles on every keystroke, which would re-render the whole panel (and
  // re-run the completion safeParse) per keystroke. Each field shows its own
  // <FormMessage> via its own Controller, so live error-clearing needs no
  // panel-wide re-render.
  const { isDirty, touchedFields } = useFormState({
    control: form.control,
  });
  useFlowUnsavedChangesSync(isDirty, 'delta-pending');

  // Re-render when any question answer changes so the questions-section
  // progress updates immediately — WITHOUT re-rendering on every party-field
  // keystroke. Party fields validate natively on blur and render their own
  // <FormMessage>, so no panel-wide recompute is needed while typing them.
  useWatch({
    control: form.control,
    compute: (values: Record<string, unknown>) =>
      Object.keys(values ?? {})
        .filter((key) => key.startsWith('question_'))
        .map((key) => JSON.stringify(values[key]))
        .join('|'),
  });

  const ownerSteps =
    staticScreens.find((s) => s.id === 'owner-stepper')?.stepperConfig?.steps ??
    [];

  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
  const existingQuestionResponses = clientData?.questionResponses ?? [];

  const { allQuestions, isLoading: isQuestionsLoading } = useQuestionTree({
    outstandingQuestionIds,
    existingQuestionResponses,
  });

  // Current values (fresh at render). The panel re-renders on blur
  // (`isValidating`) and on question changes (the `useWatch` compute above), so
  // this reflects exactly what the user has entered.
  const currentValues = form.getValues();

  // Party-field value signature (excludes `question_*`). The group-completion
  // borders depend ONLY on party values, so keying the memo on this means a
  // question answer change does NOT re-run the (pure but non-trivial) safeParse
  // over every pending party step schema — that recompute is the question-input
  // lag. Party edits still recompute it (signature changes on the next blur).
  const partyValuesSignature = Object.keys(currentValues)
    .filter((key) => !key.startsWith('question_'))
    .map((key) => `${key}=${JSON.stringify(currentValues[key])}`)
    .join('|');

  // Which pending party fields have been blurred (touched). Drives the
  // blur-gated completion borders and recomputes the memo when a field is
  // blurred — NOT while typing (touched only flips on blur).
  const partyTouchedSignature = baselinePendingGroups
    .flatMap((group) => group.fields.map((field) => field.formPath))
    .filter((path) => isDirtyTree(getValueAtPath(touchedFields, path)))
    .join('|');

  // Live overlay drives the section field-progress (orange → green + the
  // "items left" count). Pure safeParse against the pre-built schemas (no
  // hooks); memoized on the party value + touched signatures so it never
  // re-runs on question changes / keystrokes, and a field only counts complete
  // once it has been blurred.
  const fieldProgressByGroup = useMemo(
    () =>
      computeDeltaFieldProgressByGroup({
        baselinePendingGroups,
        sections,
        clientData,
        ownerSteps,
        liveOverlay: { ...savedFormValues, ...currentValues },
        currentScreenId,
        stepSchemas,
        touchedFields,
      }),
    // Keyed on the party value + touched signatures (not the fresh
    // `currentValues` / `touchedFields` objects) so question changes don't
    // invalidate it.
    [
      partyValuesSignature,
      partyTouchedSignature,
      baselinePendingGroups,
      sections,
      clientData,
      ownerSteps,
      savedFormValues,
      currentScreenId,
      stepSchemas,
    ]
  );

  const isQuestionAnswered = (questionId: string): boolean =>
    isDeltaQuestionAnswered(currentValues, questionId) &&
    // Blur-gate like the party text fields: a typed answer counts only once the
    // field is blurred (touched). Radios/selects mark themselves touched on
    // selection (setValue shouldTouch), so discrete answers still count at once.
    isDirtyTree(getValueAtPath(touchedFields, `question_${questionId}`));

  const hasOutstandingQuestions = outstandingQuestionIds.length > 0;

  // Count questions as individual items, honoring parent/child reveals: the
  // parent counts, and any sub-question its answer reveals (e.g. 30162 after
  // 30158 = "Yes") counts too — so the tracker shows the real number remaining
  // and can't read "done" while a revealed child is still blank. Uses the
  // single-question `isQuestionAnswered` (blur-gated); children are counted by
  // recursion, not by the parent's completeness.
  const questionProgress = countDeltaQuestionProgress({
    rootQuestionIds: outstandingQuestionIds.map(String),
    allQuestions,
    getAnswerValues: (id) => currentValues[`question_${id}`],
    isAnswered: isQuestionAnswered,
  });

  // Publish question progress so the sidebar timeline's operational-details
  // completion matches this panel exactly — the timeline can't resolve revealed
  // child questions without the fetched tree, so it consumes this instead.
  useEffect(() => {
    setDeltaQuestionProgress(questionProgress);
    return () => setDeltaQuestionProgress(undefined);
  }, [
    questionProgress.total,
    questionProgress.completed,
    setDeltaQuestionProgress,
  ]);

  if (baselinePendingGroups.length === 0 && !hasOutstandingQuestions) {
    return null;
  }

  const sectionSummaries = buildDeltaSectionSummaries({
    baselinePendingGroups,
    fieldProgressByGroup,
    sections,
    questionProgress,
    clientData,
  });

  const getResponseValues = (questionId: string) => {
    // Read current values (the panel re-renders on question changes via the
    // scoped useWatch compute above, so this is fresh).
    const live = currentValues?.[`question_${questionId}`] as
      | string[]
      | undefined;
    if (live) return live;
    return existingQuestionResponses.find(
      (r) =>
        normalizeQuestionId(r.questionId) === normalizeQuestionId(questionId)
    )?.values;
  };

  const isQuestionVisible = (question: QuestionResponse): boolean =>
    computeQuestionVisibility(question, allQuestions, getResponseValues);

  const renderPartyField = (field: PendingField) => {
    const control = form.control as any;
    const logicalKey = field.fieldKey;
    // Declarative presentation for this field (input type, mask, custom editor,
    // path suffix) — the source of truth is `partyFieldMap[key].presentation`,
    // so adding a new missing field means adding config, not a branch here.
    const presentation =
      partyFieldMap[logicalKey as keyof typeof partyFieldMap]?.presentation;

    // Composite custom editor (e.g. the SSN/ITIN/passport identity switcher),
    // declared via `presentation.customEditor` instead of a name check.
    if (presentation?.customEditor === 'identity') {
      const idPrefix = field.formPath.replace(/controllerIds.*$/, '');
      return <ControllerIdFields key={field.formPath} namePrefix={idPrefix} />;
    }

    // Composite address editor (country + lines + city + state + postal code),
    // reusing the same shared component as the onboarding contact steps.
    if (presentation?.customEditor === 'address') {
      const prefix = field.formPath.slice(
        0,
        field.formPath.indexOf(logicalKey)
      );
      // Owner addresses render on the `overview` screen in delta, but their
      // "Owner's personal address" legend is gated on `owner-stepper` in the
      // field config — pass that screen so the right content token resolves.
      const isOwnerField = field.formPath.startsWith('owners.');
      // Lock the address country when the step form would:
      // - organizationAddress: always locked (org has a countryOfFormation).
      // - individualAddress (controller): locked for sole props whose org has
      //   a countryOfFormation (mirrors ContactDetailsForm behaviour).
      // - individualAddress (owner): never locked (owners choose freely).
      const orgParty = clientData?.parties?.find(
        (p) => p.partyType === 'ORGANIZATION'
      );
      const orgCountry =
        orgParty?.organizationDetails?.countryOfFormation ?? '';
      const isSoleProp =
        orgParty?.organizationDetails?.organizationType ===
        'SOLE_PROPRIETORSHIP';
      let countryReadonly = false;
      if (logicalKey === 'organizationAddress') {
        countryReadonly = !!orgCountry;
      } else if (logicalKey === 'individualAddress' && !isOwnerField) {
        countryReadonly = isSoleProp && !!orgCountry;
      }
      return (
        <AddressFields
          key={field.formPath}
          addressName={logicalKey}
          namePrefix={prefix}
          contentScreenId={isOwnerField ? 'owner-stepper' : undefined}
          countryReadonly={countryReadonly}
        />
      );
    }

    // Resolve the editable control path. Some fields edit a sub-path of the
    // reported value (e.g. the phone value lives at `<field>.phoneNumber`).
    let name = field.formPath;
    if (presentation?.pathSuffix && !name.endsWith(presentation.pathSuffix)) {
      name = `${name}${presentation.pathSuffix}`;
    }

    // Owner fields live under `owners.{partyId}.*` but their config/tokens are
    // keyed by the unprefixed name. Pass `logicalName` so OnboardingFormField
    // resolves the right config, and `screenIdOverride: 'owner-stepper'` so the
    // `owner` content-token variant activates (it's gated on that screenId in
    // the fieldMap conditional rules).
    const isOwnerField = name.startsWith('owners.');
    const ownerProps = isOwnerField
      ? {
          logicalName: field.issuePath.replace(/^owners\.[^.]+\./, ''),
          screenIdOverride: 'owner-stepper' as const,
        }
      : {};

    // Options-based inputs (select / combobox): build the choices from the
    // field's declared `optionsSource` so the delta panel renders a real
    // dropdown instead of falling back to a plain text input.
    if (
      presentation?.optionsSource &&
      (presentation.type === 'select' || presentation.type === 'combobox')
    ) {
      const options =
        presentation.optionsSource === 'countries'
          ? COUNTRIES_OF_FORMATION.map((code) => ({
              value: code,
              searchValue: `[${code}] ${tString([`common:countries.${code}`], '')}`,
              label: (
                <span>
                  <span className="eb-font-medium">[{code}]</span>{' '}
                  {t([`common:countries.${code}`], '')}
                </span>
              ),
            }))
          : JOB_TITLES.map((title) => ({
              value: title,
              label: t([`jobTitles.${title}`], ''),
            }));
      const optionsField = (
        <OnboardingFormField
          key={name}
          control={control}
          name={name}
          type={presentation.type}
          options={options}
          required
          {...ownerProps}
        />
      );
      // A dependent field (e.g. job-title description when "Other") reveals
      // reactively off this field's live value, mirroring the step form.
      if (!presentation.revealsFields?.length) {
        return optionsField;
      }
      const revealPrefix = field.formPath.slice(
        0,
        field.formPath.indexOf(logicalKey)
      );
      return (
        <Fragment key={name}>
          {optionsField}
          <DeltaRevealedFields
            parentName={name}
            reveals={presentation.revealsFields}
            namePrefix={revealPrefix}
            renderField={renderPartyField}
          />
        </Fragment>
      );
    }

    // Delta renders only non-options inputs; narrow the (full-union) descriptor
    // type to that subset so the OnboardingFormField discriminated union is
    // satisfied without an `any` cast. Unsupported types fall back to text.
    const inputType: SimpleDeltaInputType =
      presentation?.type &&
      (SIMPLE_DELTA_INPUT_TYPES as readonly string[]).includes(
        presentation.type
      )
        ? (presentation.type as SimpleDeltaInputType)
        : 'text';

    // Fields with a rich, bespoke popover tooltip (not a plain content token)
    // reuse the same shared tooltip hooks as their step form.
    const customTooltip =
      logicalKey === 'industry'
        ? industryTooltip
        : logicalKey === 'organizationDescription'
          ? organizationDescriptionTooltip
          : undefined;

    return (
      <OnboardingFormField
        key={name}
        control={control}
        name={name}
        type={inputType}
        maskFormat={presentation?.maskFormat}
        maskChar={presentation?.maskChar}
        obfuscateWhenUnfocused={presentation?.obfuscateWhenUnfocused}
        inputProps={
          presentation?.maxLength
            ? { maxLength: presentation.maxLength }
            : undefined
        }
        required
        {...(customTooltip
          ? { popoutTooltip: true, tooltip: customTooltip }
          : {})}
        {...ownerProps}
      />
    );
  };

  const renderQuestionInput = (question: QuestionResponse) => {
    const fieldName = `question_${question.id ?? 'undefined'}`;
    const itemType = question?.responseSchema?.items?.type ?? 'string';
    const itemEnum = question?.responseSchema?.items?.enum;

    const questionLabel = (
      <div>
        {question.description?.split('\n')?.map((line, index) => (
          <div key={`${question.id}-label-${index}`}>
            <FormLabel
              className={cn({
                'eb-ml-4': index > 0,
              })}
            >
              {line}
            </FormLabel>
          </div>
        ))}
      </div>
    );

    if (question.id && MONEY_INPUT_QUESTION_IDS.includes(question.id)) {
      return (
        <FormField
          control={form.control}
          name={fieldName}
          render={({ field }) => (
            <FormItem>
              {questionLabel}
              <div className="eb-relative">
                <DollarSignIcon
                  aria-hidden="true"
                  className="eb-pointer-events-none eb-absolute eb-inset-y-0 eb-left-3 eb-my-auto eb-size-4 eb-text-gray-500"
                />
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={0}
                    max={10000000000}
                    step={1}
                    inputMode="decimal"
                    placeholder="0"
                    className="eb-pl-9"
                    value={(field.value as string[] | undefined)?.[0] ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const numeric = parseFloat(raw);
                      if (
                        raw === '' ||
                        (numeric >= 0 && numeric <= 10000000000)
                      ) {
                        field.onChange([raw]);
                      }
                    }}
                    onBlur={field.onBlur}
                  />
                </FormControl>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    switch (itemType) {
      case 'boolean':
        return (
          <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem className="eb-space-y-3">
                {questionLabel}
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => {
                      // Discrete choice has no blur: mark it dirty (so the
                      // delta save, which submits only dirty fields, includes
                      // this answer) and touched (so completion gating counts
                      // it now, unlike text answers which wait for blur), and
                      // validate to clear any post-submit error.
                      form.setValue(fieldName as never, [value] as never, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                    value={(field.value as string[] | undefined)?.[0] ?? ''}
                    className="eb-flex eb-flex-col eb-space-y-1"
                  >
                    <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                      <FormControl>
                        <RadioGroupItem value="true" />
                      </FormControl>
                      <FormLabel className="eb-font-normal">
                        {t('common:yes', 'Yes')}
                      </FormLabel>
                    </FormItem>
                    <FormItem className="eb-flex eb-items-center eb-space-x-3 eb-space-y-0">
                      <FormControl>
                        <RadioGroupItem value="false" />
                      </FormControl>
                      <FormLabel className="eb-font-normal">
                        {t('common:no', 'No')}
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case 'integer':
        return (
          <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                {questionLabel}
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    value={(field.value as string[] | undefined)?.[0] ?? ''}
                    onChange={(e) => field.onChange([e.target.value])}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        if (itemEnum?.length) {
          return (
            <FormField
              control={form.control}
              name={fieldName}
              render={({ field }) => (
                <FormItem>
                  {questionLabel}
                  <Select
                    onValueChange={(value) => {
                      // Discrete choice has no blur: mark it dirty (so the
                      // delta save, which submits only dirty fields, includes
                      // this answer) and touched (so completion gating counts
                      // it now, unlike text answers which wait for blur), and
                      // validate to clear any post-submit error.
                      form.setValue(fieldName as never, [value] as never, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                    value={(field.value as string[] | undefined)?.[0] ?? ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {itemEnum.map((option: string) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        }
        return (
          <FormField
            control={form.control}
            name={fieldName}
            render={({ field }) => (
              <FormItem>
                {questionLabel}
                <FormControl>
                  <Input
                    {...field}
                    value={(field.value as string[] | undefined)?.[0] ?? ''}
                    onChange={(e) => field.onChange([e.target.value])}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        );
    }
  };

  const renderSubQuestions = (
    parentId: string | undefined
  ): React.ReactNode => {
    if (!parentId) return null;
    const childQuestions = getChildQuestions(parentId, allQuestions).filter(
      isQuestionVisible
    );
    return childQuestions.map((subQuestion) => (
      <Fragment key={subQuestion.id}>
        {renderQuestionInput(subQuestion)}
        {renderSubQuestions(subQuestion.id)}
      </Fragment>
    ));
  };

  const renderQuestionsList = () =>
    allQuestions
      .filter((question) => isTopLevelQuestion(question, allQuestions))
      .filter(isQuestionVisible)
      .filter(
        (q) =>
          q.id &&
          (outstandingQuestionIds.includes(q.id) ||
            getChildQuestions(q.id, allQuestions).some((child) =>
              outstandingQuestionIds.includes(child.id ?? '')
            ))
      )
      .map((question) => (
        <Fragment key={question.id}>
          {renderQuestionInput(question)}
          {renderSubQuestions(question.id)}
        </Fragment>
      ));

  // Placeholder while the operational-details question tree is still being
  // fetched — mirrors the spacing of a couple of question inputs so the delta
  // page does not jump when the real questions arrive.
  const renderQuestionsSkeleton = () => (
    <div
      className="eb-space-y-4"
      role="status"
      aria-label={tString('common:loading', 'Loading...')}
    >
      {[0, 1].map((row) => (
        <div key={row} className="eb-space-y-2">
          <Skeleton className="eb-h-4 eb-w-2/3" />
          <Skeleton className="eb-h-10 eb-w-full" />
        </div>
      ))}
    </div>
  );

  return (
    <FormProvider {...form}>
      <div className="eb-space-y-4">
        {sectionSummaries.map((summary) => {
          const done = summary.completed >= summary.total;
          return (
            <Card
              key={summary.key}
              id={`delta-section-${summary.key}`}
              className={cn(
                'eb-scroll-mt-24 eb-overflow-hidden eb-rounded-lg eb-border',
                done ? 'eb-border-success' : 'eb-border-warning'
              )}
            >
              <div className="eb-flex eb-w-full eb-items-start eb-justify-between eb-gap-3 eb-p-4">
                <div className="eb-flex eb-items-start eb-gap-3">
                  <div
                    className={cn(
                      'eb-mt-0.5 eb-flex eb-size-8 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full',
                      done
                        ? 'eb-bg-success-accent eb-text-success'
                        : 'eb-bg-warning-accent eb-text-warning'
                    )}
                  >
                    {done ? (
                      <CheckCircle2Icon className="eb-size-4" />
                    ) : (
                      <summary.Icon className="eb-size-4" />
                    )}
                  </div>
                  <div className="eb-space-y-0.5">
                    <p className="eb-text-sm eb-font-semibold eb-tracking-tight">
                      {summary.titleIsLiteral
                        ? summary.titleKey
                        : t(summary.titleKey, '')}
                    </p>
                    {summary.subtitleKey && (
                      <p className="eb-text-xs eb-text-muted-foreground">
                        {t(summary.subtitleKey, '')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      'eb-border-transparent eb-text-xs',
                      done
                        ? 'eb-bg-success-accent eb-text-success'
                        : 'eb-bg-warning-accent eb-text-warning'
                    )}
                  >
                    {done
                      ? t('reviewAndAttest.complete', 'Complete')
                      : t('reviewAndAttest.missingDetails', 'Missing details')}
                  </Badge>
                </div>
              </div>
              <div className="eb-space-y-6 eb-px-4 eb-pb-4">
                {summary.isQuestionsSection
                  ? isQuestionsLoading
                    ? renderQuestionsSkeleton()
                    : renderQuestionsList()
                  : summary.groups.flatMap((group) =>
                      dedupeCompositeFields(group.fields).map((field) =>
                        renderPartyField(field)
                      )
                    )}
              </div>
            </Card>
          );
        })}
      </div>
    </FormProvider>
  );
}

/**
 * Memoized panel. Its own subscriptions (`useFormState` for blur validation,
 * a scoped `useWatch` for question answers) drive re-renders, so a parent
 * OverviewScreen re-render with stable props does not re-run the completion
 * borders. Party-field typing never re-renders the panel — those fields
 * validate natively on blur and show their own <FormMessage>.
 */
export const DeltaPendingFieldsPanel = memo(DeltaPendingFieldsPanelComponent);

/**
 * Build default values + a single native resolver for the delta pending-fields
 * form. Defaults are the full party form values from GET client so any missing
 * field key can be edited (not a hardcoded whitelist).
 *
 * Validation is unified: ONE resolver validates both the operational-details
 * questions and the pending party fields (tax IDs, etc.). The party step
 * schemas are hook-based, so they are pre-built once here (`stepSchemas`) and
 * the resolver runs pure `safeParse` against them — no debounce, no manual
 * `setError` mirror, no second validation pass.
 */
export function useDeltaPendingFieldsForm(sections: SectionScreenConfig[]) {
  const { clientData } = useOnboardingContext();
  const { savedFormValues, staticScreens, currentScreenId } = useFlowContext();

  const ownerSteps =
    staticScreens.find((s) => s.id === 'owner-stepper')?.stepperConfig?.steps ??
    [];

  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
  const existingQuestionResponses = clientData?.questionResponses ?? [];

  const { allQuestions, allFormQuestionIds } = useQuestionTree({
    outstandingQuestionIds,
    existingQuestionResponses,
  });

  // Pre-build the party step schemas ONCE (the only hook-based schema calls),
  // built from the UNFILTERED step set so the schema-hook count stays constant
  // across renders (see `useStableStepSchemas`). The map is keyed by step
  // object, so the resolver / completion borders can look up the filtered
  // subset and run pure safeParse outside render.
  const stepSchemas = useStableStepSchemas();

  // Baseline pending groups (from GET client). Determines which fields render;
  // does not shrink while the user types. Fed pre-built schemas so it is cheap.
  const baselinePendingGroups = collectBaselineDeltaPendingGroups({
    sections,
    clientData,
    savedFormValues,
    currentScreenId,
    ownerSteps,
    stepSchemas,
  });

  const orgParty = getOrganizationParty(clientData);
  const controllerParty = getPartyByAssociatedPartyFilters(clientData, {
    partyType: 'INDIVIDUAL',
    roles: ['CONTROLLER'],
  });
  const activeOwners = getActiveOwners(clientData) ?? [];

  const orgValues = convertPartyResponseToFormValues(orgParty ?? {});
  const controllerValues = convertPartyResponseToFormValues(
    controllerParty ?? {}
  );

  const ownersDefaults = useMemo(() => {
    // Seed fieldMap defaults for individual-type fields so owner addresses
    // (and other composites) start with their configured defaults.
    const individualFieldDefaults: Record<string, unknown> = {};
    for (const key of INDIVIDUAL_PARTY_FIELD_KEYS) {
      const config = partyFieldMap[key as keyof typeof partyFieldMap];
      if (config?.baseRule?.defaultValue !== undefined) {
        individualFieldDefaults[key] = config.baseRule.defaultValue;
      }
    }
    const owners: Record<string, Record<string, unknown>> = {};
    for (const owner of activeOwners) {
      if (owner.id && !owner.roles?.includes('CONTROLLER')) {
        const vals = convertPartyResponseToFormValues(owner) as Record<
          string,
          unknown
        >;
        owners[owner.id] = { ...individualFieldDefaults, ...vals };
      }
    }
    return owners;
  }, [activeOwners]);

  const questionDefaults = useMemo(
    () =>
      allFormQuestionIds.reduce(
        (acc, id) => {
          const existingResponse = existingQuestionResponses?.find(
            (response) => response.questionId === id
          );
          acc[`question_${id}`] = existingResponse
            ? existingResponse.values
            : [];
          return acc;
        },
        {} as Record<string, unknown>
      ),
    [allFormQuestionIds, existingQuestionResponses]
  );

  const defaultValues = useMemo(() => {
    // Seed fieldMap defaultValues for all pending fields so that fields
    // missing from the API response (e.g. an empty address) start with their
    // configured defaults (country: 'US') instead of being entirely absent.
    const fieldMapDefaults: Record<string, unknown> = {};
    for (const group of baselinePendingGroups) {
      for (const field of group.fields) {
        const config =
          partyFieldMap[field.fieldKey as keyof typeof partyFieldMap];
        if (config?.baseRule?.defaultValue !== undefined) {
          fieldMapDefaults[field.fieldKey] = config.baseRule.defaultValue;
        }
      }
    }
    return {
      ...fieldMapDefaults,
      ...orgValues,
      ...controllerValues,
      owners: ownersDefaults,
      ...questionDefaults,
      ...savedFormValues,
    };
  }, [
    orgValues,
    controllerValues,
    ownersDefaults,
    questionDefaults,
    savedFormValues,
  ]);

  // Operational-details question schema (party fields validated separately via
  // the pre-built step schemas inside the resolver below).
  const questionSchema = useMemo(() => {
    if (allQuestions.length === 0) {
      return z.object({}).passthrough();
    }
    return createDynamicZodSchema(allQuestions);
  }, [allQuestions]);

  // Data the resolver validates against, refreshed every render so the stable
  // resolver closure always sees the latest saved/live values and schemas.
  const resolverDataRef = useRef({
    questionSchema,
    sections,
    clientData,
    ownerSteps,
    savedFormValues,
    currentScreenId,
    stepSchemas,
    baselinePendingGroups,
  });
  resolverDataRef.current = {
    questionSchema,
    sections,
    clientData,
    ownerSteps,
    savedFormValues,
    currentScreenId,
    stepSchemas,
    baselinePendingGroups,
  };

  // Single native resolver for BOTH the questions and the pending party fields.
  // Because the party schemas are pre-built (stepSchemas), this runs pure
  // `safeParse` — no hooks — so RHF can own all validation natively (on blur).
  // This replaces the old debounced watch + manual setError mirror.
  const resolver = useMemo<Resolver<Record<string, unknown>>>(
    () => async (values, context, options) => {
      const d = resolverDataRef.current;
      const questionResolver = zodResolver(d.questionSchema, undefined, {
        raw: true,
      });
      const questionResult = await questionResolver(values, context, options);

      // Scope the heavier party sweep to the fields RHF actually asked to
      // validate. With `reValidateMode: 'onChange'`, RHF revalidates a single
      // field per keystroke (passing `options.names`), so only re-run the party
      // schema for the group that field belongs to. Full passes (handleSubmit /
      // trigger-all) have `names === undefined` and validate every pending
      // group. Question-only revalidations match no party group → no sweep.
      const { names } = options;
      const groupsToValidate = names
        ? d.baselinePendingGroups.filter((group) =>
            expandGroupFieldsWithReveals(group.fields, {
              ...d.savedFormValues,
              ...values,
            }).some((field) => names.includes(field.formPath))
          )
        : d.baselinePendingGroups;

      const partyErrors =
        groupsToValidate.length === 0
          ? []
          : collectDeltaPendingFieldErrors({
              baselinePendingGroups: groupsToValidate,
              sections: d.sections,
              clientData: d.clientData,
              ownerSteps: d.ownerSteps,
              liveOverlay: { ...d.savedFormValues, ...values },
              currentScreenId: d.currentScreenId,
              stepSchemas: d.stepSchemas,
            });

      if (partyErrors.length === 0) {
        return questionResult;
      }

      const flatPartyErrors: Record<string, { type: string; message: string }> =
        {};
      for (const { formPath, message } of partyErrors) {
        flatPartyErrors[formPath] = { type: 'validate', message };
      }
      const nestedPartyErrors = toNestErrors(flatPartyErrors, options);

      return {
        values: questionResult.values,
        // Question errors (`question_*`) and party errors have disjoint
        // top-level keys, so a shallow merge is safe.
        errors: { ...questionResult.errors, ...nestedPartyErrors },
      } as ResolverResult<Record<string, unknown>>;
    },
    []
  );

  const form = useForm<Record<string, unknown>>({
    defaultValues,
    resolver,
    // First validation waits for blur, so a field never shows an error while
    // the user is still typing it for the first time. Once a field HAS errored,
    // it re-validates on change so the message clears the instant the user fixes
    // it — matching the discrete question inputs (which validate on selection)
    // instead of forcing another blur. Revalidation is scoped to the changed
    // field's group (see the resolver's `options.names` handling), and the panel
    // subscribes only to `isDirty`/`touchedFields` (never `errors`/`isValidating`),
    // so onChange revalidation clears the field's own <FormMessage> without any
    // panel-wide re-render.
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [clientData?.id, outstandingQuestionIds.join(',')]);

  return { form, allQuestions, stepSchemas, baselinePendingGroups };
}

export type DeltaPendingSubmitPayload = {
  /** Org-party form values to PATCH (any keys from fieldMap / org party) */
  organizationPartyValues: Partial<OnboardingFormValuesSubmit>;
  /** Controller-party form values to PATCH */
  controllerPartyValues: Partial<OnboardingFormValuesSubmit>;
  /** Per-owner form values to PATCH */
  ownerUpdates: Array<{
    partyId: string;
    values: Partial<OnboardingFormValuesSubmit>;
  }>;
  questionResponses: Array<{ questionId: string; values: string[] }>;
};

/** All party form keys from the field map (source of truth for API mapping). */
const ALL_PARTY_FIELD_KEYS = new Set(objectKeys(partyFieldMap).map(String));

const ORG_PARTY_FIELD_KEYS = new Set(
  [...ALL_PARTY_FIELD_KEYS].filter((key) => {
    const path = partyFieldMap[key as keyof typeof partyFieldMap]?.path ?? '';
    return (
      path.startsWith('organizationDetails') ||
      key === 'organizationEmail' ||
      key === 'organizationPhone' ||
      key === 'organizationAddress'
    );
  })
);

const INDIVIDUAL_PARTY_FIELD_KEYS = new Set(
  [...ALL_PARTY_FIELD_KEYS].filter((key) => {
    const path = partyFieldMap[key as keyof typeof partyFieldMap]?.path ?? '';
    return (
      path.startsWith('individualDetails') ||
      key === 'controllerEmail' ||
      key === 'controllerPhone' ||
      key === 'solePropSsn'
    );
  })
);

/** Read a nested value by dot-path (handles array indices as string keys). */
function getValueAtPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

function isDirtyTree(dirty: unknown): boolean {
  if (dirty === true) return true;
  if (!dirty || typeof dirty !== 'object') return false;
  return Object.values(dirty as Record<string, unknown>).some(isDirtyTree);
}

/**
 * Pick party field-map keys that the user actually edited (dirty), so we
 * PATCH only deltas — not the full GET-client snapshot.
 * When `dirtyFields` is omitted, include every defined key in `keys`
 * (useful for unit tests / callers without RHF state).
 */
function pickDirtyPartyValues(
  values: Record<string, unknown>,
  dirtyFields: Record<string, unknown> | undefined,
  keys: Set<string>
): Partial<OnboardingFormValuesSubmit> {
  const out: Record<string, unknown> = {};
  const useDirtyFilter = dirtyFields !== undefined;
  for (const key of keys) {
    const value = values[key];
    const include =
      value !== undefined &&
      (!useDirtyFilter || isDirtyTree(dirtyFields?.[key]));
    if (include) {
      out[key] = value;
    }
  }
  return out as Partial<OnboardingFormValuesSubmit>;
}

function normalizeControllerIdsIssuer(
  values: Partial<OnboardingFormValuesSubmit>
): void {
  if (values.controllerIds?.length) {
    values.controllerIds = values.controllerIds.map((id) => ({
      ...id,
      issuer: id.idType === 'SSN' || id.idType === 'ITIN' ? 'US' : id.issuer,
    }));
  }
}

/**
 * Build submit payload from the delta form.
 *
 * Detection of which fields are pending is Zod-driven from GET client
 * (`getStepperValidation` on party form values). Save only includes dirty
 * partyFieldMap keys so any missing field can be edited and persisted.
 */
export function buildDeltaPendingSubmitPayload(
  values: Record<string, unknown>,
  allQuestions: QuestionResponse[],
  outstandingQuestionIds: string[],
  dirtyFields?: Record<string, unknown>
): DeltaPendingSubmitPayload {
  // Outstanding questions PLUS any conditional sub-questions they reveal (e.g.
  // 30158 "Yes" reveals 30162). Sub-questions are NOT listed in
  // `outstanding.questionIds`, but answering them is part of completing the
  // outstanding parent — so they must be saved too. Otherwise the review step
  // re-validates the parent's schema (which requires the child when the parent
  // matches) against a client that never stored the child → "field is missing".
  const savableQuestionIds = new Set(outstandingQuestionIds.map(String));
  const addSubQuestionIds = (questionId: string) => {
    const question = allQuestions.find((q) => String(q.id) === questionId);
    question?.subQuestions?.forEach((sq) =>
      sq.questionIds?.forEach((rawId) => {
        const childId = String(rawId);
        if (!savableQuestionIds.has(childId)) {
          savableQuestionIds.add(childId);
          addSubQuestionIds(childId);
        }
      })
    );
  };
  outstandingQuestionIds.forEach((id) => addSubQuestionIds(String(id)));

  const questionResponses = Object.entries(values)
    .filter(([key]) => key.startsWith('question_'))
    .filter(([key]) => savableQuestionIds.has(key.replace('question_', '')))
    .filter(([key, value]) => {
      // Dirty-only when dirtyFields is provided (same as party PATCH).
      if (dirtyFields !== undefined && !isDirtyTree(dirtyFields[key])) {
        return false;
      }
      const normalized = (Array.isArray(value) ? value : [value])
        .map(String)
        .map((v) => v.trim())
        .filter(Boolean);
      return normalized.length > 0;
    })
    .map(([key, value]) => ({
      questionId: key.replace('question_', ''),
      values: (Array.isArray(value) ? value : [value])
        .map(String)
        .map((v) => v.trim())
        .filter(Boolean),
    }));

  const ownersRaw = (values.owners ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const ownersDirty = (dirtyFields?.owners ?? {}) as Record<
    string,
    Record<string, unknown>
  >;
  const ownerUpdates = Object.entries(ownersRaw)
    // Only PATCH owners the user actually edited. An untouched owner has no
    // dirty subtree; skipping them avoids re-sending their full (untouched)
    // GET snapshot — which, for owners that already have an SSN, bundles BOTH
    // `controllerIds` and `solePropSsn` (both map to
    // `individualDetails.individualIds`) and `setValueByPath` appends the two
    // arrays into a duplicated ID list ("Maximum 1 IDs allowed").
    .filter(([partyId]) => isDirtyTree(ownersDirty[partyId]))
    .map(([partyId, ownerVals]) => ({
      partyId,
      // Pass `?? {}` (never `undefined`) so the dirty filter stays ON and only
      // the fields the user edited are included — never both ID aliases.
      values: pickDirtyPartyValues(
        ownerVals,
        ownersDirty[partyId] ?? {},
        INDIVIDUAL_PARTY_FIELD_KEYS
      ),
    }))
    .filter((update) => Object.keys(update.values).length > 0);

  const controllerPartyValues = pickDirtyPartyValues(
    values,
    dirtyFields,
    INDIVIDUAL_PARTY_FIELD_KEYS
  );
  normalizeControllerIdsIssuer(controllerPartyValues);

  for (const owner of ownerUpdates) {
    normalizeControllerIdsIssuer(owner.values);
  }

  return {
    organizationPartyValues: pickDirtyPartyValues(
      values,
      dirtyFields,
      ORG_PARTY_FIELD_KEYS
    ),
    controllerPartyValues,
    ownerUpdates,
    questionResponses,
  };
}

/**
 * Persist dirty delta pending fields before continuing to review: PATCH the
 * organization / controller / owner parties and any answered outstanding
 * questions, then invalidate the client so section status reflects the save.
 *
 * Extracted so the delta-mode Overview view can save without duplicating the
 * mutation orchestration.
 */
export function useSaveDeltaPendingFields(
  form: UseFormReturn<Record<string, unknown>>,
  allQuestions: QuestionResponse[]
) {
  const { clientData, onPostPartySettled, onPostClientSettled } =
    useOnboardingContext();
  const { setIsFormSubmitting } = useFlowContext();
  const queryClient = useQueryClient();
  const { mutateAsync: updatePartyAsync, error: partyUpdateError } =
    useUpdatePartyLegacy();
  const { mutateAsync: updateClientAsync, error: clientUpdateError } =
    useSmbdoUpdateClientLegacy();
  const [saveError, setSaveError] = useState(false);

  const save = async (): Promise<boolean> => {
    if (!clientData?.id) {
      return false;
    }

    const values = form.getValues() as Record<string, unknown>;
    const outstandingQuestionIds = clientData.outstanding?.questionIds ?? [];
    const payload = buildDeltaPendingSubmitPayload(
      values,
      allQuestions,
      outstandingQuestionIds,
      form.formState.dirtyFields as Record<string, unknown>
    );

    setIsFormSubmitting(true);
    setSaveError(false);

    try {
      const orgParty = getOrganizationParty(clientData);
      if (
        Object.keys(payload.organizationPartyValues).length > 0 &&
        orgParty?.id
      ) {
        await updatePartyAsync(
          {
            partyId: orgParty.id,
            data: generatePartyRequestBody(payload.organizationPartyValues, {}),
          },
          {
            onSettled: (data, error) => {
              onPostPartySettled?.(data, error?.response?.data);
            },
          }
        );
      }

      const controllerParty = getPartyByAssociatedPartyFilters(clientData, {
        partyType: 'INDIVIDUAL',
        roles: ['CONTROLLER'],
      });
      if (
        Object.keys(payload.controllerPartyValues).length > 0 &&
        controllerParty?.id
      ) {
        await updatePartyAsync(
          {
            partyId: controllerParty.id,
            data: generatePartyRequestBody(payload.controllerPartyValues, {}),
          },
          {
            onSettled: (data, error) => {
              onPostPartySettled?.(data, error?.response?.data);
            },
          }
        );
      }

      for (const ownerUpdate of payload.ownerUpdates) {
        if (Object.keys(ownerUpdate.values).length > 0) {
          await updatePartyAsync(
            {
              partyId: ownerUpdate.partyId,
              data: generatePartyRequestBody(ownerUpdate.values, {}),
            },
            {
              onSettled: (data, error) => {
                onPostPartySettled?.(data, error?.response?.data);
              },
            }
          );
        }
      }

      if (payload.questionResponses.length > 0) {
        await updateClientAsync(
          {
            id: clientData.id,
            data: { questionResponses: payload.questionResponses },
          },
          {
            onSettled: (data, error) => {
              onPostClientSettled?.(data, error?.response?.data);
            },
          }
        );
      }

      // Await the client refetch so the review screen is guaranteed to render
      // fully up-to-date data (no stale → fresh flicker on review). The Overview
      // masks the resulting panel collapse with a height-locked loading overlay
      // while this resolves, so awaiting here does not cause a layout shift.
      await queryClient.invalidateQueries({
        queryKey: getSmbdoGetClientQueryKey(clientData.id),
      });
      return true;
    } catch {
      setSaveError(true);
      return false;
    } finally {
      // Always clear the submitting flag. Leaving it set after a successful
      // save keeps the whole flow disabled — the sidebar freezes on stale
      // status and every subsequent form/button (e.g. editing an owner) is
      // rendered disabled via `useFormWithFilters({ disabled: isFormSubmitting })`.
      setIsFormSubmitting(false);
    }
  };

  return {
    save,
    saveError,
    resetSaveError: () => setSaveError(false),
    partyUpdateError,
    clientUpdateError,
  };
}
