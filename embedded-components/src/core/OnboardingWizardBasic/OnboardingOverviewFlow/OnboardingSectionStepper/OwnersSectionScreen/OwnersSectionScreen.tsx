import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { InfoIcon, Loader2Icon, PlusIcon, UsersIcon } from 'lucide-react';
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
import { Card, CardContent } from '@/components/ui';
import { OnboardingFormField } from '@/core/OnboardingWizardBasic/OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '@/core/OnboardingWizardBasic/ServerErrorAlert/ServerErrorAlert';

import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { GlobalStepper } from '../../OnboardingGlobalStepper';
import { overviewSections } from '../../overviewSectionsConfig';
import { StepLayout } from '../../StepLayout/StepLayout';

export const OwnersSectionScreen = () => {
  const { clientData, onPostPartyResponse } = useOnboardingOverviewContext();
  const { t } = useTranslation(['onboarding', 'common']);
  const queryClient = useQueryClient();
  const globalStepper = GlobalStepper.useStepper();
  const controllerParty = clientData?.parties?.find(
    (party) =>
      party?.partyType === 'INDIVIDUAL' &&
      party?.roles?.includes('CONTROLLER') &&
      party.active
  );

  const form = useForm({
    defaultValues: {
      controllerIsAnOwner: controllerParty
        ? controllerParty.roles?.includes('BENEFICIAL_OWNER')
          ? 'yes'
          : 'no'
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

  const handleEditBeneficialOwner = (beneficialOwnerId: string) => {
    if (clientData) {
      globalStepper.setMetadata('section-stepper', {
        correspondingParty: {
          id: beneficialOwnerId,
        },
        originStepId: 'owners',
        id: beneficialOwnerId || 'new-party',
        completed: !!beneficialOwnerId,
        steps: overviewSections.find((section) => section.id === 'personal')
          ?.steps,
      });
      globalStepper.goTo('section-stepper');
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

  const activeOwners = ownersData.filter(
    (owner) => owner.active || owner.status === 'ACTIVE'
  );

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
            <p className="eb-mb-2">Organization roles:</p>
            <p className="eb-font-medium">Owners</p>
            <p>Please add all owners holding 25% or more of the business.</p>
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form>
            <OnboardingFormField
              control={form.control}
              disableFieldRuleMapping
              disabled={
                isFormDisabled ||
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
            {activeOwners.length >= 4 &&
              form.watch('controllerIsAnOwner') === 'no' &&
              controllerUpdateStatus !== 'pending' && (
                <p className="eb-text[0.8rem] eb-mt-1 eb-text-sm eb-font-normal eb-text-blue-500">
                  {'\u24d8'}{' '}
                  {t('beneficialOwnerStepForm.controllerCannotBeOwnerWarning')}
                </p>
              )}
            {controllerUpdateStatus === 'pending' && (
              <div className="eb-mt-2 eb-inline-flex eb-items-center eb-justify-center eb-gap-2 eb-text-sm eb-text-muted-foreground">
                <Loader2Icon className="eb-pointer-events-none eb-size-4 eb-shrink-0 eb-animate-spin" />
                <span>{t('beneficialOwnerStepForm.makingChanges')}</span>
              </div>
            )}
          </form>
        </Form>

        <div className="eb-space-y-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="eb-w-full eb-text-lg"
            onClick={() => handleEditBeneficialOwner('')}
          >
            <PlusIcon /> Add Owner
          </Button>

          <Card className="eb-mt-6 eb-p-4 eb-shadow-md">
            <div className="eb-flex eb-flex-col eb-items-center eb-space-y-3">
              <div className="eb-flex eb-h-8 eb-w-8 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary eb-stroke-white">
                <UsersIcon className="eb-size-4 eb-fill-white eb-stroke-white" />
              </div>
              <p className="eb-text-sm">No stakeholders added yet.</p>
            </div>
          </Card>
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
              globalStepper.setMetadata('overview', {
                ...globalStepper.getMetadata('overview'),
                justCompleted: globalStepper.current.id,
              });
              globalStepper.goTo('overview');
            }}
          >
            Save and return to overview
          </Button>
        </div>
      </div>
    </StepLayout>
  );
};
