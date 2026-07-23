import React, { Fragment, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  AlertTriangleIcon,
  CheckIcon,
  ChevronDownIcon,
  InfoIcon,
  Loader2Icon,
  PencilIcon,
  TriangleAlertIcon,
  UsersIcon,
} from 'lucide-react';
import { useForm, useFormState, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import {
  ClientResponse,
  QuestionResponse,
} from '@/api/generated/smbdo.schemas';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Badge,
  Button,
  Card,
  CardTitle,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui';
import { StepsReviewCards } from '@/core/OnboardingFlow/components';
import { partyFieldMap } from '@/core/OnboardingFlow/config/fieldMap';
import { PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES } from '@/core/OnboardingFlow/consts/stockExchanges';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useFlowUnsavedChangesSync } from '@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync';
import { useStableStepSchemas } from '@/core/OnboardingFlow/hooks/useStableStepSchemas';
import { useQuestionTree } from '@/core/OnboardingFlow/screens/OperationalDetailsForm/useQuestionTree';
import {
  SectionScreenId,
  StepperStepProps,
} from '@/core/OnboardingFlow/types/flow.types';
import {
  asPlainString,
  formatQuestionResponse,
  getOrganizationParty,
  getPartyName,
} from '@/core/OnboardingFlow/utils/dataUtils';
import {
  getFlowProgress,
  getStepperValidations,
} from '@/core/OnboardingFlow/utils/flowUtils';
import {
  isQuestionVisible as computeQuestionVisibility,
  getChildQuestions,
  isTopLevelQuestion,
  normalizeQuestionId,
} from '@/core/OnboardingFlow/utils/questionTree';

import { useTermsAndConditions } from '../TermsAndConditionsForm/useTermsAndConditions';

export const ReviewForm: React.FC<StepperStepProps> = ({
  handlePrev,
  handleNext,
  getPrevButtonLabel,
  getNextButtonLabel,
}) => {
  const { clientData, disclosureConfig } = useOnboardingContext();
  const { t, tString } = useTranslationWithTokens([
    'onboarding-overview',
    'common',
  ]);

  const hasDisclosureConfig = !!disclosureConfig?.platformName;

  const {
    sections,
    staticScreens,
    goTo,
    sessionData,
    updateSessionData,
    reviewScreenOpenedSectionId,
    currentScreenId,
    savedFormValues,
    deltaModeActive,
    setIsFormSubmitting,
  } = useFlowContext();

  // Delta mode merges this Review step and the standalone Terms & conditions
  // step into a single "Review & attest" page: the review summary below plus
  // the terms documents and a combined accuracy + terms attestation. Submitting
  // runs KYC directly and returns to the overview (no separate Terms step).
  const deltaTerms = useTermsAndConditions({
    enabled: deltaModeActive,
    combineAccuracyAttestation: true,
    onAfterKycSuccess: () => {
      // Clear the submitting flag before navigating so the overview (and any
      // subsequent screens) aren't left globally disabled.
      setIsFormSubmitting(false);
      goTo('overview', { resetHistory: true });
    },
  });

  const booleanRequired = z.boolean().refine((value) => value === true, {
    message: tString(
      'reviewAndAttest.attestation.mustAgreeToAll',
      'You must agree to all attestations before proceeding.'
    ),
  });

  const form = useForm({
    defaultValues: hasDisclosureConfig
      ? {
          attested: false,
          attestAccurateInfo: false,
        }
      : {
          attested: false,
        },
    resolver: zodResolver(
      hasDisclosureConfig
        ? z.object({
            attested: z.boolean().optional(),
            attestAccurateInfo: booleanRequired,
          })
        : z.object({
            attested: z.boolean().refine((value) => value === true, {
              message: tString(
                'reviewAndAttest.attestation.mustAttestAccurate',
                'You must attest that the data is true, accurate, and complete.'
              ),
            }),
          })
    ),
  });

  const { isDirty } = useFormState({ control: form.control });
  useFlowUnsavedChangesSync(isDirty);

  // Stable, unfiltered step schemas so the validation helpers below stay
  // hook-free (constant schema-hook count regardless of visibility / owners).
  const stableStepSchemas = useStableStepSchemas();

  const { sectionStatuses } = getFlowProgress(
    sections,
    sessionData,
    clientData,
    savedFormValues,
    currentScreenId,
    stableStepSchemas
  );

  // Get outstanding question IDs and existing question responses
  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
  const existingQuestionResponses = clientData?.questionResponses ?? [];

  // Use the same question-tree hook as the OperationalDetailsForm so both
  // screens always render the exact same set of questions (including deeply
  // nested sub-questions), in the same order.
  const { allQuestions } = useQuestionTree({
    outstandingQuestionIds,
    existingQuestionResponses,
  });

  // Visibility is delegated to the shared question-tree helper; here the
  // response source is the saved responses rather than live form state.
  const getResponseValues = (questionId: string) =>
    existingQuestionResponses.find(
      (r) =>
        normalizeQuestionId(r.questionId) === normalizeQuestionId(questionId)
    )?.values;

  const isQuestionVisible = (question: QuestionResponse): boolean =>
    computeQuestionVisibility(question, allQuestions, getResponseValues);

  const activeOwners =
    clientData?.parties?.filter(
      (party) =>
        party?.partyType === 'INDIVIDUAL' &&
        party?.roles?.includes('BENEFICIAL_OWNER') &&
        party.active
    ) || [];

  // Owners are collected via the owner stepper (a static screen), not the
  // owners-section (a component with no stepperConfig). Validate against the
  // real owner steps + 'owner-stepper' screen so completeness matches the owner
  // cards and the section status; the old lookup resolved to [] (never flagged).
  const ownerSteps =
    staticScreens.find((screen) => screen.id === 'owner-stepper')?.stepperConfig
      ?.steps || [];

  const ownersValidation = getStepperValidations(
    ownerSteps,
    activeOwners,
    clientData,
    savedFormValues,
    'owner-stepper',
    stableStepSchemas
  );

  const sectionIdsToReview: SectionScreenId[] = [
    'personal-section',
    'business-section',
    'owners-section',
    'additional-questions-section',
  ];

  const isMissingDetails = sectionIdsToReview
    .filter((id) => sections.some((section) => section.id === id))
    .some((sectionId) => {
      return sectionStatuses[sectionId] !== 'completed';
    });

  const [shouldDisplayAlert, setShouldDisplayAlert] = useState(false);

  // The delta terms form and the standalone attestation form have different
  // field shapes; the provider only needs the RHF methods, so widen the type.
  const activeForm = (deltaModeActive
    ? deltaTerms.form
    : form) as unknown as UseFormReturn<Record<string, unknown>>;

  return (
    <Form {...activeForm}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isMissingDetails) {
            setShouldDisplayAlert(true);
            return;
          }
          if (deltaModeActive) {
            deltaTerms.trySubmit().catch(() => {
              // Errors are surfaced via ServerErrorAlert / form state
            });
            return;
          }
          form.handleSubmit(() => {
            updateSessionData({
              completedStaticStepIds: [
                ...(sessionData.completedStaticStepIds ?? []),
                'review',
              ],
            });
            handleNext();
          })(e);
        }}
        className="eb-flex eb-flex-auto eb-flex-col"
      >
        <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
          <Alert variant="informative" noTitle>
            <InfoIcon className="eb-h-4 eb-w-4" />
            <AlertDescription>
              {t(
                'reviewAndAttest.notSubmittedYet',
                'Your application is not submitted yet. Review your data and continue to finish.'
              )}
            </AlertDescription>
          </Alert>
          {isMissingDetails && shouldDisplayAlert && (
            <Alert variant="warning">
              <AlertTriangle className="eb-h-4 eb-w-4" />
              <AlertTitle>
                {t('reviewAndAttest.thereIsAProblem', 'There is a problem')}
              </AlertTitle>
              <AlertDescription>
                {t(
                  'reviewAndAttest.provideMissingDetails',
                  'Please provide missing details before finishing your application.'
                )}
              </AlertDescription>
            </Alert>
          )}
          <div>
            <Accordion
              type="single"
              collapsible
              className="eb-w-full"
              defaultValue={reviewScreenOpenedSectionId ?? undefined}
            >
              {sections
                .filter((section) => sectionIdsToReview.includes(section.id))
                .map((section) => {
                  let content = null;
                  const isSectionCompleted =
                    sectionStatuses[section.id] === 'completed';

                  if (
                    section.type === 'stepper' &&
                    section.id !== 'review-attest-section'
                  ) {
                    const associatedPartyFilters =
                      section.stepperConfig?.associatedPartyFilters;
                    const sectionPartyData = associatedPartyFilters
                      ? clientData?.parties?.find(
                          (party) =>
                            party?.partyType ===
                              associatedPartyFilters.partyType &&
                            associatedPartyFilters.roles?.every((role) =>
                              party?.roles?.includes(role)
                            ) &&
                            party.active
                        )
                      : undefined;

                    content = (
                      <div className="eb-space-y-4">
                        {section.id === 'business-section' && (
                          <GatewayReviewCard
                            clientData={clientData}
                            onChangeClick={() => goTo('gateway')}
                          />
                        )}
                        <StepsReviewCards
                          steps={section.stepperConfig.steps}
                          partyData={sectionPartyData}
                          onEditClick={(stepId) => {
                            goTo(section.id, {
                              initialStepperStepId: stepId,
                              editingPartyId: sectionPartyData?.id,
                            });
                          }}
                        />
                      </div>
                    );
                  } else if (section.id === 'owners-section') {
                    const goToOwners = () => {
                      goTo('owners-section');
                    };
                    content = (
                      <Card className="eb-mt-6 eb-p-4">
                        <div className="eb-flex eb-items-start eb-justify-between">
                          <h2 className="eb-text-xl eb-font-bold eb-tracking-tight">
                            {t('reviewAndAttest.owners', 'Owners')}
                          </h2>
                          {isSectionCompleted ? (
                            <Button
                              variant="ghost"
                              type="button"
                              size="sm"
                              className="eb-h-8 eb-p-2 eb-text-sm"
                              onClick={goToOwners}
                            >
                              <PencilIcon />
                              {t('common:change', 'Change')}
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              type="button"
                              size="sm"
                              className="eb-bg-warning eb-text-sm hover:eb-bg-warning/90"
                              onClick={goToOwners}
                            >
                              <PencilIcon />
                              {t('common:add', 'Add')}
                            </Button>
                          )}
                        </div>
                        <div className="eb-mt-4 eb-space-y-4">
                          {activeOwners.length === 0 && (
                            <Card className="eb-mt-6 eb-p-4 eb-shadow-md">
                              <div className="eb-flex eb-flex-col eb-items-center eb-space-y-3">
                                <div className="eb-flex eb-h-8 eb-w-8 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary eb-stroke-white">
                                  <UsersIcon className="eb-size-4 eb-fill-white eb-stroke-white" />
                                </div>
                                <p className="eb-text-sm">
                                  {t(
                                    'reviewAndAttest.noStakeholders',
                                    'No stakeholders added yet.'
                                  )}
                                </p>
                              </div>
                            </Card>
                          )}

                          {activeOwners.map((owner) => {
                            const jobTitle = asPlainString(
                              owner.individualDetails?.jobTitle
                            );
                            const jobTitleDescription = asPlainString(
                              owner.individualDetails?.jobTitleDescription
                            );
                            return (
                              <Card
                                key={owner.id}
                                className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4"
                              >
                                <div className="eb-space-y-1">
                                  <CardTitle className="eb-text-xl eb-font-bold eb-tracking-tight">
                                    {getPartyName(owner)}
                                  </CardTitle>
                                  <p className="eb-text-sm eb-font-medium">
                                    {jobTitle === 'Other'
                                      ? `${tString('jobTitles.Other', { defaultValue: 'Other' })} - ${jobTitleDescription}`
                                      : t(`jobTitles.${jobTitle}`, {
                                          defaultValue: jobTitle,
                                        })}
                                  </p>
                                  <div className="eb-flex eb-gap-2 eb-pt-2">
                                    <Badge
                                      variant="outline"
                                      className="eb-border-transparent eb-bg-[#EDF4FF] eb-text-[#355FA1]"
                                    >
                                      {t('reviewAndAttest.owner', 'Owner')}
                                    </Badge>
                                    {owner.roles?.includes('CONTROLLER') && (
                                      <Badge
                                        variant="outline"
                                        className="eb-border-transparent eb-bg-[#FFEBD9] eb-text-[#8F521F]"
                                      >
                                        {t(
                                          'reviewAndAttest.controller',
                                          'Controller'
                                        )}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {owner.id &&
                                  !ownersValidation[owner.id].allStepsValid && (
                                    <p className="eb-mt-1 eb-text-sm eb-font-normal eb-text-orange-500">
                                      {t(
                                        'reviewAndAttest.individualMissingDetails',
                                        '\u24d8 This individual is missing some details.'
                                      )}
                                    </p>
                                  )}
                              </Card>
                            );
                          })}
                        </div>
                      </Card>
                    );
                  } else if (section.id === 'additional-questions-section') {
                    const renderQuestionReview = (q: QuestionResponse) => {
                      const qText = q.description
                        ?.split('\n')
                        .map((line, idx) => (
                          <p
                            key={idx}
                            className={cn({
                              'eb-ml-4': idx > 0,
                            })}
                          >
                            {line}
                          </p>
                        ));

                      if (
                        q.id &&
                        clientData?.outstanding.questionIds?.includes(q.id)
                      ) {
                        return (
                          <div className="eb-space-y-0.5">
                            <div className="eb-text-sm eb-font-medium">
                              {qText}
                            </div>
                            <div className="eb-flex eb-items-center eb-gap-1 eb-text-warning">
                              <TriangleAlertIcon className="eb-size-4" />
                              <p className="eb-italic">
                                {t(
                                  'reviewAndAttest.fieldIsMissing',
                                  'This field is missing'
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      const response = existingQuestionResponses?.find(
                        (r) => r.questionId === q.id
                      );

                      return (
                        <div className="eb-space-y-0.5">
                          <div className="eb-text-sm eb-font-medium">
                            {qText}
                          </div>
                          <div>
                            <b>{t('reviewAndAttest.response')}:</b>{' '}
                            {(response && formatQuestionResponse(response)) || (
                              <span className="eb-italic eb-text-muted-foreground">
                                {t('common:empty')}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    };

                    // Recursively render visible sub-questions to arbitrary
                    // depth, matching OperationalDetailsForm's tree rendering.
                    const renderSubQuestionsReview = (
                      parentId: string | undefined
                    ): React.ReactNode => {
                      if (!parentId) return null;
                      const childQuestions = getChildQuestions(
                        parentId,
                        allQuestions
                      ).filter(isQuestionVisible);

                      return childQuestions.map((subQuestion) => (
                        <Fragment key={subQuestion.id}>
                          {renderQuestionReview(subQuestion)}
                          {renderSubQuestionsReview(subQuestion.id)}
                        </Fragment>
                      ));
                    };

                    content = (
                      <Card className="eb-mt-6 eb-space-y-3 eb-rounded-lg eb-border eb-p-4">
                        <div className="eb-flex eb-items-start eb-justify-between">
                          <h2 className="eb-text-xl eb-font-bold eb-tracking-tight">
                            {t(
                              'reviewAndAttest.operationalDetailsHeading',
                              'Operational details'
                            )}
                          </h2>
                          <Button
                            variant="ghost"
                            type="button"
                            size="sm"
                            className="eb-h-8 eb-p-2 eb-text-sm"
                            onClick={() => {
                              goTo('additional-questions-section');
                            }}
                          >
                            <PencilIcon />
                            {t('common:change', 'Change')}
                          </Button>
                        </div>
                        {allQuestions
                          .filter((question) =>
                            isTopLevelQuestion(question, allQuestions)
                          )
                          .filter(isQuestionVisible)
                          .map((question) => (
                            <Fragment key={question.id}>
                              {renderQuestionReview(question)}
                              {renderSubQuestionsReview(question.id)}
                            </Fragment>
                          ))}
                      </Card>
                    );
                  }

                  return (
                    <AccordionItem
                      key={section.id}
                      value={section.id}
                      className={cn({
                        'eb-border-success': isSectionCompleted,
                        'eb-border-warning': !isSectionCompleted,
                      })}
                    >
                      <AccordionTrigger
                        className={cn({
                          'eb-bg-success-accent': isSectionCompleted,
                          'eb-bg-warning-accent': !isSectionCompleted,
                        })}
                      >
                        <ChevronDownIcon className="eb-ml-2 eb-h-4 eb-w-4 eb-shrink-0 eb-transition-transform eb-duration-200" />
                        <div className="eb-ml-2 eb-text-sm">
                          {t(section.sectionConfig.labelKey as any)}
                        </div>
                        <div className="eb-ml-auto eb-mr-2 eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-normal eb-text-muted-foreground">
                          {isSectionCompleted ? (
                            <>
                              <p>{t('reviewAndAttest.complete', 'Complete')}</p>
                              <CheckIcon className="eb-size-4 eb-text-success" />
                            </>
                          ) : (
                            <>
                              <p>
                                {t(
                                  'reviewAndAttest.missingDetails',
                                  'Missing details'
                                )}
                              </p>
                              <AlertTriangleIcon className="eb-size-4 eb-text-warning" />
                            </>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="eb-mt-4">
                        {content}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
            </Accordion>
          </div>
          {deltaModeActive ? (
            deltaTerms.termsBody
          ) : hasDisclosureConfig ? (
            <div className="eb-space-y-3">
              <p className="eb-text-sm eb-font-medium">
                {t(
                  'reviewAndAttest.attestation.heading',
                  'By electronically submitting this Application, you agree that:'
                )}
              </p>
              <div
                className="eb-space-y-3 eb-rounded-md eb-border eb-border-border eb-bg-muted/30 eb-p-4"
                role="group"
                aria-label={tString(
                  'reviewAndAttest.dataAccuracyAttestation',
                  'Data accuracy attestation'
                )}
              >
                {/* Checkbox 1: Accurate info & business purposes */}
                <FormField
                  control={form.control}
                  name="attestAccurateInfo"
                  render={({ field }) => (
                    <FormItem>
                      <div className="eb-flex eb-items-start eb-gap-2">
                        <FormControl>
                          <Checkbox
                            className="eb-mt-0.5"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="eb-cursor-pointer eb-text-sm eb-font-normal eb-leading-relaxed eb-text-foreground">
                          {t(
                            'reviewAndAttest.attestation.accurateInfo',
                            'All information you have provided is complete and accurate, and you are opening this account solely for business purposes and not for consumer purposes.'
                          )}
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          ) : (
            <div className="eb-space-y-2">
              <p className="eb-text-sm eb-font-medium">
                {t(
                  'reviewAndAttest.dataAccuracyAttestation',
                  'Data accuracy attestation'
                )}
              </p>
              <FormField
                control={form.control}
                name="attested"
                render={({ field }) => (
                  <FormItem>
                    <div className="eb-flex eb-items-start eb-space-x-3">
                      <FormControl>
                        <Checkbox
                          className="eb-mt-0.5 eb-rounded-sm"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="eb-text-sm eb-font-normal eb-text-foreground peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                        {t(
                          'reviewAndAttest.dataAccuracyCheckbox',
                          'The data I am providing is true, accurate and complete to the best of my knowledge.'
                        )}
                      </FormLabel>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>
        <div className="eb-mt-6 eb-space-y-6">
          <div className="eb-flex eb-flex-col eb-gap-3">
            {deltaModeActive ? (
              <Button
                type="submit"
                variant="default"
                size="lg"
                className="eb-w-full eb-text-lg"
                disabled={
                  deltaTerms.isFormSubmitting ||
                  (deltaTerms.useHostAckList && !deltaTerms.hostAckComplete)
                }
              >
                {deltaTerms.isFormSubmitting && (
                  <Loader2Icon className="eb-animate-spin" />
                )}
                {tString(
                  'stepperRenderer.buttons.agreeAndFinish',
                  'Agree and finish'
                )}
              </Button>
            ) : (
              <Button
                type="submit"
                variant="default"
                size="lg"
                className={cn('eb-w-full eb-text-lg', {
                  'eb-hidden': getNextButtonLabel() === null,
                })}
              >
                {getNextButtonLabel()}
              </Button>
            )}
            <Button
              type="button"
              onClick={handlePrev}
              variant="secondary"
              size="lg"
              className={cn('eb-w-full eb-text-lg', {
                'eb-hidden': getPrevButtonLabel() === null,
              })}
            >
              {getPrevButtonLabel()}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

// ---------------------------------------------------------------------------
// Gateway Review Card
// ---------------------------------------------------------------------------

const GatewayReviewCard: React.FC<{
  clientData: ClientResponse | undefined;
  onChangeClick: () => void;
}> = ({ clientData, onChangeClick }) => {
  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);
  const { enablePubliclyTradedCompanies } = useOnboardingContext();
  const orgParty = getOrganizationParty(clientData);
  const orgType = orgParty?.organizationDetails?.organizationType;
  const publiclyTraded = orgParty?.organizationDetails?.publiclyTraded;
  const isSubsidiary = orgParty?.organizationDetails?.isSubsidiary;

  if (!orgType) return null;

  // Get PTC display value using the fieldMap's toStringFn
  const ptcValue = !publiclyTraded
    ? 'none'
    : isSubsidiary
      ? 'subsidiary'
      : 'ptc';
  const ptcDisplayValue = partyFieldMap.isPTCOrSubsidiary?.toStringFn?.(
    ptcValue,
    {} as any
  );

  return (
    <Card className="eb-rounded-lg eb-border eb-p-4">
      <div className="eb-flex eb-items-start eb-justify-between">
        <h2 className="eb-text-xl eb-font-bold eb-tracking-tight">
          {t('reviewAndAttest.businessType', 'Business type')}
        </h2>
        <Button
          variant="ghost"
          type="button"
          size="sm"
          className="eb-h-8 eb-p-2 eb-text-sm"
          onClick={onChangeClick}
        >
          <PencilIcon />
          {t('common:change', 'Change')}
        </Button>
      </div>

      <div className="eb-mt-3 eb-space-y-2">
        <div className="eb-space-y-0.5">
          <p className="eb-text-label eb-font-label eb-text-label-foreground">
            {t('fields.organizationTypeHierarchy.label', 'Organization type')}
          </p>
          <p className="eb-text-sm">
            {t(`organizationTypes.${orgType}`, orgType)}
          </p>
        </div>

        {ptcValue !== 'none' && publiclyTraded && (
          <div className="eb-space-y-0.5">
            <p className="eb-text-label eb-font-label eb-text-label-foreground">
              {t('fields.isPTCOrSubsidiary.label', 'Publicly traded status')}
            </p>
            <p className="eb-text-sm">
              {ptcDisplayValue}
              {publiclyTraded.tickerSymbol && (
                <>
                  {' · '}
                  {t('fields.tickerSymbol.label', 'Ticker symbol')}
                  {': '}
                  {publiclyTraded.tickerSymbol}
                </>
              )}
              {(publiclyTraded.stockExchangeName ||
                publiclyTraded.stockExchange) && (
                <>
                  {' · '}
                  {t('fields.stockExchange.label', 'Stock exchange')}
                  {': '}
                  {publiclyTraded.stockExchangeName ||
                    publiclyTraded.stockExchange}
                </>
              )}
            </p>
          </div>
        )}

        {ptcValue === 'none' &&
          enablePubliclyTradedCompanies &&
          PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES.includes(orgType as any) && (
            <div className="eb-space-y-0.5">
              <p className="eb-text-label eb-font-label eb-text-label-foreground">
                {t('fields.isPTCOrSubsidiary.label', 'Publicly traded status')}
              </p>
              <p className="eb-text-sm">
                {t('fields.isPTCOrSubsidiary.options.none', 'No')}
              </p>
            </div>
          )}
      </div>
    </Card>
  );
};
