import { useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  Building2Icon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from 'lucide-react';
import { useForm, useFormState } from 'react-hook-form';

import {
  getSmbdoGetClientQueryKey,
  useUpdatePartyLegacy,
} from '@/api/generated/smbdo';
import { ClientResponse } from '@/api/generated/smbdo.schemas';
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
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { AlertDialog, Badge, Card, CardTitle } from '@/components/ui';
import {
  OnboardingFormField,
  StepLayout,
} from '@/core/OnboardingFlow/components';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useFlowUnsavedChangesSync } from '@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync';
import { getPartyName } from '@/core/OnboardingFlow/utils/dataUtils';

/** Roles used for nonprofit due diligence parties (not yet in generated schema). */
const CHARITABLE_DONOR_ROLE = 'CHARITABLE_DONOR' as const;
const WEALTH_CONTRIBUTOR_ROLE = 'WEALTH_CONTRIBUTOR' as const;

export const NonprofitDueDiligenceScreen = () => {
  const [openedRemoveDialog, setOpenedRemoveDialog] = useState<string | null>(
    null
  );

  const { clientData, onPostPartySettled: onPostPartyResponse } =
    useOnboardingContext();
  const { t } = useTranslationWithTokens(['onboarding-overview', 'common']);
  const queryClient = useQueryClient();

  const { originScreenId, goTo, sessionData, updateSessionData } =
    useFlowContext();

  const reviewMode = originScreenId === 'review-attest-section';

  const form = useForm({
    defaultValues: {
      hasCharitableDonors:
        sessionData.hasCharitableDonors === true
          ? 'yes'
          : sessionData.hasCharitableDonors === false
            ? 'no'
            : undefined,
      hasWealthContributors:
        sessionData.hasWealthContributors === true
          ? 'yes'
          : sessionData.hasWealthContributors === false
            ? 'no'
            : undefined,
    },
  });

  const { isDirty } = useFormState({ control: form.control });
  useFlowUnsavedChangesSync(isDirty);

  const {
    mutate: updatePartyActive,
    error: partyActiveUpdateError,
    status: partyActiveUpdateStatus,
  } = useUpdatePartyLegacy();

  // Filter parties by role
  const charitableDonors =
    clientData?.parties?.filter(
      (party) =>
        party.active &&
        party.partyType === 'ORGANIZATION' &&
        (party.roles as string[] | undefined)?.includes(CHARITABLE_DONOR_ROLE)
    ) || [];

  const wealthContributors =
    clientData?.parties?.filter(
      (party) =>
        party.active &&
        party.partyType === 'INDIVIDUAL' &&
        (party.roles as string[] | undefined)?.includes(WEALTH_CONTRIBUTOR_ROLE)
    ) || [];

  const hasCharitableDonorsValue = form.watch('hasCharitableDonors');
  const hasWealthContributorsValue = form.watch('hasWealthContributors');

  // Persist question answers to session
  const handleCharitableDonorsChange = (value: string) => {
    updateSessionData({ hasCharitableDonors: value === 'yes' });
  };

  const handleWealthContributorsChange = (value: string) => {
    updateSessionData({ hasWealthContributors: value === 'yes' });
  };

  const deactivateParty = (partyId: string) => {
    updatePartyActive(
      {
        partyId,
        data: { active: false },
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
                    return { ...party, ...response };
                  }
                  return party;
                }),
              })
            );
            setOpenedRemoveDialog(null);
            queryClient.invalidateQueries({ queryKey });
          }
        },
        onSettled: (data, error) => {
          onPostPartyResponse?.(data, error?.response?.data);
        },
      }
    );
  };

  const handleEditCharitableDonor = (partyId: string | null) => {
    if (partyId) {
      goTo('charitable-donor-stepper', {
        editingPartyId: partyId,
        shortLabelOverride: 'Edit donor',
      });
    } else {
      goTo('charitable-donor-stepper', {
        shortLabelOverride: 'Add donor',
      });
    }
  };

  const handleEditWealthContributor = (partyId: string | null) => {
    if (partyId) {
      goTo('wealth-contributor-stepper', {
        editingPartyId: partyId,
        shortLabelOverride: 'Edit contributor',
      });
    } else {
      goTo('wealth-contributor-stepper', {
        shortLabelOverride: 'Add contributor',
      });
    }
  };

  const isFormDisabled = partyActiveUpdateStatus === 'pending';

  return (
    <StepLayout
      title="Nonprofit Due Diligence"
      subTitle={
        <Button
          variant="link"
          onClick={() => goTo('overview')}
          className="eb-h-auto eb-gap-1 eb-p-0 eb-text-sm"
        >
          <ArrowLeftIcon className="eb-size-3.5" />
          Back to overview
        </Button>
      }
      description="Please provide information about your organization's significant donors and wealth contributors for compliance and due diligence purposes."
    >
      <div className="eb-mt-6 eb-flex-auto eb-space-y-8">
        {/* Question 1: Charitable Donors */}
        <Form {...form}>
          <form>
            <OnboardingFormField
              control={form.control}
              disableFieldRuleMapping
              disabled={isFormDisabled}
              type="radio-group"
              name="hasCharitableDonors"
              label="Do you have Other Charitable Organizations which are significant donors?"
              description=""
              tooltip=""
              options={[
                { value: 'yes', label: t('common:yes') },
                { value: 'no', label: t('common:no') },
              ]}
              noOptionalLabel
              onChange={(value) =>
                handleCharitableDonorsChange(value as string)
              }
            />
          </form>
        </Form>

        {hasCharitableDonorsValue === 'yes' && (
          <div className="eb-space-y-4">
            <h3 className="eb-font-header eb-text-lg eb-font-medium">
              Charitable Donor Organizations
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="eb-w-full eb-text-lg"
              onClick={() => handleEditCharitableDonor(null)}
              disabled={isFormDisabled}
            >
              <PlusIcon /> Add charitable donor organization
            </Button>

            {charitableDonors.length === 0 && (
              <Card className="eb-p-4 eb-shadow-md">
                <div className="eb-flex eb-flex-col eb-items-center eb-space-y-3">
                  <div className="eb-flex eb-h-8 eb-w-8 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary eb-stroke-white">
                    <Building2Icon className="eb-size-4 eb-fill-white eb-stroke-white" />
                  </div>
                  <p className="eb-text-sm">
                    No charitable donor organizations added yet.
                  </p>
                </div>
              </Card>
            )}

            {charitableDonors.map((donor) => (
              <Card
                key={donor.id}
                className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4"
              >
                <div className="eb-space-y-1">
                  <CardTitle className="eb-text-xl eb-font-bold eb-tracking-tight">
                    {donor.organizationDetails?.organizationName ||
                      'Unnamed Organization'}
                  </CardTitle>
                  <div className="eb-flex eb-gap-2 eb-pt-2">
                    <Badge
                      variant="outline"
                      className="eb-border-transparent eb-bg-[#EDF4FF] eb-text-[#355FA1]"
                    >
                      Charitable Donor
                    </Badge>
                  </div>
                </div>
                <div className="eb-flex eb-gap-2 eb-pt-4">
                  <AlertDialog
                    open={openedRemoveDialog === donor.id}
                    onOpenChange={(open) =>
                      setOpenedRemoveDialog(open ? (donor.id ?? null) : null)
                    }
                  >
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <TrashIcon /> Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="eb-component">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Remove charitable donor?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove{' '}
                          {donor.organizationDetails?.organizationName}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => donor.id && deactivateParty(donor.id)}
                        >
                          {partyActiveUpdateStatus === 'pending' && (
                            <Loader2Icon className="eb-size-4 eb-animate-spin" />
                          )}
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      donor.id && handleEditCharitableDonor(donor.id)
                    }
                  >
                    <PencilIcon /> Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Question 2: Wealth Contributors */}
        <Form {...form}>
          <form>
            <OnboardingFormField
              control={form.control}
              disableFieldRuleMapping
              disabled={isFormDisabled}
              type="radio-group"
              name="hasWealthContributors"
              label="Does your organization have any individuals who are significant source of wealth contributors (10% or greater)?"
              description=""
              tooltip=""
              options={[
                { value: 'yes', label: t('common:yes') },
                { value: 'no', label: t('common:no') },
              ]}
              noOptionalLabel
              onChange={(value) =>
                handleWealthContributorsChange(value as string)
              }
            />
          </form>
        </Form>

        {hasWealthContributorsValue === 'yes' && (
          <div className="eb-space-y-4">
            <h3 className="eb-font-header eb-text-lg eb-font-medium">
              Significant Wealth Contributors
            </h3>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="eb-w-full eb-text-lg"
              onClick={() => handleEditWealthContributor(null)}
              disabled={isFormDisabled}
            >
              <PlusIcon /> Add wealth contributor
            </Button>

            {wealthContributors.length === 0 && (
              <Card className="eb-p-4 eb-shadow-md">
                <div className="eb-flex eb-flex-col eb-items-center eb-space-y-3">
                  <div className="eb-flex eb-h-8 eb-w-8 eb-items-center eb-justify-center eb-rounded-full eb-bg-primary eb-stroke-white">
                    <UserIcon className="eb-size-4 eb-fill-white eb-stroke-white" />
                  </div>
                  <p className="eb-text-sm">
                    No wealth contributors added yet.
                  </p>
                </div>
              </Card>
            )}

            {wealthContributors.map((contributor) => (
              <Card
                key={contributor.id}
                className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4"
              >
                <div className="eb-space-y-1">
                  <CardTitle className="eb-text-xl eb-font-bold eb-tracking-tight">
                    {getPartyName(contributor)}
                  </CardTitle>
                  <div className="eb-flex eb-gap-2 eb-pt-2">
                    <Badge
                      variant="outline"
                      className="eb-border-transparent eb-bg-[#FFEBD9] eb-text-[#8F521F]"
                    >
                      Wealth Contributor
                    </Badge>
                  </div>
                </div>
                <div className="eb-flex eb-gap-2 eb-pt-4">
                  <AlertDialog
                    open={openedRemoveDialog === contributor.id}
                    onOpenChange={(open) =>
                      setOpenedRemoveDialog(
                        open ? (contributor.id ?? null) : null
                      )
                    }
                  >
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <TrashIcon /> Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="eb-component">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Remove wealth contributor?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove{' '}
                          {getPartyName(contributor)}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            contributor.id && deactivateParty(contributor.id)
                          }
                        >
                          {partyActiveUpdateStatus === 'pending' && (
                            <Loader2Icon className="eb-size-4 eb-animate-spin" />
                          )}
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      contributor.id &&
                      handleEditWealthContributor(contributor.id)
                    }
                  >
                    <PencilIcon /> Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="eb-mt-6 eb-space-y-6">
        <ServerErrorAlert error={partyActiveUpdateError} />
        <div className="eb-flex eb-justify-between eb-gap-4">
          <Button
            type="button"
            variant="default"
            size="lg"
            className="eb-h-auto eb-min-h-11 eb-w-full eb-text-wrap eb-text-lg"
            onClick={() => {
              updateSessionData({
                isNonprofitDueDiligenceDone: true,
              });

              if (reviewMode) {
                goTo('review-attest-section', {
                  reviewScreenOpenedSectionId:
                    'nonprofit-due-diligence-section',
                });
              } else {
                goTo('additional-questions-section');
              }
            }}
            disabled={isFormDisabled}
          >
            {reviewMode ? 'Save and return to review' : 'Save and continue'}
          </Button>
        </div>
      </div>
    </StepLayout>
  );
};
