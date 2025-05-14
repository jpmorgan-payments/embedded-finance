import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightIcon,
  InfoIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import {
  getSmbdoGetClientQueryKey,
  useUpdateParty,
} from '@/api/generated/smbdo';
import { ClientResponse, Role } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge, Card, CardTitle } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '@/core/OnboardingWizardBasic/ServerErrorAlert/ServerErrorAlert';

import { LearnMorePopoverTrigger } from '../../components/LearnMorePopover/LearnMorePopover';
import { StepLayout } from '../../components/StepLayout/StepLayout';
import { useFlowContext } from '../../context/FlowContext';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { getFlowProgress, getStepperValidations } from '../../utils/flowUtils';
import { ownerSteps } from './ownerSteps';

export const OwnersSectionScreen = () => {
  const { clientData, onPostPartyResponse } = useOnboardingOverviewContext();
  const { t } = useTranslation(['onboarding', 'common']);
  const queryClient = useQueryClient();

  const controllerParty = clientData?.parties?.find(
    (party) =>
      party?.partyType === 'INDIVIDUAL' &&
      party?.roles?.includes('CONTROLLER') &&
      party.active
  );

  const {
    currentScreenId,
    originScreenId,
    goTo,
    goBack,
    previouslyCompletedScreens,
    sections,
    sessionData,
    updateSessionData,
  } = useFlowContext();

  const { sectionStatuses } = getFlowProgress(
    sections,
    sessionData,
    clientData
  );

  const reviewMode = originScreenId === 'review-attest-section';
  const previouslyCompleted = previouslyCompletedScreens[currentScreenId];

  const form = useForm({
    defaultValues: {
      controllerIsAnOwner: controllerParty
        ? controllerParty.roles?.includes('BENEFICIAL_OWNER')
          ? 'yes'
          : previouslyCompleted
            ? 'no'
            : undefined
        : undefined,
    },
  });

  const {
    mutate: updateController,
    error: controllerUpdateError,
    status: controllerUpdateStatus,
  } = useUpdateParty();

  // Update controller roles on change
  useEffect(() => {
    const updateControllerRoles = (controllerId: string, roles: Role[]) => {
      updateController(
        {
          partyId: controllerId,
          data: {
            roles,
          },
        },
        {
          onSettled: (data, error) => {
            onPostPartyResponse?.(data, error?.response?.data);
          },
          onSuccess: (response) => {
            if (clientData) {
              queryClient.setQueryData(
                getSmbdoGetClientQueryKey(clientData.id),
                (oldClientData: ClientResponse | undefined) => ({
                  ...oldClientData,
                  parties: oldClientData?.parties?.map((party) => {
                    if (party.id === response.id) {
                      return {
                        ...party,
                        ...response,
                      };
                    }
                    return party;
                  }),
                })
              );
              form.setValue(
                'controllerIsAnOwner',
                response.roles?.includes('BENEFICIAL_OWNER') ? 'yes' : 'no'
              );
            }
          },
          onError: (error) => {
            form.setValue(
              'controllerIsAnOwner',
              controllerParty?.roles?.includes('BENEFICIAL_OWNER')
                ? 'yes'
                : 'no'
            );
            form.setError('controllerIsAnOwner', {
              type: 'server',
              message: error?.response?.data?.context?.[0]?.message,
            });
          },
        }
      );
    };

    if (
      form.watch('controllerIsAnOwner') === 'yes' &&
      controllerParty?.id &&
      controllerParty?.roles &&
      !controllerParty.roles.includes('BENEFICIAL_OWNER')
    ) {
      updateControllerRoles(controllerParty.id, [
        ...controllerParty.roles,
        'BENEFICIAL_OWNER',
      ]);
    } else if (
      form.watch('controllerIsAnOwner') === 'no' &&
      controllerParty?.id &&
      controllerParty?.roles &&
      controllerParty.roles.includes('BENEFICIAL_OWNER')
    ) {
      updateControllerRoles(controllerParty.id, [
        ...controllerParty.roles.filter((role) => role !== 'BENEFICIAL_OWNER'),
      ]);
    }
  }, [form.watch('controllerIsAnOwner')]);

  // use to update party active status
  const {
    mutate: updatePartyActive,
    error: partyActiveUpdateError,
    status: partyActiveUpdateStatus,
  } = useUpdateParty();

  const ownersData =
    clientData?.parties?.filter(
      (party) =>
        party?.partyType === 'INDIVIDUAL' &&
        party?.roles?.includes('BENEFICIAL_OWNER')
    ) || [];

  const activeOwners = ownersData.filter(
    (owner) => owner.active || owner.status === 'ACTIVE'
  );

  const ownersValidation = getStepperValidations(
    ownerSteps,
    activeOwners,
    clientData
  );

  const handleEditBeneficialOwner = (beneficialOwnerId: string | null) => {
    if (beneficialOwnerId) {
      goTo('owner-stepper', {
        editingPartyId: beneficialOwnerId,
        previouslyCompleted: ownersValidation[beneficialOwnerId].allStepsValid,
      });
    } else {
      goTo('owner-stepper');
    }
  };

  const deactivateBeneficialOwner = (beneficialOwnerId: string) => {
    updatePartyActive(
      {
        partyId: beneficialOwnerId,
        data: {
          active: false,
        },
      },
      {
        onSuccess: (response) => {
          if (clientData) {
            const queryKey = getSmbdoGetClientQueryKey(clientData.id);
            queryClient.setQueryData(
              queryKey,
              (oldClientData: ClientResponse | undefined) => ({
                ...oldClientData,
                parties: oldClientData?.parties?.map((party) => {
                  if (party.id === response.id) {
                    return {
                      ...party,
                      ...response,
                    };
                  }
                  return party;
                }),
              })
            );
            queryClient.invalidateQueries({ queryKey });
          }
        },
      }
    );
  };

  const isFormDisabled =
    controllerUpdateStatus === 'pending' ||
    partyActiveUpdateStatus === 'pending';

  // TODO: get completed status from global stepper,
  // send completed status to global stepper

  return (
    <StepLayout
      title="Owners and key roles"
      description="Provide information for owners and senior managers for your company. Keep in mind that individual people may have multiple roles."
    >
      <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
        <Alert variant="informative">
          <InfoIcon className="eb-h-4 eb-w-4" />
          <AlertDescription className="eb-flex eb-flex-col">
            <p className="eb-mb-2 eb-font-semibold">Organization roles:</p>
            <p className="eb-text-lg eb-font-bold">Owners</p>
            <p>
              Please add <span className="eb-font-semibold">all owners</span>{' '}
              holding 25% or more of the business
            </p>

            <div className="eb-mt-4">
              <LearnMorePopoverTrigger
                content={
                  <div className="eb-space-y-3">
                    <h2 className="eb-font-header eb-text-xl eb-font-medium">
                      What is an owner?
                    </h2>
                    <p className="eb-pb-1 eb-text-sm">
                      An owner is an individual or entity that ultimately owns
                      at least part of a business, established through a chain
                      of ownership or by means of control other than direct
                      control.
                    </p>
                  </div>
                }
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className="eb-rounded-md eb-border hover:eb-bg-black/5"
                >
                  <InfoIcon /> Learn more
                </Button>
              </LearnMorePopoverTrigger>
            </div>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form>
            <OnboardingFormField
              control={form.control}
              disableFieldRuleMapping
              disabled={
                isFormDisabled ||
                controllerParty === undefined ||
                (activeOwners.length >= 4 &&
                  form.watch('controllerIsAnOwner') === 'no')
              }
              type="radio-group"
              name="controllerIsAnOwner"
              label={t('beneficialOwnerStepForm.controllerIsOwnerQuestion')}
              description=""
              tooltip=""
              options={[
                { value: 'yes', label: t('common:yes') },
                { value: 'no', label: t('common:no') },
              ]}
              noOptionalLabel
            />
            {sectionStatuses['personal-section'] !== 'done_editable' && (
              <div className="eb-mt-2 eb-flex eb-items-center">
                <p className="eb-flex eb-h-8 eb-items-center eb-text-sm eb-font-normal eb-text-orange-500">
                  {'\u24d8'}
                  {' Please complete the personal details first.'}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="eb-h-8"
                  onClick={() => {
                    goTo('personal-section', {
                      editingPartyId: controllerParty?.id,
                    });
                  }}
                >
                  Go now
                  <ArrowRightIcon />
                </Button>
              </div>
            )}
            {activeOwners.length >= 4 &&
              form.watch('controllerIsAnOwner') === 'no' &&
              controllerUpdateStatus !== 'pending' && (
                <p className="eb-mt-1 eb-text-sm eb-font-normal eb-text-blue-500">
                  {'\u24d8'}{' '}
                  {t('beneficialOwnerStepForm.controllerCannotBeOwnerWarning')}
                </p>
              )}
            <div className="eb-mt-2 eb-inline-flex eb-h-4 eb-items-center eb-justify-center eb-gap-2 eb-text-sm eb-text-muted-foreground">
              {controllerUpdateStatus === 'pending' && (
                <>
                  <Loader2Icon className="eb-pointer-events-none eb-size-4 eb-shrink-0 eb-animate-spin" />
                  <span>{t('beneficialOwnerStepForm.makingChanges')}</span>
                </>
              )}
            </div>
          </form>
        </Form>

        <div className="eb-space-y-4">
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="eb-w-full eb-text-lg"
            onClick={() => handleEditBeneficialOwner('')}
            disabled={isFormDisabled || activeOwners.length >= 4}
          >
            <PlusIcon /> Add Owner
          </Button>

          {ownersData.length >= 4 && (
            <p className="eb-mt-1 eb-text-sm eb-font-normal eb-text-orange-500">
              {'\u24d8'} {t('beneficialOwnerStepForm.maxOwnersWarning')}
            </p>
          )}

          {activeOwners.length === 0 && (
            <Card className="eb-mt-6 eb-p-4 eb-shadow-md">
              <div className="eb-flex eb-flex-col eb-items-center eb-space-y-3">
                <div className="eb-flex eb-h-8 eb-w-8 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary eb-stroke-white">
                  <UsersIcon className="eb-size-4 eb-fill-white eb-stroke-white" />
                </div>
                <p className="eb-text-sm">No stakeholders added yet.</p>
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
              <div className="eb-flex eb-gap-2 eb-pt-4">
                {!owner.roles?.includes('CONTROLLER') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="eb-hidden"
                    onClick={() =>
                      owner.id && deactivateBeneficialOwner(owner.id)
                    }
                  >
                    <TrashIcon />
                    Remove
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    owner.id && handleEditBeneficialOwner(owner.id)
                  }
                >
                  <PencilIcon />
                  Edit
                </Button>
              </div>
              {owner.id && !ownersValidation[owner.id]?.allStepsValid && (
                <p className="eb-mt-1 eb-text-sm eb-font-normal eb-text-orange-500">
                  {'\u24d8'} This individual is missing some details.
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div className="eb-mt-6 eb-space-y-6">
        <ServerErrorAlert
          error={controllerUpdateError || partyActiveUpdateError}
          className="eb-border-[#E52135] eb-bg-[#FFECEA]"
        />
        <div className="eb-flex eb-justify-between eb-gap-4">
          <Button
            type="button"
            variant="default"
            size="lg"
            className="eb-w-full eb-text-lg"
            onClick={() => {
              const controllerQuestionAnswered =
                form.getValues('controllerIsAnOwner') !== undefined;

              if (controllerQuestionAnswered) {
                updateSessionData({
                  isOwnersSectionDone: true,
                  mockedVerifyingSectionId: 'owners-section',
                });
              }

              if (reviewMode) {
                goBack({
                  reviewScreenOpenedSectionId: 'owners-section',
                });
              } else {
                goBack();
              }
            }}
            disabled={isFormDisabled}
          >
            {reviewMode
              ? 'Save and return to review'
              : 'Save and return to overview'}
          </Button>
        </div>
      </div>
    </StepLayout>
  );
};
