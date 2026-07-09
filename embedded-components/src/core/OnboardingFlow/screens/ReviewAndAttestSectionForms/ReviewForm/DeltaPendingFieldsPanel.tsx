import { Fragment, useEffect, useMemo } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { objectKeys } from '@/utils/objectEntries';
import { zodResolver } from '@hookform/resolvers/zod';
import { DollarSignIcon } from 'lucide-react';
import {
  FormProvider,
  useForm,
  useFormState,
  useWatch,
  type UseFormReturn,
} from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@/lib/utils';
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
import { Card } from '@/components/ui';
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
import { getStepperValidation } from '@/core/OnboardingFlow/utils/flowUtils';
import { convertPartyResponseToFormValues } from '@/core/OnboardingFlow/utils/formUtils';
import {
  isQuestionVisible as computeQuestionVisibility,
  getChildQuestions,
  isTopLevelQuestion,
  normalizeQuestionId,
} from '@/core/OnboardingFlow/utils/questionTree';

type DeltaPendingFieldsPanelProps = {
  sections: SectionScreenConfig[];
  form: UseFormReturn<Record<string, unknown>>;
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
 * Party-group completeness for delta pending cards / finish gate.
 * Reuses the same getStepperValidation + remaining-path logic as the panel borders.
 */
export function computeCompletedDeltaPendingGroupKeys(args: {
  baselinePendingGroups: PendingStepGroup[];
  sections: SectionScreenConfig[];
  clientData: Parameters<typeof getStepperValidation>[2];
  ownerSteps: StepConfig[];
  liveOverlay: Record<string, unknown> | undefined;
  currentScreenId: Parameters<typeof getStepperValidation>[4];
}): Set<string> {
  const {
    baselinePendingGroups,
    sections,
    clientData,
    ownerSteps,
    liveOverlay,
    currentScreenId,
  } = args;
  const complete = new Set<string>();

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
          'owner-stepper'
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
          currentScreenId
        ));
      }
    }

    if (!stepValidationMap || !stepId) {
      // leave incomplete
    } else {
      const validation = stepValidationMap[stepId];
      if (validation?.isValid) {
        complete.add(group.key);
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
          group.fields.every((field) => !remainingPaths.has(field.formPath))
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
}): PendingStepGroup[] {
  const {
    sections,
    clientData,
    savedFormValues,
    currentScreenId,
    ownerSteps,
    tString,
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
        currentScreenId
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
        'owner-stepper'
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

/**
 * Inline editors for fields still pending on the delta-mode review screen,
 * grouped by section step (e.g. Personal → Your ID details).
 *
 * Owner steps are resolved from FlowContext (`staticScreens`) — do not import
 * `flowConfig` here (circular: flowConfig → ReviewForm → this module).
 */
export function DeltaPendingFieldsPanel({
  sections,
  form,
}: DeltaPendingFieldsPanelProps) {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const { clientData } = useOnboardingContext();
  const { currentScreenId, savedFormValues, staticScreens } = useFlowContext();
  const { isDirty } = useFormState({ control: form.control });
  useFlowUnsavedChangesSync(isDirty, 'delta-pending');

  const liveFormValues = useWatch({ control: form.control }) as
    | Record<string, unknown>
    | undefined;

  const ownerSteps =
    staticScreens.find((s) => s.id === 'owner-stepper')?.stepperConfig?.steps ??
    [];

  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
  const existingQuestionResponses = clientData?.questionResponses ?? [];

  const { allQuestions } = useQuestionTree({
    outstandingQuestionIds,
    existingQuestionResponses,
  });

  // Baseline: fields that were missing from GET client (do not shrink as user types).
  // Live overlay is used only to flip group borders orange → green.
  const baselinePendingGroups = useMemo(
    (): PendingStepGroup[] =>
      collectBaselineDeltaPendingGroups({
        sections,
        clientData,
        savedFormValues,
        currentScreenId,
        ownerSteps,
        tString,
      }),
    [
      sections,
      clientData,
      savedFormValues,
      currentScreenId,
      ownerSteps,
      tString,
    ]
  );

  const liveOverlay = useMemo(
    () => ({
      ...savedFormValues,
      ...(liveFormValues ?? {}),
    }),
    [savedFormValues, liveFormValues]
  );

  const completedGroupKeys = useMemo(
    () =>
      computeCompletedDeltaPendingGroupKeys({
        baselinePendingGroups,
        sections,
        clientData,
        ownerSteps,
        liveOverlay,
        currentScreenId,
      }),
    [
      baselinePendingGroups,
      clientData,
      ownerSteps,
      liveOverlay,
      sections,
      currentScreenId,
    ]
  );

  const isQuestionAnswered = (questionId: string): boolean =>
    isDeltaQuestionAnswered(liveFormValues, questionId);

  const hasOutstandingQuestions = outstandingQuestionIds.length > 0;
  const allQuestionsAnswered =
    !hasOutstandingQuestions ||
    outstandingQuestionIds.every((id) => isQuestionAnswered(id));

  if (baselinePendingGroups.length === 0 && !hasOutstandingQuestions) {
    return null;
  }

  const getResponseValues = (questionId: string) => {
    const live = form.watch(`question_${questionId}`) as string[] | undefined;
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

    if (logicalKey === 'controllerIds' || logicalKey === 'solePropSsn') {
      const idCopy =
        logicalKey === 'solePropSsn'
          ? ownerFieldCopy('fields.solePropSsn.label', {
              label: 'SSN',
              description: '',
              placeholder: 'Enter SSN',
            })
          : ownerFieldCopy('fields.controllerIds.value.label', {
              label: 'ID value',
              description: '',
              placeholder: 'Enter ID value',
            });
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
          {...idCopy}
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
                    onValueChange={(value) => field.onChange([value])}
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
                    onValueChange={(value) => field.onChange([value])}
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

  return (
    <FormProvider {...form}>
      <div className="eb-space-y-3">
        {baselinePendingGroups.map((group) => {
          const complete = completedGroupKeys.has(group.key);
          return (
            <Card
              key={group.key}
              className={cn(
                'eb-space-y-3 eb-rounded-lg eb-border eb-p-3',
                complete ? 'eb-border-success' : 'eb-border-warning'
              )}
            >
              <p className="eb-text-sm eb-font-semibold eb-tracking-tight">
                {group.label}
              </p>
              {group.fields.map((field) => renderPartyField(field))}
            </Card>
          );
        })}

        {hasOutstandingQuestions && (
          <Card
            className={cn(
              'eb-space-y-3 eb-rounded-lg eb-border eb-p-3',
              allQuestionsAnswered ? 'eb-border-success' : 'eb-border-warning'
            )}
          >
            <p className="eb-text-sm eb-font-semibold eb-tracking-tight">
              {t(
                'screens.additionalQuestionsSection.label',
                'Operational details'
              )}
            </p>
            {allQuestions
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
              ))}
          </Card>
        )}
      </div>
    </FormProvider>
  );
}

/**
 * Build default values + zod schema for the delta pending-fields form.
 * Defaults are the full party form values from GET client so any missing
 * field key can be edited (not a hardcoded whitelist).
 */
export function useDeltaPendingFieldsForm(_sections: SectionScreenConfig[]) {
  const { clientData } = useOnboardingContext();
  const { savedFormValues } = useFlowContext();

  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
  const existingQuestionResponses = clientData?.questionResponses ?? [];

  const { allQuestions, allFormQuestionIds } = useQuestionTree({
    outstandingQuestionIds,
    existingQuestionResponses,
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
        owners[owner.id] = convertPartyResponseToFormValues(owner) as Record<
          string,
          unknown
        >;
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

  // Question validation only. Party fields are already validated by step
  // schemas in getStepperValidation; keep them in form state via `raw: true`
  // so ZodEffects from createDynamicZodSchema does not strip them on submit.
  const schema = useMemo(() => {
    if (allQuestions.length === 0) {
      return z.object({}).passthrough();
    }
    return createDynamicZodSchema(allQuestions);
  }, [allQuestions]);

  const form = useForm<Record<string, unknown>>({
    defaultValues,
    resolver: zodResolver(schema, undefined, { raw: true }),
    mode: 'onBlur',
  });

  useEffect(() => {
    form.reset(defaultValues);
  }, [clientData?.id, outstandingQuestionIds.join(',')]);

  return { form, allQuestions };
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
  _allQuestions: QuestionResponse[],
  outstandingQuestionIds: string[],
  dirtyFields?: Record<string, unknown>
): DeltaPendingSubmitPayload {
  const questionResponses = Object.entries(values)
    .filter(([key]) => key.startsWith('question_'))
    .filter(([key]) => {
      const questionId = key.replace('question_', '');
      // Spec §5.6: only answered outstanding questions (not the full tree).
      return outstandingQuestionIds.includes(questionId);
    })
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
    .map(([partyId, ownerVals]) => ({
      partyId,
      values: pickDirtyPartyValues(
        ownerVals,
        ownersDirty[partyId],
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
