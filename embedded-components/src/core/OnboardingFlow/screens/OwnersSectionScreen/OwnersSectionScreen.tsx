import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightIcon,
  InfoIcon,
  Loader2Icon,
  MenuIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';

import {
  getSmbdoGetClientQueryKey,
  useUpdatePartyLegacy,
} from '@/api/generated/smbdo';
import { ClientResponse, Role } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { LearnMorePopoverTrigger } from '@/components/LearnMorePopover';
import { AlertDialog, Badge, Card, CardTitle } from '@/components/ui';
import {
  OnboardingFormField,
  ServerErrorAlert,
  StepLayout,
} from '@/core/OnboardingFlow/components';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { getPartyName } from '@/core/OnboardingFlow/utils/dataUtils';
import {
  getFlowProgress,
  getStepperValidations,
} from '@/core/OnboardingFlow/utils/flowUtils';

export const OwnersSectionScreen = () => {
  const [openedRemoveDialog, setOpenedRemoveDialog] = useState(false);

  const {
    clientData,
    onPostPartySettled: onPostPartyResponse,
    organizationType,
  } = useOnboardingContext();
  const { t } = useTranslation(['onboarding-overview', 'common']);
  const queryClient = useQueryClient();

  const controllerParty = clientData?.parties?.find(
    (party) =>
      party?.partyType === 'INDIVIDUAL' &&
      party?.roles?.includes('CONTROLLER') &&
      party.active
  );

  const {
    originScreenId,
    currentScreenId,
    goTo,
    staticScreens,
    sections,
    sessionData,
    updateSessionData,
    savedFormValues,
  } = useFlowContext();

  const { sectionStatuses } = getFlowProgress(
    sections,
    sessionData,
    clientData,
    savedFormValues,
    currentScreenId
  );

  const reviewMode = originScreenId === 'review-attest-section';

  const form = useForm({
    defaultValues: {
      controllerIsAnOwner: controllerParty
        ? controllerParty.roles?.includes('BENEFICIAL_OWNER')
          ? 'yes'
          : sessionData.isControllerOwnerQuestionAnswered
            ? 'no'
            : undefined
        : undefined,
    },
  });

  const {
    mutate: updateController,
    error: controllerUpdateError,
    status: controllerUpdateStatus,
  } = useUpdatePartyLegacy();

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
                        roles,
                      };
                    }
                    return party;
                  }),
                })
              );
              queryClient.invalidateQueries({
                queryKey: getSmbdoGetClientQueryKey(clientData.id),
              });
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

    if (!sessionData.isControllerOwnerQuestionAnswered) {
      updateSessionData({
        isControllerOwnerQuestionAnswered: true,
      });
    }
  }, [form.watch('controllerIsAnOwner')]);

  // use to update party active status
  const {
    mutate: updatePartyActive,
    error: partyActiveUpdateError,
    status: partyActiveUpdateStatus,
  } = useUpdatePartyLegacy();

  const ownersData =
    clientData?.parties?.filter(
      (party) =>
        party?.partyType === 'INDIVIDUAL' &&
        party?.roles?.includes('BENEFICIAL_OWNER')
    ) || [];

  const activeOwners = ownersData.filter(
    (owner) => owner.active || owner.status === 'ACTIVE'
  );

  const ownerSteps =
    staticScreens.find((screen) => screen.id === 'owner-stepper')?.stepperConfig
      ?.steps || [];

  const ownersValidation = getStepperValidations(
    ownerSteps,
    activeOwners,
    clientData,
    savedFormValues,
    'owner-stepper'
  );

  const handleEditBeneficialOwner = (beneficialOwnerId: string | null) => {
    if (beneficialOwnerId) {
      const firstInvalidStep = ownersValidation[beneficialOwnerId]
        ? ownerSteps.find((step) => {
            return (
              ownersValidation[beneficialOwnerId].stepValidationMap[step.id] &&
              !ownersValidation[beneficialOwnerId].stepValidationMap[step.id]
                .isValid
            );
          })?.id
        : undefined;

      goTo('owner-stepper', {
        editingPartyId: beneficialOwnerId,
        previouslyCompleted: ownersValidation[beneficialOwnerId].allStepsValid,
        shortLabelOverride: 'Edit owner',
        initialStepperStepId: firstInvalidStep,
      });
    } else {
      goTo('owner-stepper', {
        shortLabelOverride: 'Add owner',
      });
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
            setOpenedRemoveDialog(false);
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
      title={
        <div className="eb-flex eb-flex-1 eb-items-center eb-justify-between eb-gap-4">
          <span>{t('screens.owners.title')}</span>
          <Button variant="outline" size="sm" onClick={() => goTo('overview')}>
            {t('screens.owners.overviewButtonLabel')}
            <MenuIcon />
          </Button>
        </div>
      }
      description="Provide information for owners and senior managers for your company. Keep in mind that individual people may have multiple roles."
    >
      <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
        <Alert variant="informative">
          <InfoIcon className="eb-h-4 eb-w-4" />
          <AlertDescription className="eb-flex eb-flex-col">
            <p className="eb-mb-2 eb-text-sm eb-font-semibold">
              {t('screens.owners.infoAlert.header', { organizationType })}
            </p>
            <div className="eb-flex eb-items-center eb-space-x-2">
              <span className="eb-text-lg eb-font-bold">
                {t('screens.owners.infoAlert.title')}
              </span>
              <LearnMorePopoverTrigger
                content={
                  <div className="eb-space-y-3">
                    <h2 className="eb-font-header eb-text-xl eb-font-medium">
                      {t('screens.owners.tooltip.title')}
                    </h2>
                    <p className="eb-pb-1 eb-text-sm">
                      {t('screens.owners.tooltip.description')}
                    </p>
                  </div>
                }
              >
                <Button variant="ghost" size="icon">
                  <InfoIcon className="eb-size-6 eb-stroke-primary" />
                </Button>
              </LearnMorePopoverTrigger>
            </div>
            <p>
              <Trans
                t={t}
                i18nKey="screens.owners.infoAlert.pleaseAddAllOwners"
              />
            </p>
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
              label={t('screens.owners.controllerIsOwnerQuestion')}
              description=""
              tooltip=""
              options={[
                { value: 'yes', label: t('common:yes') },
                { value: 'no', label: t('common:no') },
              ]}
              noOptionalLabel
            />
            {sectionStatuses['personal-section'] !== 'completed' && (
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
                  {t('screens.owners.goNowButton')}
                  <ArrowRightIcon />
                </Button>
              </div>
            )}
            {activeOwners.length >= 4 &&
              form.watch('controllerIsAnOwner') === 'no' &&
              controllerUpdateStatus !== 'pending' && (
                <p className="eb-mt-1 eb-text-sm eb-font-normal eb-text-blue-500">
                  {`\u24d8 ${t('screens.owners.controllerCannotBeOwnerWarning')}`}
                </p>
              )}
            <div className="eb-mt-2 eb-inline-flex eb-h-4 eb-items-center eb-justify-center eb-gap-2 eb-text-sm eb-text-muted-foreground">
              {controllerUpdateStatus === 'pending' && (
                <>
                  <Loader2Icon className="eb-pointer-events-none eb-size-4 eb-shrink-0 eb-animate-spin" />
                  <span>{t('screens.owners.makingChanges')}</span>
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
            <PlusIcon /> {t('screens.owners.addOwnerButton')}
          </Button>

          {ownersData.length >= 4 && (
            <p className="eb-mt-1 eb-text-sm eb-font-normal eb-text-orange-500">
              {`\u24d8 ${t('screens.owners.maxOwnersWarning')}`}
            </p>
          )}

          {activeOwners.length === 0 && (
            <Card className="eb-mt-6 eb-p-4 eb-shadow-md">
              <div className="eb-flex eb-flex-col eb-items-center eb-space-y-3">
                <div className="eb-flex eb-h-8 eb-w-8 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary eb-stroke-white">
                  <UsersIcon className="eb-size-4 eb-fill-white eb-stroke-white" />
                </div>
                <p className="eb-text-sm">
                  {t('screens.owners.noStakeholdersAdded')}
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
                  {getPartyName(owner)}
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
                    {t('screens.owners.badges.owner')}
                  </Badge>
                  {owner.roles?.includes('CONTROLLER') && (
                    <Badge
                      variant="outline"
                      className="eb-border-transparent eb-bg-[#FFEBD9] eb-text-[#8F521F]"
                    >
                      {t('screens.owners.badges.controller')}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="eb-flex eb-gap-2 eb-pt-4">
                {!owner.roles?.includes('CONTROLLER') && (
                  <AlertDialog
                    open={openedRemoveDialog}
                    onOpenChange={setOpenedRemoveDialog}
                  >
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <TrashIcon />
                        {t('screens.owners.removeOwnerButton')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="eb-component">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t('screens.owners.removeOwnerDialog.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          <Trans
                            t={t}
                            i18nKey="screens.owners.removeOwnerDialog.description"
                            tOptions={{
                              owner: getPartyName(owner),
                            }}
                          />
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>
                          {t('screens.owners.removeOwnerDialog.cancelButton')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            owner.id && deactivateBeneficialOwner(owner.id)
                          }
                        >
                          {partyActiveUpdateStatus === 'pending' && (
                            <Loader2Icon className="eb-size-4 eb-animate-spin" />
                          )}
                          {t('screens.owners.removeOwnerDialog.confirmButton')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    owner.id && handleEditBeneficialOwner(owner.id)
                  }
                >
                  <PencilIcon />
                  {t('screens.owners.editOwnerButton')}
                </Button>
              </div>
              {owner.id && !ownersValidation[owner.id]?.allStepsValid && (
                <p className="eb-mt-1 eb-text-sm eb-font-normal eb-text-orange-500">
                  {`\u24d8 ${t('screens.owners.ownerIncompleteWarning')}`}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div className="eb-mt-6 eb-space-y-6">
        <ServerErrorAlert
          error={controllerUpdateError || partyActiveUpdateError}
        />
        <div className="eb-flex eb-justify-between eb-gap-4">
          <Button
            type="button"
            variant="default"
            size="lg"
            className="eb-h-auto eb-min-h-11 eb-w-full eb-text-wrap eb-text-lg"
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
                goTo('review-attest-section', {
                  reviewScreenOpenedSectionId: 'owners-section',
                });
              } else {
                goTo('additional-questions-section');
              }
            }}
            disabled={isFormDisabled}
          >
            {reviewMode
              ? t('screens.owners.saveAndReturnToReviewButton')
              : t('screens.owners.saveAndContinueButton')}
          </Button>
        </div>
      </div>
    </StepLayout>
  );
};
