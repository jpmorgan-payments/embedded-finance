import { useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { CheckIcon, PencilIcon, TriangleAlertIcon } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';

import { cn } from '@/lib/utils';
import type { PartyResponse } from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui';
import { partyFieldMap } from '@/core/OnboardingFlow/config/fieldMap';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import type {
  ScreenId,
  StepConfig,
} from '@/core/OnboardingFlow/types/flow.types';
import type { OnboardingFormValuesInitial } from '@/core/OnboardingFlow/types/form.types';
import {
  asPlainString,
  getOrganizationParty,
} from '@/core/OnboardingFlow/utils/dataUtils';
import {
  getStepperValidation,
  resolvePartyFormOverlay,
} from '@/core/OnboardingFlow/utils/flowUtils';
import {
  convertPartyResponseToFormValues,
  useFormUtilsWithClientContext,
} from '@/core/OnboardingFlow/utils/formUtils';

import type { DeltaPendingField } from './deltaPendingTypes';
import { renderDeltaPartyField } from './inlineDeltaFieldRenderers';

type InlineCompactStepCardProps = {
  steps: StepConfig[];
  partyData: PartyResponse | undefined;
  form: UseFormReturn<Record<string, unknown>>;
  formValuesOverride?: Record<string, unknown>;
  pendingByFormPath: Map<string, DeltaPendingField>;
  completedGroupKeys: Set<string>;
  sectionId: string;
  /** Nested RHF path prefix for owner parties (`owners.{partyId}`). */
  formPathPrefix?: string;
  /** Override FlowContext screen id for owner-stepper validation. */
  validationScreenId?: ScreenId;
};

function toDisplayString(value: unknown, fallback = ''): string {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  return fallback;
}

/**
 * Compact per-step block for inline delta.
 * Missing fields always show inputs; provided fields stay read-only until
 * block-level Change. Change / Done is block-level (not per field).
 */
export function InlineCompactStepCard({
  steps,
  partyData,
  form,
  formValuesOverride,
  pendingByFormPath,
  completedGroupKeys,
  sectionId,
  formPathPrefix,
  validationScreenId,
}: InlineCompactStepCardProps) {
  const { tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const { clientData } = useOnboardingContext();
  const { currentScreenId, savedFormValues } = useFlowContext();
  const screenId = validationScreenId ?? currentScreenId;

  const effectiveSavedFormValues = {
    ...savedFormValues,
    ...formValuesOverride,
  } as Partial<OnboardingFormValuesInitial> & Record<string, unknown>;

  const orgParty = getOrganizationParty(clientData);
  const visibleSteps = steps.filter(
    (step) =>
      step.stepType !== 'check-answers' &&
      (step.isVisible?.({ orgParty }) ?? true)
  );

  const partyOverlay = resolvePartyFormOverlay(
    partyData,
    effectiveSavedFormValues
  );
  const formValues = {
    ...convertPartyResponseToFormValues(partyData ?? {}),
    ...partyOverlay,
  };
  const { stepValidationMap } = getStepperValidation(
    steps,
    partyData,
    clientData,
    effectiveSavedFormValues,
    screenId
  );

  const { modifySchema, getFieldRule } = useFormUtilsWithClientContext(
    clientData,
    screenId
  );

  return (
    <div className="eb-space-y-3">
      {visibleSteps
        .filter((step) => step.stepType === 'form')
        .map((step) => (
          <StepBlock
            key={step.id}
            step={step}
            sectionId={sectionId}
            form={form}
            formValues={formValues}
            stepValidationMap={stepValidationMap}
            pendingByFormPath={pendingByFormPath}
            completedGroupKeys={completedGroupKeys}
            modifySchema={modifySchema}
            getFieldRule={getFieldRule}
            formPathPrefix={formPathPrefix}
            tString={tString}
          />
        ))}
    </div>
  );
}

function StepBlock({
  step,
  sectionId,
  form,
  formValues,
  stepValidationMap,
  pendingByFormPath,
  completedGroupKeys,
  modifySchema,
  getFieldRule,
  formPathPrefix,
  tString,
}: {
  step: StepConfig & { stepType: 'form'; Component: any };
  sectionId: string;
  form: UseFormReturn<Record<string, unknown>>;
  formValues: Partial<OnboardingFormValuesInitial>;
  stepValidationMap: Record<string, { isValid: boolean; result?: any }>;
  pendingByFormPath: Map<string, DeltaPendingField>;
  completedGroupKeys: Set<string>;
  modifySchema: ReturnType<
    typeof useFormUtilsWithClientContext
  >['modifySchema'];
  getFieldRule: ReturnType<
    typeof useFormUtilsWithClientContext
  >['getFieldRule'];
  formPathPrefix?: string;
  tString: (...args: any[]) => string;
}) {
  const groupKey = `${sectionId}:${step.id}`;
  const stepComplete =
    completedGroupKeys.has(groupKey) || stepValidationMap[step.id]?.isValid;

  // Change only toggles editing of *provided* fields. Missing stay editable.
  const [isEditingProvided, setIsEditingProvided] = useState(false);

  const modifiedSchema = modifySchema(
    typeof step.Component.schema === 'function'
      ? step.Component.schema()
      : step.Component.schema
  );
  const schemaKeys = Object.keys(
    'shape' in modifiedSchema
      ? modifiedSchema.shape
      : 'innerType' in modifiedSchema
        ? modifiedSchema.innerType().shape
        : {}
  );

  const visibleKeys = schemaKeys.filter((key) => {
    const field = key as keyof OnboardingFormValuesInitial;
    const value = formValues?.[field];
    const fc = partyFieldMap?.[field] as {
      isHiddenInReviewFn?: (val: any, values: any) => boolean;
    } & Record<string, any>;
    return !fc?.isHiddenInReviewFn?.(value, formValues);
  });
  if (schemaKeys.length > 0 && visibleKeys.length === 0) {
    return null;
  }

  const remainingIssueRoots = new Set(
    (
      (stepValidationMap[step.id]?.result?.error?.issues ?? []) as {
        path?: (string | number)[];
      }[]
    )
      .map((issue) => (issue.path?.length ? String(issue.path[0]) : ''))
      .filter(Boolean)
  );

  const title = tString(step.titleKey as any, step.id);
  const hasProvidedFields = visibleKeys.some(
    (key) => !remainingIssueRoots.has(String(key))
  );

  return (
    <div
      className={cn(
        'eb-space-y-2.5 eb-rounded-md eb-border eb-p-3',
        stepComplete
          ? 'eb-border-success/30 eb-bg-success/[0.02]'
          : 'eb-border-warning/50'
      )}
    >
      <div className="eb-flex eb-items-start eb-justify-between eb-gap-2">
        <div className="eb-flex eb-min-w-0 eb-items-center eb-gap-1.5">
          {stepComplete ? (
            <CheckIcon className="eb-size-4 eb-shrink-0 eb-text-success" />
          ) : (
            <TriangleAlertIcon className="eb-size-4 eb-shrink-0 eb-text-warning" />
          )}
          <p className="eb-text-sm eb-font-semibold eb-tracking-tight">
            {title}
          </p>
        </div>
        {hasProvidedFields && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="eb-h-8 eb-shrink-0 eb-gap-1 eb-px-2 eb-text-xs"
            onClick={() => setIsEditingProvided((prev) => !prev)}
          >
            <PencilIcon className="eb-size-3.5" />
            {isEditingProvided
              ? tString('common:done', 'Done')
              : tString('common:change', 'Change')}
          </Button>
        )}
      </div>

      {visibleKeys.map((key) => {
        const field = key as keyof OnboardingFormValuesInitial;
        const value = formValues?.[field];
        const fieldConfig = partyFieldMap?.[field] as {
          toStringFn?: (
            val: any,
            values: Partial<OnboardingFormValuesInitial>
          ) => string | string[] | undefined;
          generateLabelStringFn?: (val: any) => string | undefined;
          isHiddenInReviewFn?: (val: any, values: any) => boolean;
        } & Record<string, any>;

        if (fieldConfig?.isHiddenInReviewFn?.(value, formValues)) {
          return null;
        }

        const prefixedPath = formPathPrefix
          ? `${formPathPrefix}.${String(field)}`
          : String(field);

        const pendingField =
          pendingByFormPath.get(prefixedPath) ??
          pendingByFormPath.get(String(field)) ??
          [...pendingByFormPath.values()].find((p) => {
            if (formPathPrefix) {
              return (
                p.formPath === prefixedPath ||
                p.formPath.startsWith(`${prefixedPath}.`)
              );
            }
            return p.fieldKey === field && !p.formPath.startsWith('owners.');
          });

        const { fieldRule, ruleType } = getFieldRule(field);
        const overrideLabel =
          fieldConfig?.generateLabelStringFn?.(value) ??
          (ruleType === 'single'
            ? (fieldRule?.contentTokenOverrides?.fieldName ??
              fieldRule?.contentTokenOverrides?.label)
            : undefined);

        const label = toDisplayString(
          overrideLabel,
          tString(
            [
              `fields.${field}.fieldName.default`,
              `fields.${field}.fieldName`,
              `fields.${field}.label.default`,
              `fields.${field}.label`,
            ] as any,
            String(field)
          )
        );

        const valueString = fieldConfig?.toStringFn
          ? fieldConfig.toStringFn(value, formValues)
          : value === undefined
            ? undefined
            : String(value);

        const fieldMissing = remainingIssueRoots.has(String(field));
        const showInput = fieldMissing || isEditingProvided;
        const editorField: DeltaPendingField = pendingField ?? {
          fieldKey: String(field),
          issuePath: String(field),
          formPath: prefixedPath,
        };

        if (showInput) {
          // Let OnboardingFormField own the label — avoid duplicate "Date of birth".
          // Missing fields get a light orange panel that clears once provided.
          return (
            <div
              key={String(field)}
              className={cn(
                'eb-space-y-1',
                fieldMissing &&
                  'eb-rounded-md eb-border eb-border-warning/40 eb-bg-warning-accent eb-p-2.5'
              )}
            >
              {renderDeltaPartyField({
                form,
                field: editorField,
                tString,
              })}
            </div>
          );
        }

        return (
          <div key={String(field)} className="eb-space-y-0.5">
            <p className="eb-text-xs eb-font-medium eb-text-muted-foreground">
              {label}
            </p>
            <div>
              {Array.isArray(valueString) ? (
                valueString.map((val, index) => (
                  <p className="eb-text-sm eb-text-foreground" key={index}>
                    {asPlainString(val) || tString('common:empty', '—')}
                  </p>
                ))
              ) : asPlainString(valueString) ? (
                <p className="eb-text-sm eb-text-foreground">
                  {asPlainString(valueString)}
                </p>
              ) : (
                <span className="eb-text-sm eb-italic eb-text-muted-foreground">
                  {tString('common:empty', '—')}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
