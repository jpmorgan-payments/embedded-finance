/**
 * BusinessOwnerStepForm Component
 * ==============================
 * Form component for managing business owners during the onboarding process.
 *
 * Table of Contents:
 * -----------------
 * 1. Imports & Dependencies (1-40)
 * 2. Types & Interfaces (40-50)
 * 3. Main Component (50-723)
 *    - Hook Initialization (50-70)
 *    - Data Fetching & Context (70-90)
 *    - Form Configuration (90-120)
 *    - Field Arrays Setup (120-150)
 *    - Event Handlers (150-250)
 *      + Edit Business Owner
 *      + Add Business Owner
 *      + Delete Business Owner
 *      + Form Submission
 *    - Form Fields & UI (250+)
 *      + Business Owner Cards
 *        - Name Display
 *        - Job Title
 *        - Edit/Delete Actions
 *      + Business Owner Form Dialog
 *        - Personal Information
 *          * First Name
 *          * Last Name
 *          * Job Title
 *          * Date of Birth
 *        - Contact Information
 *          * Email
 *          * Phone Number
 *        - Address Information
 *          * Multiple Addresses Support
 *          * Address Type
 *          * Street Address
 *          * City/State/ZIP
 *        - Identification
 *          * Multiple IDs Support
 *          * ID Type
 *          * ID Number
 *
 * @component
 * @example
 * return (
 *   <BusinessOwnerStepForm />
 * )
 */

import React, { useEffect, useState } from 'react';
import { AccordionContent } from '@radix-ui/react-accordion';
import {
  ArchiveRestoreIcon,
  EditIcon,
  Loader2Icon,
  TrashIcon,
  UserPlusIcon,
  XIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  useSmbdoGetClient,
  useSmbdoUpdateClient,
  useUpdateParty as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import { Role } from '@/api/generated/smbdo.schemas';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useStepper } from '@/components/ui/stepper';
import { Badge } from '@/components/ui';

import { FormActions } from '../FormActions/FormActions';
import { IndividualStepFormSchema } from '../IndividualStepForm/IndividualStepForm.schema';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { OnboardingArrayField } from '../OnboardingFormField/OnboardingArrayField';
import { OnboardingFormField } from '../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import { COUNTRIES_OF_FORMATION } from '../utils/COUNTRIES_OF_FORMATION';
import {
  convertClientResponseToFormValues,
  generateClientRequestBody,
  generatePartyRequestBody,
  mapClientApiErrorsToFormErrors,
  mapPartyApiErrorsToFormErrors,
  setApiFormErrors,
  shapeFormValuesBySchema,
  useStepFormWithFilters,
} from '../utils/formUtils';
import { stateOptions } from '../utils/stateOptions';

export const BeneficialOwnerStepForm = () => {
  const { nextStep } = useStepper();
  const { clientId, onPostClientResponse, onPostPartyResponse } =
    useOnboardingContext();
  const { t } = useTranslation(['onboarding', 'common']);

  // TODO: move this state to context to prevent re-render when resizing
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentBeneficialOwnerId, setCurrentBeneficialOwnerId] =
    useState<string>('');

  const { data: clientData, refetch: refetchClientData } = useSmbdoGetClient(
    clientId ?? ''
  );

  const [isClientDataRefetching, setIsClientDataRefetching] = useState(false);

  const ownerForm = useStepFormWithFilters({
    clientData,
    schema: IndividualStepFormSchema,
    defaultValues: {},
  });

  const controllerParty = clientData?.parties?.find(
    (party) =>
      party?.partyType === 'INDIVIDUAL' &&
      party?.roles?.includes('CONTROLLER') &&
      (party.active || party.status === 'ACTIVE')
  );

  const controllerForm = useForm({
    defaultValues: {
      controllerIsOwner: controllerParty?.roles?.includes('BENEFICIAL_OWNER')
        ? 'yes'
        : 'no',
    },
  });

  const {
    mutate: updateController,
    error: controllerUpdateError,
    status: controllerUpdateStatus,
  } = useSmbdoUpdateParty();

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
          onSuccess: () => {
            refetchClientData();
          },
          onError: (error) => {
            controllerForm.setValue(
              'controllerIsOwner',
              controllerParty?.roles?.includes('BENEFICIAL_OWNER')
                ? 'yes'
                : 'no'
            );
            controllerForm.setError('controllerIsOwner', {
              type: 'server',
              message: error?.response?.data?.context?.[0]?.message,
            });
          },
        }
      );
    };

    if (
      controllerForm.watch('controllerIsOwner') === 'yes' &&
      controllerParty?.id &&
      controllerParty?.roles &&
      !controllerParty.roles.includes('BENEFICIAL_OWNER')
    ) {
      updateControllerRoles(controllerParty.id, [
        ...controllerParty.roles,
        'BENEFICIAL_OWNER',
      ]);
    } else if (
      controllerForm.watch('controllerIsOwner') === 'no' &&
      controllerParty?.id &&
      controllerParty?.roles &&
      controllerParty.roles.includes('BENEFICIAL_OWNER')
    ) {
      updateControllerRoles(controllerParty.id, [
        ...controllerParty.roles.filter((role) => role !== 'BENEFICIAL_OWNER'),
      ]);
    }
  }, [controllerForm.watch('controllerIsOwner')]);

  const ownersData =
    clientData?.parties?.filter(
      (party) =>
        party?.partyType === 'INDIVIDUAL' &&
        party?.roles?.includes('BENEFICIAL_OWNER')
    ) || [];

  // Used for adding a party to the client
  const {
    mutate: updateClient,
    error: clientUpdateError,
    status: clientUpdateStatus,
    reset: resetUpdateClient,
  } = useSmbdoUpdateClient();

  // Used for updating party details
  const {
    mutate: updateParty,
    error: partyUpdateError,
    status: partyUpdateStatus,
    reset: resetUpdateParty,
  } = useSmbdoUpdateParty();

  const handleEditBeneficialOwner = (beneficialOwnerId: string) => {
    if (clientData) {
      setCurrentBeneficialOwnerId(beneficialOwnerId);
      const formValues = convertClientResponseToFormValues(
        clientData,
        beneficialOwnerId
      );
      ownerForm.reset(
        shapeFormValuesBySchema(formValues, IndividualStepFormSchema)
      );
      setIsDialogOpen(true);
    }
  };

  const handleAddBeneficialOwner = () => {
    setCurrentBeneficialOwnerId('');
    ownerForm.reset(shapeFormValuesBySchema({}, IndividualStepFormSchema));
    setIsDialogOpen(true);
  };

  // Used for updating party details
  const {
    mutate: updatePartyActive,
    error: partyActiveUpdateError,
    status: partyActiveUpdateStatus,
  } = useSmbdoUpdateParty();

  const handleDeactivateBeneficialOwner = (beneficialOwnerId: string) => {
    setCurrentBeneficialOwnerId(beneficialOwnerId);
    updatePartyActive(
      {
        partyId: beneficialOwnerId,
        data: {
          active: false,
        },
      },
      {
        onSuccess: () => {
          toast.success('Beneficial owner removed successfully');
          setIsClientDataRefetching(true);
          refetchClientData().then(() => {
            setIsClientDataRefetching(false);
          });
        },
      }
    );
  };

  const handleRestoreBeneficialOwner = (beneficialOwnerId: string) => {
    setCurrentBeneficialOwnerId(beneficialOwnerId);
    updatePartyActive(
      {
        partyId: beneficialOwnerId,
        data: {
          active: true,
        },
      },
      {
        onSuccess: () => {
          toast.success('Beneficial owner restored successfully');
          setIsClientDataRefetching(true);
          refetchClientData().then(() => {
            setIsClientDataRefetching(false);
          });
        },
      }
    );
  };

  const onOwnerFormSubmit = ownerForm.handleSubmit((values) => {
    if (clientId) {
      // Update party for beneficial owner being edited
      if (currentBeneficialOwnerId) {
        const partyRequestBody = generatePartyRequestBody(values, {});
        updateParty(
          {
            partyId: currentBeneficialOwnerId,
            data: partyRequestBody,
          },
          {
            onSettled: (data, error) => {
              onPostPartyResponse?.(data, error?.response?.data);
            },
            onSuccess: () => {
              toast.success('Beneficial owner details updated successfully');
              setIsDialogOpen(false);
              setCurrentBeneficialOwnerId('');
              setIsClientDataRefetching(true);
              refetchClientData().then(() => {
                setIsClientDataRefetching(false);
              });
            },
            onError: (error) => {
              if (error.response?.data?.context) {
                const { context } = error.response.data;
                const apiFormErrors = mapPartyApiErrorsToFormErrors(context);
                setApiFormErrors(ownerForm, apiFormErrors);
              }
            },
          }
        );
      } else {
        const requestBody = generateClientRequestBody(values, 0, 'addParties', {
          addParties: [
            {
              partyType: 'INDIVIDUAL',
              roles: ['BENEFICIAL_OWNER'],
            },
          ],
        });
        updateClient(
          {
            id: clientId,
            data: requestBody,
          },
          {
            onSettled: (data, error) => {
              onPostClientResponse?.(data, error?.response?.data);
            },
            onSuccess: () => {
              toast.success('Beneficial owner details updated successfully');
              setIsDialogOpen(false);
              setCurrentBeneficialOwnerId('');
              setIsClientDataRefetching(true);
              refetchClientData().then(() => {
                setIsClientDataRefetching(false);
              });
            },
            onError: (error) => {
              if (error.response?.data?.context) {
                const { context } = error.response.data;
                const apiFormErrors = mapClientApiErrorsToFormErrors(
                  context,
                  0,
                  'addParties'
                );
                setApiFormErrors(ownerForm, apiFormErrors);
              }
            },
          }
        );
      }
    }
  });

  const activeOwners = ownersData.filter(
    (owner) => owner.active || owner.status === 'ACTIVE'
  );
  const inactiveOwners = ownersData.filter(
    (owner) => !owner.active && owner.status !== 'ACTIVE'
  );

  // Get mask format based on ID type
  const getMaskFormat = (idType: string) => {
    switch (idType) {
      case 'SSN':
        return '### - ## - ####';
      case 'ITIN':
        return '### - ## - ####';
      default:
        return undefined;
    }
  };

  // Get label for value field based on ID type
  const getValueLabel = (
    idType:
      | 'SSN'
      | 'ITIN'
      | 'NATIONAL_ID'
      | 'DRIVERS_LICENSE'
      | 'PASSPORT'
      | 'SOCIAL_INSURANCE_NUMBER'
      | 'OTHER_GOVERNMENT_ID'
  ) => {
    if (!idType) return t('idValueLabels.placeholder');
    return t(`idValueLabels.individual.${idType}`);
  };

  // Reset value of ID value field when ID type changes
  useEffect(() => {
    const subscription = ownerForm.watch((_, { name }) => {
      if (name?.startsWith('individualIds') && name.endsWith('idType')) {
        const index = parseInt(name.split('.')[1], 10);
        ownerForm.setValue(`individualIds.${index}.value`, '');
      }
    });
    return () => subscription.unsubscribe();
  }, [ownerForm.watch]);

  const form = useForm({
    defaultValues: {},
  });

  const handleFormSubmit = form.handleSubmit(() => {
    nextStep();
    toast.success("Client's beneficial owners updated successfully");
  });

  const isFormDisabled =
    controllerUpdateStatus === 'pending' ||
    partyActiveUpdateStatus === 'pending' ||
    isClientDataRefetching ||
    isDialogOpen;

  const isOwnerFormSubmitting =
    partyUpdateStatus === 'pending' || clientUpdateStatus === 'pending';

  const ownerFormId = React.useId();

  return (
    <div className="eb-grid eb-w-full eb-items-start eb-gap-6 eb-overflow-auto eb-p-1">
      <Form {...controllerForm}>
        <form>
          <OnboardingFormField
            control={controllerForm.control}
            disableFieldRuleMapping
            disabled={
              isFormDisabled ||
              (activeOwners.length >= 4 &&
                controllerForm.watch('controllerIsOwner') === 'no')
            }
            type="radio-group"
            name="controllerIsOwner"
            label="Do you, the controller, own 25% or more of the business?"
            description=""
            tooltip=""
            options={[
              { value: 'yes', label: t('common:yes') },
              { value: 'no', label: t('common:no') },
            ]}
            required
          />
          {activeOwners.length >= 4 &&
            controllerForm.watch('controllerIsOwner') === 'no' &&
            controllerUpdateStatus !== 'pending' && (
              <p className="eb-text[0.8rem] eb-mt-1 eb-text-sm eb-font-normal eb-text-blue-500">
                {'\u24d8'} You cannot set yourself as an owner since you can
                only add up to 4 beneficial owners.
              </p>
            )}
          {controllerUpdateStatus === 'pending' && (
            <div className="eb-mt-2 eb-inline-flex eb-items-center eb-justify-center eb-gap-2 eb-text-sm eb-text-muted-foreground">
              <Loader2Icon className="eb-pointer-events-none eb-size-4 eb-shrink-0 eb-animate-spin" />
              <span>Making changes...</span>
            </div>
          )}
        </form>
      </Form>

      <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
        <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
          Beneficial Owners
        </legend>
        {activeOwners.map((owner) => (
          <Card key={owner.id}>
            <CardHeader>
              <CardTitle>{`${owner?.individualDetails?.firstName} ${owner?.individualDetails?.lastName}`}</CardTitle>
              <div className="eb-flex eb-gap-2 eb-pt-2">
                <Badge variant="secondary">Owner</Badge>
                {owner.roles?.includes('CONTROLLER') ? (
                  <Badge>Controller</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="eb-space-y-4 eb-leading-snug">
              <div>
                {owner?.individualDetails?.jobTitle ? (
                  <p>
                    Job title:{' '}
                    <span className="eb-font-semibold">
                      {owner.individualDetails.jobTitle}
                    </span>
                  </p>
                ) : null}
                {owner?.individualDetails?.natureOfOwnership ? (
                  <p>
                    Nature of ownership:{' '}
                    <span className="eb-font-semibold">
                      {owner.individualDetails.natureOfOwnership}
                    </span>
                  </p>
                ) : null}
              </div>
              <div className="eb-space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isFormDisabled}
                  onClick={() =>
                    owner?.id && handleEditBeneficialOwner(owner.id)
                  }
                >
                  <EditIcon />
                  Edit
                </Button>
                {!owner.roles?.includes('CONTROLLER') ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isFormDisabled}
                    onClick={() =>
                      owner?.id && handleDeactivateBeneficialOwner(owner.id)
                    }
                  >
                    {currentBeneficialOwnerId === owner.id &&
                    (partyActiveUpdateStatus === 'pending' ||
                      isClientDataRefetching) ? (
                      <Loader2Icon className="eb-animate-spin" />
                    ) : (
                      <TrashIcon />
                    )}
                    Remove
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="eb-w-full">
          <Button
            className="eb-flex eb-w-full eb-cursor-pointer eb-items-center eb-justify-center"
            disabled={isFormDisabled || ownersData.length >= 4}
            onClick={handleAddBeneficialOwner}
          >
            <UserPlusIcon />
            Add Beneficial Owner
          </Button>
          {ownersData.length >= 4 && (
            <p className="eb-text[0.8rem] eb-mt-1 eb-text-sm eb-font-normal eb-text-blue-500">
              {'\u24d8'} You can only add up to 4 beneficial owners.
            </p>
          )}
        </div>
      </fieldset>

      {inactiveOwners.length > 0 && (
        <Accordion type="single" collapsible>
          <AccordionItem
            value="inactive-owners"
            className="eb-rounded eb-border"
          >
            <AccordionTrigger className="eb-px-4">
              Inactive Owners ({inactiveOwners.length})
            </AccordionTrigger>
            <AccordionContent className="eb-grid eb-grid-cols-1 eb-gap-6 eb-px-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
              {ownersData
                .filter((owner) => !owner.active)
                .map((owner) => (
                  <Card key={owner.id} className="eb-mb-4">
                    <CardHeader>
                      <CardTitle>{`${owner?.individualDetails?.firstName} ${owner?.individualDetails?.lastName}`}</CardTitle>
                    </CardHeader>
                    <CardContent className="eb-space-y-4 eb-leading-snug">
                      <div>
                        {owner?.individualDetails?.jobTitle ? (
                          <p>
                            Job title:{' '}
                            <span className="eb-font-semibold">
                              {owner.individualDetails.jobTitle}
                            </span>
                          </p>
                        ) : null}
                        {owner?.individualDetails?.natureOfOwnership ? (
                          <p>
                            Nature of ownership:{' '}
                            <span className="eb-font-semibold">
                              {owner.individualDetails.natureOfOwnership}
                            </span>
                          </p>
                        ) : null}
                      </div>
                      <div className="eb-mt-4 eb-space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isFormDisabled}
                          onClick={() =>
                            owner?.id && handleRestoreBeneficialOwner(owner.id)
                          }
                        >
                          {currentBeneficialOwnerId === owner.id &&
                          (partyActiveUpdateStatus === 'pending' ||
                            isClientDataRefetching) ? (
                            <Loader2Icon className="eb-animate-spin" />
                          ) : (
                            <ArchiveRestoreIcon />
                          )}
                          Restore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <ServerErrorAlert
        error={controllerUpdateError || partyActiveUpdateError}
      />

      <Form {...form}>
        <form className="eb-space-y-6" onSubmit={handleFormSubmit}>
          <FormActions disabled={isFormDisabled} />
        </form>
      </Form>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(opened) => {
          if (!isOwnerFormSubmitting) {
            setIsDialogOpen(opened);
            if (!opened) {
              setCurrentBeneficialOwnerId('');
              resetUpdateClient();
              resetUpdateParty();
            }
          }
        }}
      >
        <Form {...ownerForm}>
          <form id={ownerFormId} onSubmit={onOwnerFormSubmit}>
            <DialogContent
              className="eb-max-h-full eb-gap-0 eb-px-0 eb-pb-2 eb-pt-4 sm:eb-max-h-[98%] md:eb-max-w-screen-sm lg:eb-max-w-screen-md xl:eb-max-w-screen-lg"
              onInteractOutside={(e) => {
                e.preventDefault();
              }}
            >
              <DialogHeader className="eb-border-b eb-px-6 eb-pb-4">
                <DialogTitle>
                  {currentBeneficialOwnerId
                    ? 'Edit Beneficial Owner'
                    : 'Add Beneficial Owner'}
                </DialogTitle>
                <DialogDescription>
                  {currentBeneficialOwnerId
                    ? t('beneficialOwnerDialogDescriptionEdit')
                    : t('beneficialOwnerDialogDescriptionAdd')}
                </DialogDescription>
              </DialogHeader>

              <div className="eb-flex-1 eb-space-y-6 eb-overflow-y-auto eb-p-6">
                <fieldset
                  disabled={isOwnerFormSubmitting}
                  className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
                >
                  <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                    General
                  </legend>
                  <OnboardingFormField
                    control={ownerForm.control}
                    name="firstName"
                    type="text"
                  />
                  <OnboardingFormField
                    control={ownerForm.control}
                    name="middleName"
                    type="text"
                  />
                  <OnboardingFormField
                    control={ownerForm.control}
                    name="lastName"
                    type="text"
                  />
                  <OnboardingFormField
                    control={ownerForm.control}
                    name="birthDate"
                    type="date"
                  />
                  <OnboardingFormField
                    control={ownerForm.control}
                    name="countryOfResidence"
                    type="combobox"
                    options={COUNTRIES_OF_FORMATION.map((code) => ({
                      value: code,
                      label: (
                        <span>
                          <span className="eb-font-medium">[{code}]</span>{' '}
                          {t([
                            `common:countries.${code}`,
                          ] as unknown as TemplateStringsArray)}
                        </span>
                      ),
                    }))}
                  />
                  <OnboardingFormField
                    control={ownerForm.control}
                    name="jobTitle"
                    type="select"
                    options={[
                      { value: 'CEO', label: t('jobTitles.CEO') },
                      { value: 'CFO', label: t('jobTitles.CFO') },
                      { value: 'COO', label: t('jobTitles.COO') },
                      { value: 'President', label: t('jobTitles.President') },
                      { value: 'Chairman', label: t('jobTitles.Chairman') },
                      {
                        value: 'Senior Branch Manager',
                        label: t('jobTitles.Senior Branch Manager'),
                      },
                      { value: 'Other', label: t('jobTitles.Other') },
                    ]}
                  />
                  <OnboardingFormField
                    control={ownerForm.control}
                    name="jobTitleDescription"
                    type="text"
                    disabled={ownerForm.watch('jobTitle') === 'Other'}
                  />
                  <OnboardingFormField
                    control={ownerForm.control}
                    name="individualEmail"
                    type="email"
                  />
                </fieldset>

                {/* Phone Information */}
                <fieldset
                  disabled={isOwnerFormSubmitting}
                  className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3"
                >
                  <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                    Phone Information
                  </legend>
                  <OnboardingFormField
                    control={ownerForm.control}
                    name="individualPhone.phoneType"
                    type="select"
                    options={[
                      {
                        value: 'BUSINESS_PHONE',
                        label: t('phoneTypes.BUSINESS_PHONE'),
                      },
                      {
                        value: 'MOBILE_PHONE',
                        label: t('phoneTypes.MOBILE_PHONE'),
                      },
                      {
                        value: 'ALTERNATE_PHONE',
                        label: t('phoneTypes.ALTERNATE_PHONE'),
                      },
                    ]}
                  />
                  <OnboardingFormField
                    control={ownerForm.control}
                    name="individualPhone.phoneNumber"
                    type="phone"
                  />
                </fieldset>

                {/* Addresses */}
                <OnboardingArrayField
                  control={ownerForm.control}
                  name="individualAddresses"
                  disabled={isOwnerFormSubmitting}
                  renderItem={({
                    itemLabel,
                    index,
                    field,
                    disabled,
                    renderRemoveButton,
                  }) => (
                    <fieldset
                      key={field.id}
                      className="eb-rounded-lg eb-border eb-p-4"
                      disabled={disabled}
                    >
                      <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                        {itemLabel}
                      </legend>
                      <div className="eb-grid eb-grid-cols-1 eb-gap-6 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                        <OnboardingFormField
                          control={ownerForm.control}
                          name={`individualAddresses.${index}.addressType`}
                          type="select"
                          // Dropdown fields need to be explicitly passed whether it's disabled rather than relying on the fieldset
                          disabled={disabled}
                          options={[
                            {
                              value: 'MAILING_ADDRESS',
                              label: t('addressTypes.MAILING_ADDRESS'),
                            },
                            {
                              value: 'RESIDENTIAL_ADDRESS',
                              label: t('addressTypes.RESIDENTIAL_ADDRESS'),
                            },
                          ]}
                        />
                        <div className="eb-col-span-2 eb-grid eb-grid-cols-1 eb-gap-6 md:eb-grid-cols-2">
                          <OnboardingFormField
                            control={ownerForm.control}
                            name={`individualAddresses.${index}.primaryAddressLine`}
                            type="text"
                          />

                          <OnboardingArrayField
                            control={ownerForm.control}
                            name={`individualAddresses.${index}.additionalAddressLines`}
                            renderItem={({
                              index: lineIndex,
                              field: lineField,
                              renderRemoveButton: renderLineRemoveButton,
                            }) => (
                              <OnboardingFormField
                                key={lineField.id}
                                control={ownerForm.control}
                                name={`individualAddresses.${index}.additionalAddressLines.${lineIndex}.value`}
                                type="text"
                                inputButton={renderLineRemoveButton({
                                  className: 'eb-align-end',
                                  children: <XIcon />,
                                })}
                              />
                            )}
                          />
                        </div>

                        <OnboardingFormField
                          control={ownerForm.control}
                          name={`individualAddresses.${index}.city`}
                          type="text"
                        />

                        <OnboardingFormField
                          control={ownerForm.control}
                          name={`individualAddresses.${index}.state`}
                          type="select"
                          options={stateOptions}
                        />

                        <OnboardingFormField
                          control={ownerForm.control}
                          name={`individualAddresses.${index}.postalCode`}
                          type="text"
                          inputProps={{
                            pattern: '[0-9]{5}',
                            maxLength: 5,
                            inputMode: 'numeric',
                          }}
                        />

                        <OnboardingFormField
                          control={ownerForm.control}
                          name={`individualAddresses.${index}.country`}
                          type="combobox"
                          options={COUNTRIES_OF_FORMATION.map((code) => ({
                            value: code,
                            label: (
                              <span>
                                <span className="eb-font-medium">[{code}]</span>{' '}
                                {t([
                                  `common:countries.${code}`,
                                ] as unknown as TemplateStringsArray)}
                              </span>
                            ),
                          }))}
                        />
                      </div>
                      <div className="eb-mt-4 eb-flex eb-justify-start">
                        {renderRemoveButton()}
                      </div>
                    </fieldset>
                  )}
                />

                {/* Individual IDs */}
                <OnboardingArrayField
                  control={ownerForm.control}
                  name="individualIds"
                  disabled={isOwnerFormSubmitting}
                  renderItem={({
                    field,
                    index,
                    disabled,
                    itemLabel,
                    renderRemoveButton,
                  }) => (
                    <fieldset
                      key={field.id}
                      className="eb-rounded-lg eb-border eb-p-4"
                      disabled={disabled}
                    >
                      <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
                        {itemLabel}
                      </legend>

                      <div className="eb-grid eb-grid-cols-1 eb-gap-6 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                        <OnboardingFormField
                          control={ownerForm.control}
                          name={`individualIds.${index}.idType`}
                          type="select"
                          options={[
                            { value: 'SSN', label: 'SSN' },
                            { value: 'ITIN', label: 'ITIN' },
                          ]}
                          disabled={disabled}
                        />

                        <OnboardingFormField
                          key={`individual-id-value-${index}-${field.idType}`}
                          control={ownerForm.control}
                          name={`individualIds.${index}.value`}
                          type="text"
                          label={getValueLabel(field.idType)}
                          maskFormat={getMaskFormat(field.idType)}
                          maskChar="_"
                        />

                        <OnboardingFormField
                          control={ownerForm.control}
                          name={`individualIds.${index}.issuer`}
                          type="combobox"
                          options={COUNTRIES_OF_FORMATION.map((code) => ({
                            value: code,
                            label: (
                              <span>
                                <span className="eb-font-medium">[{code}]</span>{' '}
                                {t([
                                  `common:countries.${code}`,
                                ] as unknown as TemplateStringsArray)}
                              </span>
                            ),
                          }))}
                        />
                        <OnboardingFormField
                          control={ownerForm.control}
                          name={`individualIds.${index}.expiryDate`}
                          type="date"
                        />
                        <OnboardingFormField
                          control={ownerForm.control}
                          name={`individualIds.${index}.description`}
                          type="text"
                        />
                      </div>

                      <div className="eb-mt-4 eb-flex eb-justify-start">
                        {renderRemoveButton()}
                      </div>
                    </fieldset>
                  )}
                />

                <ServerErrorAlert
                  error={clientUpdateError || partyUpdateError}
                />
              </div>

              <DialogFooter className="eb-border-t eb-px-4 eb-pt-3">
                <Button
                  type="submit"
                  form={ownerFormId}
                  disabled={isOwnerFormSubmitting}
                >
                  {(partyUpdateStatus === 'pending' ||
                    clientUpdateStatus === 'pending') && (
                    <Loader2Icon className="eb-animate-spin" />
                  )}
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </form>
        </Form>
      </Dialog>
    </div>
  );
};
