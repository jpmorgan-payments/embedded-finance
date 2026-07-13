import { Fragment, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { CheckIcon, PencilIcon, TriangleAlertIcon } from 'lucide-react';
import { FormProvider, useWatch, type UseFormReturn } from 'react-hook-form';

import { cn } from '@/lib/utils';
import type { QuestionResponse } from '@/api/generated/smbdo.schemas';
import { Button, Card } from '@/components/ui';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useQuestionTree } from '@/core/OnboardingFlow/screens/OperationalDetailsForm/useQuestionTree';
import type { SectionScreenConfig } from '@/core/OnboardingFlow/types/flow.types';
import {
  asPlainString,
  formatQuestionResponse,
  getActiveOwners,
  getPartyByAssociatedPartyFilters,
  getPartyName,
} from '@/core/OnboardingFlow/utils/dataUtils';
import {
  isQuestionVisible as computeQuestionVisibility,
  getChildQuestions,
  isTopLevelQuestion,
  normalizeQuestionId,
} from '@/core/OnboardingFlow/utils/questionTree';

import {
  collectBaselineDeltaPendingGroups,
  computeCompletedDeltaPendingGroupKeys,
  isDeltaQuestionAnswered,
} from './DeltaPendingFieldsPanel';
import type { DeltaPendingField } from './deltaPendingTypes';
import { InlineCompactStepCard } from './InlineCompactStepCard';
import { renderDeltaQuestionInput } from './inlineDeltaFieldRenderers';

type InlineCompactReviewProps = {
  sections: SectionScreenConfig[];
  form: UseFormReturn<Record<string, unknown>>;
};

/**
 * Always-expanded compact review for inline delta mode.
 * Missing fields render as in-place editors; filled values are plain rows.
 */
export function InlineCompactReview({
  sections,
  form,
}: InlineCompactReviewProps) {
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);
  const { clientData } = useOnboardingContext();
  const { currentScreenId, savedFormValues, staticScreens } = useFlowContext();

  const liveFormValues = useWatch({ control: form.control }) as
    | Record<string, unknown>
    | undefined;

  const liveOverlay = useMemo(
    () => ({
      ...savedFormValues,
      ...(liveFormValues ?? {}),
    }),
    [savedFormValues, liveFormValues]
  );

  const ownerSteps =
    staticScreens.find((s) => s.id === 'owner-stepper')?.stepperConfig?.steps ??
    [];

  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
  const existingQuestionResponses = clientData?.questionResponses ?? [];

  const { allQuestions } = useQuestionTree({
    outstandingQuestionIds,
    existingQuestionResponses,
  });

  const baselinePendingGroups = useMemo(
    () =>
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
      sections,
      clientData,
      ownerSteps,
      liveOverlay,
      currentScreenId,
    ]
  );

  const pendingByFormPath = useMemo(() => {
    const map = new Map<string, DeltaPendingField>();
    for (const group of baselinePendingGroups) {
      for (const field of group.fields) {
        map.set(field.formPath, field);
        if (!map.has(field.fieldKey)) {
          map.set(field.fieldKey, field);
        }
      }
    }
    return map;
  }, [baselinePendingGroups]);

  const sectionIds = [
    'personal-section',
    'business-section',
    'owners-section',
    'additional-questions-section',
  ] as const;

  const getResponseValues = (questionId: string) => {
    const live = liveFormValues?.[`question_${questionId}`];
    if (Array.isArray(live) && live.length > 0) {
      return live as string[];
    }
    return existingQuestionResponses.find(
      (r) =>
        normalizeQuestionId(r.questionId) === normalizeQuestionId(questionId)
    )?.values;
  };

  const isQuestionVisible = (question: QuestionResponse): boolean =>
    computeQuestionVisibility(question, allQuestions, getResponseValues);

  return (
    <FormProvider {...form}>
      <div className="eb-space-y-4">
        {sectionIds.map((sectionId) => {
          const section = sections.find((s) => s.id === sectionId);
          if (!section) return null;

          const sectionLabel = section.sectionConfig.shortLabelKey
            ? tString(section.sectionConfig.shortLabelKey as any)
            : tString(section.sectionConfig.labelKey as any);

          if (sectionId === 'owners-section') {
            const activeOwners = getActiveOwners(clientData) ?? [];
            const ownerGroups = baselinePendingGroups.filter((g) =>
              g.key.startsWith('owners-section:')
            );
            const ownersComplete =
              ownerGroups.length === 0 ||
              ownerGroups.every((g) => completedGroupKeys.has(g.key));

            return (
              <SectionShell
                key={sectionId}
                title={sectionLabel}
                complete={ownersComplete}
              >
                {activeOwners.length === 0 ? (
                  <p className="eb-text-sm eb-italic eb-text-muted-foreground">
                    {t(
                      'reviewAndAttest.noStakeholders',
                      'No stakeholders added yet.'
                    )}
                  </p>
                ) : (
                  activeOwners.map((owner) => {
                    if (!owner.id) return null;
                    const ownerPending = ownerGroups.filter((g) =>
                      g.key.includes(`:${owner.id}:`)
                    );
                    const ownerComplete =
                      ownerPending.length === 0 ||
                      ownerPending.every((g) => completedGroupKeys.has(g.key));
                    const jobTitle = asPlainString(
                      owner.individualDetails?.jobTitle
                    );

                    return (
                      <div
                        key={owner.id}
                        className={cn(
                          'eb-space-y-3 eb-rounded-md eb-border eb-p-3',
                          ownerComplete
                            ? 'eb-border-success/30'
                            : 'eb-border-warning/50'
                        )}
                      >
                        <div className="eb-flex eb-items-center eb-gap-1.5">
                          {ownerComplete ? (
                            <CheckIcon className="eb-size-4 eb-text-success" />
                          ) : (
                            <TriangleAlertIcon className="eb-size-4 eb-text-warning" />
                          )}
                          <div className="eb-min-w-0">
                            <p className="eb-text-sm eb-font-semibold">
                              {getPartyName(owner) ||
                                tString(
                                  'reviewAndAttest.ownerFallback',
                                  'Owner'
                                )}
                            </p>
                            {jobTitle ? (
                              <p className="eb-text-xs eb-text-muted-foreground">
                                {jobTitle === 'Other'
                                  ? asPlainString(
                                      owner.individualDetails
                                        ?.jobTitleDescription
                                    ) || jobTitle
                                  : tString(
                                      `jobTitles.${jobTitle}` as any,
                                      jobTitle
                                    )}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <InlineCompactStepCard
                          steps={ownerSteps}
                          partyData={owner}
                          form={form}
                          formValuesOverride={liveOverlay}
                          pendingByFormPath={pendingByFormPath}
                          completedGroupKeys={completedGroupKeys}
                          sectionId={`owners-section:${owner.id}`}
                          formPathPrefix={`owners.${owner.id}`}
                          validationScreenId="owner-stepper"
                        />
                      </div>
                    );
                  })
                )}
              </SectionShell>
            );
          }

          if (sectionId === 'additional-questions-section') {
            const hasOutstanding = outstandingQuestionIds.length > 0;
            const allAnswered =
              !hasOutstanding ||
              outstandingQuestionIds.every((id) =>
                isDeltaQuestionAnswered(liveFormValues, id)
              );

            const visibleQuestions = allQuestions
              .filter((q) => isTopLevelQuestion(q, allQuestions))
              .filter(isQuestionVisible);

            return (
              <SectionShell
                key={sectionId}
                title={sectionLabel}
                complete={allAnswered}
              >
                {visibleQuestions.length === 0 ? (
                  <p className="eb-text-sm eb-italic eb-text-muted-foreground">
                    {tString('common:empty', '—')}
                  </p>
                ) : (
                  <QuestionsBlock
                    form={form}
                    questions={visibleQuestions}
                    allQuestions={allQuestions}
                    outstandingQuestionIds={outstandingQuestionIds}
                    liveFormValues={liveFormValues}
                    getResponseValues={getResponseValues}
                    isQuestionVisible={isQuestionVisible}
                    t={t}
                    tString={tString}
                  />
                )}
              </SectionShell>
            );
          }

          if (section.type !== 'stepper' || !section.stepperConfig) {
            return null;
          }

          const partyData = section.stepperConfig.associatedPartyFilters
            ? getPartyByAssociatedPartyFilters(
                clientData,
                section.stepperConfig.associatedPartyFilters
              )
            : undefined;

          const sectionGroups = baselinePendingGroups.filter((g) =>
            g.key.startsWith(`${sectionId}:`)
          );
          const sectionComplete =
            sectionGroups.length === 0 ||
            sectionGroups.every((g) => completedGroupKeys.has(g.key));

          return (
            <SectionShell
              key={sectionId}
              title={sectionLabel}
              complete={sectionComplete}
            >
              <InlineCompactStepCard
                steps={section.stepperConfig.steps}
                partyData={partyData}
                form={form}
                formValuesOverride={liveOverlay}
                pendingByFormPath={pendingByFormPath}
                completedGroupKeys={completedGroupKeys}
                sectionId={sectionId}
              />
            </SectionShell>
          );
        })}
      </div>
    </FormProvider>
  );
}

function SectionShell({
  title,
  complete,
  children,
}: {
  title: string;
  complete: boolean;
  children: React.ReactNode;
}) {
  const { tString } = useTranslationWithTokens(['onboarding-overview']);
  return (
    <Card
      className={cn(
        'eb-space-y-3 eb-rounded-lg eb-border eb-p-3',
        complete ? 'eb-border-success/50' : 'eb-border-warning'
      )}
    >
      <div className="eb-flex eb-items-center eb-justify-between eb-gap-2">
        <h3 className="eb-text-base eb-font-semibold eb-tracking-tight">
          {title}
        </h3>
        <span
          className={cn(
            'eb-inline-flex eb-items-center eb-gap-1 eb-text-xs eb-font-medium',
            complete ? 'eb-text-success' : 'eb-text-warning'
          )}
        >
          {complete ? (
            <>
              <CheckIcon className="eb-size-3.5" />
              {tString('reviewAndAttest.complete', 'Complete')}
            </>
          ) : (
            <>
              <TriangleAlertIcon className="eb-size-3.5" />
              {tString('reviewAndAttest.missingDetails', 'Missing details')}
            </>
          )}
        </span>
      </div>
      <div className="eb-space-y-3">{children}</div>
    </Card>
  );
}

function QuestionsBlock({
  form,
  questions,
  allQuestions,
  outstandingQuestionIds,
  liveFormValues,
  getResponseValues,
  isQuestionVisible,
  t,
  tString,
}: {
  form: UseFormReturn<Record<string, unknown>>;
  questions: QuestionResponse[];
  allQuestions: QuestionResponse[];
  outstandingQuestionIds: string[];
  liveFormValues: Record<string, unknown> | undefined;
  getResponseValues: (questionId: string) => string[] | undefined;
  isQuestionVisible: (question: QuestionResponse) => boolean;
  t: (...args: any[]) => any;
  tString: (...args: any[]) => string;
}) {
  // Change only toggles editing of *answered* questions. Outstanding stay editable.
  const [isEditingProvided, setIsEditingProvided] = useState(false);

  const hasAnsweredQuestions = questions.some((question) => {
    const qid = question.id ?? '';
    const isOutstanding = outstandingQuestionIds.includes(qid);
    return !isOutstanding || isDeltaQuestionAnswered(liveFormValues, qid);
  });

  return (
    <div className="eb-space-y-3">
      {hasAnsweredQuestions && (
        <div className="eb-flex eb-justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="eb-h-8 eb-gap-1 eb-px-2 eb-text-xs"
            onClick={() => setIsEditingProvided((prev) => !prev)}
          >
            <PencilIcon className="eb-size-3.5" />
            {isEditingProvided
              ? tString('common:done', 'Done')
              : tString('common:change', 'Change')}
          </Button>
        </div>
      )}
      {questions.map((question) => {
        const qid = question.id ?? '';
        const isOutstanding = outstandingQuestionIds.includes(qid);
        const answered =
          !isOutstanding || isDeltaQuestionAnswered(liveFormValues, qid);
        const childQuestions = getChildQuestions(qid, allQuestions).filter(
          isQuestionVisible
        );
        const label =
          question.description?.split('\n')[0] ?? question.id ?? 'Question';
        const values = getResponseValues(qid);
        const displayAnswer = formatInlineAnswer(values, question.id, tString);
        const showInput = !answered || isEditingProvided;

        return (
          <Fragment key={qid}>
            {showInput ? (
              <div
                className={cn(
                  'eb-space-y-1',
                  !answered &&
                    'eb-rounded-md eb-border eb-border-warning/40 eb-bg-warning-accent eb-p-2.5'
                )}
              >
                <p
                  className={cn(
                    'eb-text-xs eb-font-medium',
                    answered ? 'eb-text-muted-foreground' : 'eb-text-warning'
                  )}
                >
                  {label}
                </p>
                <div className="[&_label]:eb-sr-only">
                  {renderDeltaQuestionInput({ form, question, t })}
                </div>
              </div>
            ) : (
              <div className="eb-space-y-0.5">
                <p className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                  {label}
                </p>
                <p className="eb-text-sm eb-text-foreground">{displayAnswer}</p>
              </div>
            )}
            {childQuestions.map((child) => {
              const childId = child.id ?? '';
              const childOutstanding =
                outstandingQuestionIds.includes(childId);
              const childAnswered =
                !childOutstanding ||
                isDeltaQuestionAnswered(liveFormValues, childId);
              const childLabel =
                child.description?.split('\n')[0] ?? child.id ?? 'Question';
              const childDisplay = formatInlineAnswer(
                getResponseValues(childId),
                child.id,
                tString
              );
              const showChildInput = !childAnswered || isEditingProvided;

              return showChildInput ? (
                <div
                  key={childId}
                  className={cn(
                    'eb-space-y-1',
                    !childAnswered &&
                      'eb-rounded-md eb-border eb-border-warning/40 eb-bg-warning-accent eb-p-2.5'
                  )}
                >
                  <p
                    className={cn(
                      'eb-text-xs eb-font-medium',
                      childAnswered
                        ? 'eb-text-muted-foreground'
                        : 'eb-text-warning'
                    )}
                  >
                    {childLabel}
                  </p>
                  <div className="[&_label]:eb-sr-only">
                    {renderDeltaQuestionInput({
                      form,
                      question: child,
                      t,
                    })}
                  </div>
                </div>
              ) : (
                <div key={childId} className="eb-space-y-0.5">
                  <p className="eb-text-xs eb-font-medium eb-text-muted-foreground">
                    {childLabel}
                  </p>
                  <p className="eb-text-sm eb-text-foreground">{childDisplay}</p>
                </div>
              );
            })}
          </Fragment>
        );
      })}
    </div>
  );
}

function formatInlineAnswer(
  values: string[] | undefined,
  questionId: string | undefined,
  tString: (...args: any[]) => string
): string {
  if (!values?.length) {
    return tString('common:empty', '—');
  }
  const joined = values.join(', ');
  if (joined === 'true') {
    return tString('common:yes', 'Yes');
  }
  if (joined === 'false') {
    return tString('common:no', 'No');
  }
  if (questionId === '30005') {
    return asPlainString(formatQuestionResponse({ questionId, values } as any));
  }
  return joined;
}
