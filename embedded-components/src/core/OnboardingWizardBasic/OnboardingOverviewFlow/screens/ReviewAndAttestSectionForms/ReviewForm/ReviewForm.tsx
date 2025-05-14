import React, { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  AlertTriangleIcon,
  CheckIcon,
  ChevronDownIcon,
  InfoIcon,
  PencilIcon,
  TriangleAlertIcon,
  UsersIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import { useSmbdoListQuestions } from '@/api/generated/smbdo';
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

import { StepperReviewCards } from '../../../components/StepperReviewCards/StepperReviewCards';
import { useFlowContext } from '../../../context/FlowContext';
import { SectionScreenId, StepperStepProps } from '../../../flow.types';
import { useOnboardingOverviewContext } from '../../../OnboardingContext/OnboardingContext';
import {
  getFlowProgress,
  getStepperValidations,
} from '../../../utils/flowUtils';
import { ownerSteps } from '../../OwnersSectionScreen/ownerSteps';

export const ReviewForm: React.FC<StepperStepProps> = ({
  handlePrev,
  handleNext,
  getPrevButtonLabel,
  getNextButtonLabel,
}) => {
  const { clientData } = useOnboardingOverviewContext();
  const { t } = useTranslation('onboarding');

  const { sections, goTo, sessionData, reviewScreenOpenedSectionId } =
    useFlowContext();

  const form = useForm({
    defaultValues: {
      attested: false,
    },
    resolver: zodResolver(
      z.object({
        attested: z.boolean().refine((value) => value === true, {
          message:
            'You must attest that the data is true, accurate, and complete.',
        }),
      })
    ),
  });

  const { sectionStatuses } = getFlowProgress(
    sections,
    sessionData,
    clientData
  );

  // Get outstanding question IDs and existing question responses
  const outstandingQuestionIds = clientData?.outstanding?.questionIds ?? [];
  const existingQuestionResponses = clientData?.questionResponses ?? [];

  // Merge outstanding and existing question IDs
  const allQuestionIds = useMemo(() => {
    const existingIds = existingQuestionResponses.map(
      (response) => response.questionId ?? 'undefined'
    );
    return [...new Set([...outstandingQuestionIds, ...existingIds])];
  }, [outstandingQuestionIds, existingQuestionResponses]);

  const { data: questionsDetails } = useSmbdoListQuestions({
    questionIds: allQuestionIds.join(','),
  });

  const activeOwners =
    clientData?.parties?.filter(
      (party) =>
        party?.partyType === 'INDIVIDUAL' &&
        party?.roles?.includes('BENEFICIAL_OWNER') &&
        party.active
    ) || [];

  const ownersValidation = getStepperValidations(
    ownerSteps,
    activeOwners,
    clientData
  );

  const sectionIdsToReview: SectionScreenId[] = [
    'personal-section',
    'business-section',
    'owners-section',
    'additional-questions-section',
  ];

  const isMissingDetails = sectionIdsToReview.some((sectionId) => {
    return sectionStatuses[sectionId] !== 'done_editable';
  });

  const [shouldDisplayAlert, setShouldDisplayAlert] = useState(false);

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isMissingDetails) {
            setShouldDisplayAlert(true);
          } else {
            form.handleSubmit(() => {
              handleNext();
            })(e);
          }
        }}
        className="eb-flex eb-flex-auto eb-flex-col"
      >
        <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
          <Alert variant="informative" className="eb-pb-3">
            <InfoIcon className="eb-h-4 eb-w-4" />
            <AlertDescription>
              Your application is not submitted yet. Review your data and
              continue to finish.
            </AlertDescription>
          </Alert>
          {isMissingDetails && shouldDisplayAlert && (
            <Alert variant="warning" className="eb-pb-3">
              <AlertTriangle className="eb-h-4 eb-w-4" />
              <AlertTitle>There is a problem</AlertTitle>
              <AlertDescription>
                Please provide missing details before finishing your
                application.
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
                    sectionStatuses[section.id] === 'done_editable';

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
                      <StepperReviewCards
                        steps={section.stepperConfig.steps}
                        partyData={sectionPartyData}
                        onEditClick={(stepId) => {
                          goTo(section.id, {
                            initialStepperStepId: stepId,
                            editingPartyId: sectionPartyData?.id,
                          });
                        }}
                      />
                    );
                  } else if (section.id === 'owners-section') {
                    const goToOwners = () => {
                      goTo('owners-section');
                    };
                    content = (
                      <Card className="eb-mt-6 eb-p-4">
                        <div className="eb-flex eb-items-start eb-justify-between">
                          <h2 className="eb-text-xl eb-font-bold eb-tracking-tight">
                            Owners
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
                              Change
                            </Button>
                          ) : (
                            <Button
                              variant="default"
                              type="button"
                              size="sm"
                              className="eb-bg-[#C75300] eb-text-sm hover:eb-bg-[#C75300]/90"
                              onClick={goToOwners}
                            >
                              <PencilIcon />
                              Add
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
                                  No stakeholders added yet.
                                </p>
                              </div>
                            </Card>
                          )}

                          {activeOwners.map((owner) => (
                            <Card
                              key={owner.id}
                              className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4"
                            >
                              <div className="eb-space-y-1">
                                <CardTitle className="eb-text-xl eb-font-bold eb-tracking-tight">
                                  {[
                                    owner.individualDetails?.firstName,
                                    owner.individualDetails?.middleName,
                                    owner.individualDetails?.lastName,
                                    owner.individualDetails?.nameSuffix,
                                  ].join(' ')}
                                </CardTitle>
                                <p className="eb-text-sm eb-font-medium">
                                  {owner.individualDetails?.jobTitle === 'Other'
                                    ? `${t('jobTitles.Other')} - ${owner.individualDetails.jobTitleDescription}`
                                    : t([
                                        `jobTitles.${owner.individualDetails?.jobTitle}`,
                                      ] as unknown as TemplateStringsArray)}
                                </p>
                                <div className="eb-flex eb-gap-2 eb-pt-2">
                                  <Badge
                                    variant="outline"
                                    className="eb-border-transparent eb-bg-[#EDF4FF] eb-text-[#355FA1]"
                                  >
                                    Owner
                                  </Badge>
                                  {owner.roles?.includes('CONTROLLER') && (
                                    <Badge
                                      variant="outline"
                                      className="eb-border-transparent eb-bg-[#FFEBD9] eb-text-[#8F521F]"
                                    >
                                      Controller
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {owner.id &&
                                !ownersValidation[owner.id].allStepsValid && (
                                  <p className="eb-mt-1 eb-text-sm eb-font-normal eb-text-orange-500">
                                    {'\u24d8'} This individual is missing some
                                    details.
                                  </p>
                                )}
                            </Card>
                          ))}
                        </div>
                      </Card>
                    );
                  } else if (section.id === 'additional-questions-section') {
                    content = (
                      <Card className="eb-mt-6 eb-space-y-3 eb-rounded-lg eb-border eb-p-4">
                        <div className="eb-flex eb-items-start eb-justify-between">
                          <h2 className="eb-text-xl eb-font-bold eb-tracking-tight">
                            Operational details
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
                            Change
                          </Button>
                        </div>
                        {clientData?.outstanding?.questionIds?.map(
                          (questionId) => {
                            const question = questionsDetails?.questions?.find(
                              (q) => q.id === questionId
                            );
                            return (
                              <div className="eb-space-y-0.5" key={questionId}>
                                <p className="eb-text-sm eb-font-medium">
                                  {question?.description}
                                </p>
                                <div className="eb-flex eb-items-center eb-gap-1 eb-text-[#C75300]">
                                  <TriangleAlertIcon className="eb-size-4" />
                                  <p className="eb-italic">
                                    This field is missing
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        )}
                        {clientData?.questionResponses?.map(
                          (questionResponse) => (
                            <div
                              className="eb-space-y-0.5"
                              key={questionResponse.questionId}
                            >
                              <p className="eb-text-sm eb-font-medium">
                                {
                                  questionsDetails?.questions?.find(
                                    (q) => q.id === questionResponse.questionId
                                  )?.description
                                }
                              </p>
                              <div>
                                <b>{t('reviewAndAttest.response')}:</b>{' '}
                                {questionResponse?.values?.join(', ')}
                              </div>
                            </div>
                          )
                        )}
                      </Card>
                    );
                  }

                  return (
                    <AccordionItem
                      key={section.id}
                      value={section.id}
                      className={cn({
                        'eb-border-[#00875D]': isSectionCompleted,
                        'eb-border-[#C75300]': !isSectionCompleted,
                      })}
                    >
                      <AccordionTrigger
                        className={cn({
                          'eb-bg-[#EAF5F2]': isSectionCompleted,
                          'eb-bg-[#FFECD9]': !isSectionCompleted,
                        })}
                      >
                        <ChevronDownIcon className="eb-ml-2 eb-h-4 eb-w-4 eb-shrink-0 eb-transition-transform eb-duration-200" />
                        <div className="eb-ml-2 eb-text-sm">
                          {section.sectionConfig.label}
                        </div>
                        <div className="eb-ml-auto eb-mr-2 eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-normal eb-text-muted-foreground">
                          {isSectionCompleted ? (
                            <>
                              <p>Complete</p>
                              <CheckIcon className="eb-size-4 eb-text-[#00875D]" />
                            </>
                          ) : (
                            <>
                              <p>Missing details</p>
                              <AlertTriangleIcon className="eb-size-4 eb-text-[#C75300]" />
                            </>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>{content}</AccordionContent>
                    </AccordionItem>
                  );
                })}
            </Accordion>
          </div>
          <div className="eb-space-y-1">
            <p className="eb-text-sm eb-font-medium">
              Data accuracy attestation
            </p>
            <FormField
              control={form.control}
              name="attested"
              render={({ field }) => (
                <FormItem>
                  <div className="eb-flex eb-items-center eb-space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="eb-text-sm eb-font-normal peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                      The data I am providing is true, accurate and complete to
                      the best of my knowledge.
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="eb-mt-6 eb-space-y-6">
          <div className="eb-flex eb-justify-between eb-gap-4">
            <Button
              onClick={handlePrev}
              variant="secondary"
              size="lg"
              className={cn('eb-w-full eb-text-lg', {
                'eb-hidden': getPrevButtonLabel() === null,
              })}
            >
              {getPrevButtonLabel()}
            </Button>
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
          </div>
        </div>
      </form>
    </Form>
  );
};
