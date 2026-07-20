import { Fragment, memo, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { objectKeys } from '@/utils/objectEntries';
import { toNestErrors } from '@hookform/resolvers';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  DollarSignIcon,
  TagIcon,
  Users2Icon,
  type LucideIcon,
} from 'lucide-react';
import {
  FormProvider,
  useForm,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge, Button, Card } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingFlow/components';
import { partyFieldMap } from '@/core/OnboardingFlow/config/fieldMap';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useFlowUnsavedChangesSync } from '@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync';
import {
  createDynamicZodSchema,
  MONEY_INPUT_QUESTION_IDS,
} from '@/core/OnboardingFlow/screens/OperationalDetailsForm/OperationalDetailsForm.schema';
import { useQuestionTree } from '@/core/OnboardingFlow/screens/OperationalDetailsForm/useQuestionTree';
import type {
  ScreenId,
  SectionScreenConfig,
  StepConfig,
} from '@/core/OnboardingFlow/types/flow.types';
import type { OnboardingFormValuesSubmit } from '@/core/OnboardingFlow/types/form.types';
import {
  getActiveOwners,
  getClientContext,
  getOrganizationParty,
  getPartyByAssociatedPartyFilters,
  getPartyName,
} from '@/core/OnboardingFlow/utils/dataUtils';
import { scrollToDeltaSection } from '@/core/OnboardingFlow/utils/deltaMode';
import {
  getStepperValidation,
  type StepSchemaMap,
} from '@/core/OnboardingFlow/utils/flowUtils';
import {
  convertPartyResponseToFormValues,
  generatePartyRequestBody,
  modifySchemaByClientContext,
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
  /** Compact single-line group label (section · step, or owners · name · step) */
  label: string;
  /** Step-only title (e.g. "Your ID details"), used as a sub-header within a section card. */
  stepLabel: string;
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
 * Build the FULLY MODIFIED party step schemas once, keyed by the step object.
 * Both the schema factory (`step.Component.schema()`) and the `refineSchemaFn`
 * applied by `modifySchemaByClientContext` are hook-based (they call
 * `useGetValidationMessage`), so this MUST be called at the top level of render
 * — never in a loop over runtime-variable data. It is safe here because the
 * config arrays (`sections`, `ownerSteps`) are stable, so the number of hook
 * calls is constant across renders (unlike calling it per-owner, which varies).
 *
 * The stored schema already has `modifySchemaByClientContext` applied for the
 * relevant screen (section steps use `sectionScreenId`; owner steps use
 * `'owner-stepper'`), so the form resolver and completion borders can run pure
 * `safeParse` outside render without re-invoking any hooks.
 */
function buildDeltaStepSchemas(
  sections: SectionScreenConfig[],
  ownerSteps: StepConfig[],
  clientData: Parameters<typeof getStepperValidation>[2],
  sectionScreenId: ScreenId
): StepSchemaMap {
  const map: StepSchemaMap = new Map();
  const clientContext = getClientContext(clientData);
  const addSteps = (steps: StepConfig[], screenId: ScreenId) => {
    for (const step of steps) {
      if (step.stepType === 'form' && !map.has(step)) {
        const rawSchema =
          typeof step.Component.schema === 'function'
            ? step.Component.schema()
            : step.Component.schema;
        map.set(
          step,
          modifySchemaByClientContext(
            rawSchema,
            clientContext,
            screenId,
            step.Component.refineSchemaFn
          )
        );
      }
    }
  };
  for (const section of sections) {
    if (section.type === 'stepper' && section.stepperConfig) {
      addSteps(section.stepperConfig.steps, sectionScreenId);
    }
  }
  addSteps(ownerSteps, 'owner-stepper');
  return map;
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

  // A group only counts as complete once every one of its fields has been
  // blurred (when touched-gating is requested), matching the onBlur validation.
  const isGroupBlurred = (group: PendingStepGroup): boolean =>
    touchedFields === undefined ||
    group.fields.every((field) =>
      isDirtyTree(getValueAtPath(touchedFields, field.formPath))
    );

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

    if (!stepValidationMap || !stepId) {
      // leave incomplete
    } else {
      const validation = stepValidationMap[stepId];
      if (validation?.isValid) {
        if (isGroupBlurred(group)) {
          complete.add(group.key);
        }
      } else if (validation) {
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

        if (
          group.fields.every((field) => !remainingPaths.has(field.formPath)) &&
          isGroupBlurred(group)
        ) {
          complete.add(group.key);
        }
      }
    }
  }

  return complete;
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
          const belongsToGroup = group.fields.some(
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
 * Labels are optional — pass `tString` for UI; omit for submit-gate checks.
 */
export function collectBaselineDeltaPendingGroups(args: {
  sections: SectionScreenConfig[];
  clientData: Parameters<typeof getStepperValidation>[2];
  savedFormValues: Parameters<typeof getStepperValidation>[3];
  currentScreenId: Parameters<typeof getStepperValidation>[4];
  ownerSteps: StepConfig[];
  tString?: (...args: any[]) => string;
  stepSchemas?: StepSchemaMap;
}): PendingStepGroup[] {
  const {
    sections,
    clientData,
    savedFormValues,
    currentScreenId,
    ownerSteps,
    tString,
    stepSchemas,
  } = args;
  const groups: PendingStepGroup[] = [];
  const baselineOverlay = savedFormValues;
  const translate = tString ?? ((key: any) => String(key));

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
          const sectionLabel = section.sectionConfig.shortLabelKey
            ? translate(section.sectionConfig.shortLabelKey as any)
            : '';
          const stepTitle = translate(step.titleKey as any);
          groups.push({
            key: `${section.id}:${step.id}`,
            label: sectionLabel ? `${sectionLabel} · ${stepTitle}` : stepTitle,
            stepLabel: stepTitle,
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
          const ownerName = getPartyName(owner) || 'Owner';
          const stepTitle = translate(step.titleKey as any);
          groups.push({
            key: `owners-section:${owner.id}:${step.id}`,
            label: `${ownerName} · ${stepTitle}`,
            stepLabel: stepTitle,
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
  /** Full, human section title (owner name for owner groups). */
  title: string;
  /** Short contextual line describing what the section needs. */
  subtitle?: string;
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
  completedGroupKeys: Set<string>;
  sections: SectionScreenConfig[];
  /**
   * Outstanding operational-details questions counted as INDIVIDUAL items
   * (parent + each revealed child). `{ total: 0 }` omits the questions section.
   */
  questionProgress: { total: number; completed: number };
  clientData: Parameters<typeof getStepperValidation>[2];
  tString: (...args: any[]) => string;
}): DeltaSectionSummary[] {
  const {
    baselinePendingGroups,
    completedGroupKeys,
    sections,
    questionProgress,
    clientData,
    tString,
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
    const completed = groups.filter((g) =>
      completedGroupKeys.has(g.key)
    ).length;

    if (bucketKey.startsWith('owners-section:')) {
      const ownerId = bucketKey.slice('owners-section:'.length);
      const owner = activeOwners.find((o) => o.id === ownerId);
      const ownerName = getPartyName(owner) || 'Owner';
      return {
        key: bucketKey,
        Icon: Users2Icon,
        title: ownerName,
        subtitle: tString(
          'reviewAndAttest.deltaCompletion.ownerSubtitle',
          'Beneficial owner details'
        ),
        groups,
        isQuestionsSection: false,
        total: groups.length,
        completed,
      };
    }

    const section = sections.find((s) => s.id === bucketKey);
    return {
      key: bucketKey,
      Icon: section?.sectionConfig.icon ?? CheckCircle2Icon,
      title: section?.sectionConfig.labelKey
        ? tString(section.sectionConfig.labelKey)
        : bucketKey,
      subtitle: tString(
        `reviewAndAttest.deltaCompletion.sectionSubtitles.${bucketKey}`,
        tString(
          'reviewAndAttest.deltaCompletion.genericSectionSubtitle',
          'Complete the required details'
        )
      ),
      groups,
      isQuestionsSection: false,
      total: groups.length,
      completed,
    };
  });

  if (questionProgress.total > 0) {
    summaries.push({
      key: 'additional-questions-section',
      Icon: TagIcon,
      title: tString(
        'reviewAndAttest.operationalDetailsHeading',
        'Operational details'
      ),
      subtitle: tString(
        'reviewAndAttest.deltaCompletion.sectionSubtitles.additional-questions-section',
        'A few questions about how your business operates'
      ),
      groups: [],
      isQuestionsSection: true,
      total: questionProgress.total,
      completed: questionProgress.completed,
    });
  }

  return summaries;
}

/**
 * Live progress header for the delta completion step: a bar, a remaining
 * count, and per-section chips that scroll to their card. Keeps the small set
 * of outstanding items oriented to the sections they belong to.
 */
export function DeltaProgressTracker({
  summaries,
  totalItems,
  completedItems,
}: {
  summaries: DeltaSectionSummary[];
  totalItems: number;
  completedItems: number;
}) {
  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);
  const remaining = Math.max(totalItems - completedItems, 0);
  const pct =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const allDone = remaining === 0;

  return (
    <Card className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4">
      <div className="eb-flex eb-items-center eb-justify-between eb-gap-3">
        <div className="eb-space-y-0.5">
          <p className="eb-text-sm eb-font-semibold eb-tracking-tight">
            {allDone
              ? t(
                  'reviewAndAttest.deltaCompletion.allComplete',
                  "You're all set"
                )
              : t('reviewAndAttest.deltaCompletion.itemsRemaining', {
                  count: remaining,
                  defaultValue_one: '{{count}} item left to complete',
                  defaultValue_other: '{{count}} items left to complete',
                })}
          </p>
          <p className="eb-text-xs eb-text-muted-foreground">
            {t('reviewAndAttest.deltaCompletion.progressCount', {
              completed: completedItems,
              total: totalItems,
              defaultValue: '{{completed}} of {{total}} complete',
            })}
          </p>
        </div>
        {allDone && (
          <CheckCircle2Icon className="eb-size-5 eb-shrink-0 eb-text-success" />
        )}
      </div>
      <div
        className="eb-h-2 eb-w-full eb-overflow-hidden eb-rounded-full eb-bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div
          className={cn(
            'eb-h-full eb-rounded-full eb-transition-all eb-duration-300',
            allDone ? 'eb-bg-success' : 'eb-bg-primary'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {summaries.length > 1 && (
        <div className="eb-flex eb-flex-wrap eb-gap-2">
          {summaries.map((summary) => {
            const done = summary.completed >= summary.total;
            return (
              <button
                key={summary.key}
                type="button"
                onClick={() => {
                  scrollToDeltaSection(summary.key);
                }}
                className={cn(
                  'eb-inline-flex eb-items-center eb-gap-1.5 eb-rounded-full eb-border eb-px-2.5 eb-py-1 eb-text-xs eb-font-medium eb-transition-colors',
                  done
                    ? 'eb-border-success eb-bg-success-accent eb-text-success'
                    : 'eb-border-warning eb-bg-warning-accent eb-text-warning'
                )}
              >
                <summary.Icon className="eb-size-3.5 eb-shrink-0" />
                <span className="eb-max-w-[10rem] eb-truncate">
                  {summary.title}
                </span>
                {done ? (
                  <CheckCircle2Icon className="eb-size-3.5 eb-shrink-0" />
                ) : (
                  <span className="eb-inline-flex eb-min-w-4 eb-items-center eb-justify-center eb-rounded-full eb-bg-warning eb-px-1 eb-text-[0.65rem] eb-font-semibold eb-text-white">
                    {summary.total - summary.completed}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}

const US_ID_TYPES = ['SSN', 'ITIN'] as const;
const NON_US_ID_TYPES = [
  'PASSPORT',
  'DRIVERS_LICENSE',
  'OTHER_GOVERNMENT_ID',
] as const;

/**
 * Identity-document editor for a pending individual tax ID, mirroring the
 * onboarding IndividualIdentityForm: the value field is labelled by the chosen
 * ID type (e.g. "Social security number (SSN)"), masked for SSN/ITIN, and US
 * clients can switch between SSN and ITIN. `namePrefix` is '' for the
 * controller or `owners.{partyId}.` for a beneficial owner.
 */
function DeltaIdField({
  form,
  namePrefix,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  namePrefix: string;
}) {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const control = form.control as any;
  const idTypeName = `${namePrefix}controllerIds.0.idType`;
  const issuerName = `${namePrefix}controllerIds.0.issuer`;
  const valueName = `${namePrefix}controllerIds.0.value`;

  // useWatch (local subscription) rather than form.watch() so changing the ID
  // type/issuer re-renders only this field editor — not the useForm host
  // (OverviewScreen), which would re-run the expensive delta validation.
  const issuer =
    (useWatch({
      control: form.control,
      name: issuerName as never,
    }) as unknown as string | undefined) ?? 'US';
  const isUS = issuer === 'US';
  const watchedIdType = useWatch({
    control: form.control,
    name: idTypeName as never,
  }) as unknown as string | undefined;
  const currentIdType = watchedIdType || (isUS ? 'SSN' : '');
  const isSsnOrItin = currentIdType === 'SSN' || currentIdType === 'ITIN';
  const availableIdTypes = isUS ? US_ID_TYPES : NON_US_ID_TYPES;

  const valueLabel = currentIdType
    ? tString(`idValueLabels.${currentIdType}` as any)
    : tString('idValueLabels.placeholder' as any, 'ID number');

  return (
    <div className="eb-space-y-3">
      {!isUS && (
        <OnboardingFormField
          control={control}
          name={idTypeName}
          type="select"
          required
          disableFieldRuleMapping
          label={tString('fields.controllerIds.idType.label' as any, 'ID type')}
          description=""
          tooltip=""
          options={NON_US_ID_TYPES.map((idType) => ({
            value: idType,
            label: tString(`idValueLabels.${idType}` as any),
          }))}
        />
      )}
      {(isUS || currentIdType) && (
        <OnboardingFormField
          key={currentIdType}
          control={control}
          name={valueName}
          type="text"
          required
          disableFieldRuleMapping
          maskFormat={isSsnOrItin ? '### - ## - ####' : undefined}
          maskChar={isSsnOrItin ? '_' : undefined}
          obfuscateWhenUnfocused={isSsnOrItin}
          label={valueLabel}
          description={
            currentIdType
              ? tString(`idValueDescriptions.${currentIdType}` as any, '')
              : ''
          }
          tooltip=""
        />
      )}
      {isUS && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" type="button" size="sm">
              {t(
                'screens.overview.deltaView.differentIdType',
                'Use a different ID type'
              )}
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="eb-component">
            {availableIdTypes.map((idType) => (
              <DropdownMenuItem
                key={idType}
                disabled={currentIdType === idType}
                onClick={() => {
                  form.setValue(idTypeName as any, idType);
                  form.setValue(issuerName as any, 'US');
                  form.setValue(valueName as any, '', { shouldDirty: true });
                }}
              >
                {tString(`idValueLabels.${idType}` as any)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

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
  const { currentScreenId, savedFormValues, staticScreens } = useFlowContext();

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

  // Live overlay drives ONLY the group-completion borders (orange → green).
  // Pure safeParse against the pre-built schemas (no hooks); memoized on the
  // party value + touched signatures so it never re-runs on question changes /
  // keystrokes, and only turns a group green once its fields have been blurred.
  const completedGroupKeys = useMemo(
    () =>
      computeCompletedDeltaPendingGroupKeys({
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

  if (baselinePendingGroups.length === 0 && !hasOutstandingQuestions) {
    return null;
  }

  const sectionSummaries = buildDeltaSectionSummaries({
    baselinePendingGroups,
    completedGroupKeys,
    sections,
    questionProgress,
    clientData,
    tString,
  });
  const totalItems = sectionSummaries.reduce((sum, s) => sum + s.total, 0);
  const completedItems = sectionSummaries.reduce(
    (sum, s) => sum + s.completed,
    0
  );

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
    let name = field.formPath;

    // Normalize controllerIds to the value leaf when the issue was on the array root
    if (logicalKey === 'controllerIds' && !name.endsWith('.value')) {
      name = name.endsWith('controllerIds')
        ? `${name}.0.value`
        : `${name}.value`;
    }

    // Nested `owners.{partyId}.*` paths are not in partyFieldMap. Also strip
    // the owners prefix from content-token lookups by supplying explicit
    // label/description/tooltip — otherwise OnboardingFormField looks up
    // `fields.owners.controllerIds.value.*` and shows NO CONTENT TOKEN FOUND.
    const disableFieldRuleMapping = name.startsWith('owners.');

    const ownerFieldCopy = (
      i18nKey: string,
      fallback: { label: string; description?: string; placeholder?: string }
    ) =>
      disableFieldRuleMapping
        ? {
            label: tString(i18nKey as any, fallback.label),
            // Empty string suppresses getContentToken('description'/'tooltip')
            description: fallback.description ?? '',
            tooltip: '',
            placeholder: fallback.placeholder
              ? tString(
                  `${i18nKey.replace(/\.label$/, '.placeholder')}` as any,
                  fallback.placeholder
                )
              : undefined,
          }
        : {};

    if (logicalKey === 'organizationIdEin') {
      return (
        <OnboardingFormField
          key={name}
          control={control}
          name={name}
          type="text"
          maskFormat="## - #######"
          maskChar="_"
          required
          obfuscateWhenUnfocused
          disableFieldRuleMapping={disableFieldRuleMapping}
          {...ownerFieldCopy('fields.organizationIdEin.label', {
            label: 'EIN',
            placeholder: 'Enter EIN',
          })}
        />
      );
    }

    if (logicalKey === 'controllerIds') {
      const idPrefix = name.replace(/controllerIds.*$/, '');
      return <DeltaIdField key={name} form={form} namePrefix={idPrefix} />;
    }

    if (logicalKey === 'solePropSsn') {
      return (
        <OnboardingFormField
          key={name}
          control={control}
          name={name}
          type="text"
          maskFormat="### - ## - ####"
          maskChar="_"
          obfuscateWhenUnfocused
          required
          disableFieldRuleMapping={disableFieldRuleMapping}
          {...ownerFieldCopy('fields.solePropSsn.label', {
            label: 'SSN',
            description: '',
            placeholder: 'Enter SSN',
          })}
        />
      );
    }

    if (logicalKey === 'birthDate') {
      return (
        <OnboardingFormField
          key={name}
          control={control}
          name={name}
          type="importantDate"
          required
          disableFieldRuleMapping={disableFieldRuleMapping}
          {...ownerFieldCopy('fields.birthDate.label', {
            label: 'Date of birth',
          })}
        />
      );
    }

    if (
      logicalKey === 'controllerEmail' ||
      logicalKey === 'organizationEmail'
    ) {
      return (
        <OnboardingFormField
          key={name}
          control={control}
          name={name}
          type="email"
          required
          disableFieldRuleMapping={disableFieldRuleMapping}
          {...ownerFieldCopy(`fields.${logicalKey}.label`, {
            label: 'Email',
            placeholder: 'Enter email',
          })}
        />
      );
    }

    if (
      logicalKey === 'controllerPhone' ||
      logicalKey === 'organizationPhone'
    ) {
      const phoneName = name.endsWith('.phoneNumber')
        ? name
        : `${name}.phoneNumber`;
      return (
        <OnboardingFormField
          key={phoneName}
          control={control}
          name={phoneName}
          type="phone"
          required
          disableFieldRuleMapping={disableFieldRuleMapping}
          {...ownerFieldCopy(`fields.${logicalKey}.label`, {
            label: 'Phone',
          })}
        />
      );
    }

    // Any other field missing from GET client / Zod — generic text input.
    // Complex composites (full address blocks, industry combobox) still surface
    // here as leaf paths when Zod reports them (e.g. individualAddress.city).
    const leaf = field.issuePath.split('.').pop() ?? logicalKey;
    return (
      <OnboardingFormField
        key={name}
        control={control}
        name={name}
        type="text"
        required
        disableFieldRuleMapping={disableFieldRuleMapping}
        {...(disableFieldRuleMapping
          ? {
              label: tString(
                [
                  `fields.${logicalKey}.${leaf}.label`,
                  `fields.${logicalKey}.label`,
                  `fields.${field.issuePath.replace(/^owners\.[^.]+\./, '')}.label`,
                  `addressFields.${leaf}.label.default`,
                ] as any,
                leaf
              ),
              description: '',
              tooltip: '',
            }
          : {})}
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
              asterisk={index === 0}
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
        <DeltaProgressTracker
          summaries={sectionSummaries}
          totalItems={totalItems}
          completedItems={completedItems}
        />
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
                      {summary.title}
                    </p>
                    {summary.subtitle && (
                      <p className="eb-text-xs eb-text-muted-foreground">
                        {summary.subtitle}
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
              <div className="eb-space-y-4 eb-px-4 eb-pb-4">
                {summary.isQuestionsSection
                  ? isQuestionsLoading
                    ? renderQuestionsSkeleton()
                    : renderQuestionsList()
                  : summary.groups.map((group) => (
                      <div key={group.key} className="eb-space-y-3">
                        {summary.groups.length > 1 && (
                          <p className="eb-text-xs eb-font-medium eb-uppercase eb-tracking-wide eb-text-muted-foreground">
                            {group.stepLabel}
                          </p>
                        )}
                        {group.fields.map((field) => renderPartyField(field))}
                      </div>
                    ))}
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
  const { tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);

  const ownerSteps =
    staticScreens.find((s) => s.id === 'owner-stepper')?.stepperConfig?.steps ??
    [];

  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
  const existingQuestionResponses = clientData?.questionResponses ?? [];

  const { allQuestions, allFormQuestionIds } = useQuestionTree({
    outstandingQuestionIds,
    existingQuestionResponses,
  });

  // Pre-build the party step schemas ONCE (the only hook-based schema calls).
  // Fixed call count (config arrays are stable) so hook order is preserved.
  // Fully modified (base factory + modifySchemaByClientContext + refineSchemaFn)
  // so the resolver / completion borders run pure safeParse outside render.
  const stepSchemas = buildDeltaStepSchemas(
    sections,
    ownerSteps,
    clientData,
    currentScreenId
  );

  // Baseline pending groups (from GET client). Determines which fields render;
  // does not shrink while the user types. Fed pre-built schemas so it is cheap.
  const baselinePendingGroups = collectBaselineDeltaPendingGroups({
    sections,
    clientData,
    savedFormValues,
    currentScreenId,
    ownerSteps,
    tString,
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
    const owners: Record<string, Record<string, unknown>> = {};
    for (const owner of activeOwners) {
      if (owner.id && !owner.roles?.includes('CONTROLLER')) {
        const vals = convertPartyResponseToFormValues(owner) as Record<
          string,
          unknown
        >;
        // Ensure an editable ID entry exists so a missing owner tax ID can be
        // typed (and its ID type chosen) in the delta completion view.
        if (
          !Array.isArray(vals.controllerIds) ||
          vals.controllerIds.length === 0
        ) {
          vals.controllerIds = [{ idType: 'SSN', issuer: 'US', value: '' }];
        }
        owners[owner.id] = vals;
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

  const defaultValues = useMemo(
    () => ({
      // Full org + controller form values from GET client (any field may be pending)
      ...orgValues,
      ...controllerValues,
      // Ensure ID array shape exists for empty tax IDs
      controllerIds: controllerValues.controllerIds ?? [
        { idType: 'SSN', issuer: 'US', value: '' },
      ],
      owners: ownersDefaults,
      ...questionDefaults,
      ...savedFormValues,
    }),
    [
      orgValues,
      controllerValues,
      ownersDefaults,
      questionDefaults,
      savedFormValues,
    ]
  );

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
            group.fields.some((field) => names.includes(field.formPath))
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
    // Text/number inputs validate on blur — first error AND re-validation both
    // on blur — so holding a key never re-runs the resolver (no input lag).
    // Discrete-choice inputs (question radios/selects) have no meaningful blur,
    // so they call `form.trigger(name)` in their onChange to clear a post-submit
    // "required" error the instant an answer is picked (see renderQuestionInput).
    // Best of both: onChange feedback where it's needed, onBlur everywhere else.
    mode: 'onBlur',
    reValidateMode: 'onBlur',
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
