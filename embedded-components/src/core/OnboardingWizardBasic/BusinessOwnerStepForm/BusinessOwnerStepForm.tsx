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

import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { EditIcon, PlusIcon, TrashIcon, UserPlusIcon } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import {
  useSmbdoGetClient,
  useSmbdoUpdateClient,
  useUpdateParty as useSmbdoUpdateParty,
} from '@/api/generated/smbdo';
import { UpdateClientRequestSmbdo } from '@/api/generated/smbdo.schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useStepper } from '@/components/ui/stepper';

import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { IndividualStepFormSchema } from '../IndividualStepForm/IndividualStepForm.schema';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { OnboardingFormField } from '../OnboardingFormField/OnboardingFormField';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import {
  convertClientResponseToFormValues,
  generatePartyRequestBody,
  generateRequestBody,
  useFilterFunctionsByClientContext,
} from '../utils/formUtils';

type BusinessOwner = z.infer<typeof IndividualStepFormSchema>;

export const BusinessOwnerStepForm = () => {
  const { nextStep, prevStep, isDisabledStep } = useStepper();
  const { clientId, onPostClientResponse } = useOnboardingContext();
  const { t } = useTranslation(['onboarding', 'common']);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentDecisionMakerId, setCurrentDecisionMakerId] =
    useState<string>('');

  // Fetch client data
  const {
    data: clientData,
    status: getClientStatus,
    refetch: refetchClientData,
  } = useSmbdoGetClient(clientId ?? '');

  const {
    filterDefaultValues,
    getFieldRule,
    isFieldDisabled,
    isFieldRequired,
    isFieldVisible,
    clientContext,
  } = useFilterFunctionsByClientContext(clientData);

  const controllerForm = useForm({});

  const ownerForm = useForm<z.infer<typeof IndividualStepFormSchema>>({
    mode: 'onBlur',
    resolver: zodResolver(IndividualStepFormSchema),
    defaultValues: filterDefaultValues({
      individualAddresses: [
        {
          addressType: 'RESIDENTIAL_ADDRESS',
          addressLines: [''],
          state: '',
          city: '',
          postalCode: '',
          country: '',
        },
      ],
      individualIds: [
        {
          idType: 'SSN',
          value: '',
          issuer: '',
          expiryDate: '',
          description: '',
        },
      ],
      individualPhone: {
        phoneType: 'MOBILE_PHONE',
        phoneNumber: '',
      },
    }),
  });

  const controllerData = clientData?.parties?.find(
    (party) =>
      party?.partyType === 'INDIVIDUAL' && party?.roles?.includes('CONTROLLER')
  );

  const ownersData =
    clientData?.parties?.filter(
      (party) =>
        party?.partyType === 'INDIVIDUAL' &&
        party?.roles?.includes('BENEFICIAL_OWNER')
    ) || [];

  const {
    fields: addresses,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({
    control: ownerForm.control,
    name: 'individualAddresses',
  });

  const {
    fields: idFields,
    append: appendId,
    remove: removeId,
  } = useFieldArray({
    control: ownerForm.control,
    name: 'individualIds',
  });

  const {
    mutate: updateClient,
    error: updateClientError,
    status: updateClientStatus,
  } = useSmbdoUpdateClient();

  const {
    mutate: updateParty,
    error: updatePartyError,
    status: updatePartyStatus,
  } = useSmbdoUpdateParty();

  const handleEditDecisionMaker = (decisionMakerId: string) => {
    if (getClientStatus === 'success' && clientData) {
      setCurrentDecisionMakerId(decisionMakerId);
      const formValues = convertClientResponseToFormValues(
        clientData,
        decisionMakerId
      );
      ownerForm.reset(formValues as BusinessOwner);
      setIsDialogOpen(true);
    }
  };

  const handleAddDecisionMaker = () => {
    setCurrentDecisionMakerId('');
    ownerForm.reset({});
    setIsDialogOpen(true);
  };

  const handleDeleteDecisionMaker = (decisionMakerId: string) => {
    if (clientId) {
      const requestBody = {
        removeParties: [{ id: decisionMakerId }],
      } as UpdateClientRequestSmbdo;

      updateClient({
        id: clientId,
        data: requestBody,
      });
    }
  };

  const onSubmit = (values: BusinessOwner) => {
    if (clientId) {
      if (currentDecisionMakerId) {
        const requestBody = generateRequestBody(values, 0, 'addParties', {
          addParties: [
            {
              partyType: 'INDIVIDUAL',
              roles: ['BENEFICIAL_OWNER'],
            },
          ],
        }) as UpdateClientRequestSmbdo;

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
              setCurrentDecisionMakerId('');
              ownerForm.reset({});
              refetchClientData();
            },
            onError: () => {
              toast.error('Failed to update beneficial owner details');
            },
          }
        );
      } else {
        const partyRequestBody = generatePartyRequestBody(values, {});

        updateParty({
          partyId: currentDecisionMakerId,
          data: partyRequestBody,
        });
      }
    }
  };

  if (updateClientStatus === 'pending' || updatePartyStatus === 'pending') {
    return <FormLoadingState message="Submitting..." />;
  }

  return (
    <div className="eb-grid eb-w-full eb-items-start eb-gap-6 eb-overflow-auto eb-p-1">
      {/* <OnboardingFormField
        control={controllerForm.control}
        disableMapping
        type="radio-group"
        name="controllerIsOwner"
        label="Do you, the controller, own 25% or more of the business?"
        options={[
          { value: 'yes', label: t('common:yes') },
          { value: 'no', label: t('common:no') },
        ]}
      /> */}

      <fieldset className="eb-grid eb-grid-cols-1 eb-gap-6 eb-rounded-lg eb-border eb-p-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
        <legend className="eb-m-1 eb-px-1 eb-text-sm eb-font-medium">
          Beneficial Owners
        </legend>
        {ownersData.map((owner) => (
          <Card key={owner.id}>
            <CardHeader>
              <CardTitle>{`${owner?.individualDetails?.firstName} ${owner?.individualDetails?.lastName}`}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{owner?.individualDetails?.jobTitle ?? ''}</p>
              <div className="eb-mt-4 eb-space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    owner?.id && handleEditDecisionMaker(owner?.id)
                  }
                >
                  <EditIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    owner?.id && handleDeleteDecisionMaker(owner?.id)
                  }
                >
                  <TrashIcon className="eb-mr-2 eb-h-4 eb-w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button
          className="eb-flex eb-cursor-pointer eb-items-center eb-justify-center"
          onClick={handleAddDecisionMaker}
        >
          <UserPlusIcon className="eb-mr-2 eb-h-4 eb-w-4 eb-stroke-2" />
          Add Business Owner
        </Button>
      </fieldset>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="eb-max-h-full eb-max-w-3xl eb-overflow-auto">
          <DialogHeader>
            <DialogTitle>
              {currentDecisionMakerId
                ? 'Edit Business Owner'
                : 'Add Business Owner'}
            </DialogTitle>
          </DialogHeader>
          <Form {...ownerForm}>
            <form
              onSubmit={ownerForm.handleSubmit(onSubmit)}
              className="eb-space-y-6"
            >
              <div className="eb-grid eb-grid-cols-1 eb-gap-6 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                <FormField
                  control={ownerForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter first name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ownerForm.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter middle name (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ownerForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter last name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ownerForm.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ownerForm.control}
                  name="countryOfResidence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country of Residence</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., US"
                          maxLength={2}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ownerForm.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job title" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="CEO">CEO</SelectItem>
                          <SelectItem value="CFO">CFO</SelectItem>
                          <SelectItem value="COO">COO</SelectItem>
                          <SelectItem value="President">President</SelectItem>
                          <SelectItem value="Chairman">Chairman</SelectItem>
                          <SelectItem value="Senior Branch Manager">
                            Senior Branch Manager
                          </SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {ownerForm.watch('jobTitle') === 'Other' && (
                  <FormField
                    control={ownerForm.control}
                    name="jobTitleDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title Description</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Describe your job title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Phone Information */}
              <Card className="eb-mt-6">
                <CardHeader>
                  <CardTitle className="eb-text-lg eb-font-medium">
                    Phone Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-3">
                  <FormField
                    control={ownerForm.control}
                    name="individualPhone.phoneType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select phone type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BUSINESS_PHONE">
                              Business Phone
                            </SelectItem>
                            <SelectItem value="MOBILE_PHONE">
                              Mobile Phone
                            </SelectItem>
                            <SelectItem value="ALTERNATE_PHONE">
                              Alternate Phone
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={ownerForm.control}
                    name="individualPhone.phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl key={clientContext.jurisdiction}>
                          <PhoneInput
                            {...field}
                            countries={['CA', 'US']}
                            placeholder="Enter phone number"
                            international={false}
                            defaultCountry={
                              clientContext.jurisdiction === 'CanadaMS'
                                ? 'CA'
                                : 'US'
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              {/* Addresses */}
              <Card className="eb-mt-6">
                <CardHeader>
                  <CardTitle className="eb-text-lg eb-font-medium">
                    Addresses
                  </CardTitle>
                </CardHeader>
                <CardContent className="eb-space-y-4">
                  {addresses?.map((fieldName, index) => (
                    <div
                      key={fieldName?.id}
                      className="eb-space-y-4 eb-rounded-md eb-border eb-p-4"
                    >
                      <h4 className="eb-font-medium">Address {index + 1}</h4>
                      <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                        <FormField
                          control={ownerForm.control}
                          name={`individualAddresses.${index}.addressType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select address type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="LEGAL_ADDRESS">
                                    Legal Address
                                  </SelectItem>
                                  <SelectItem value="MAILING_ADDRESS">
                                    Mailing Address
                                  </SelectItem>
                                  <SelectItem value="BUSINESS_ADDRESS">
                                    Business Address
                                  </SelectItem>
                                  <SelectItem value="RESIDENTIAL_ADDRESS">
                                    Residential Address
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name={`individualAddresses.${index}.addressLines.0`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address Line 1</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter address line 1"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name={`individualAddresses.${index}.city`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name={`individualAddresses.${index}.state`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Enter state" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name={`individualAddresses.${index}.postalCode`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter postal code"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name={`individualAddresses.${index}.country`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter country code"
                                  maxLength={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeAddress(index)}
                        variant="outline"
                        size="sm"
                        className="eb-mt-2"
                      >
                        Remove Address
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() =>
                      appendAddress({
                        addressType: 'RESIDENTIAL_ADDRESS',
                        addressLines: [''],
                        state: '',
                        city: '',
                        postalCode: '',
                        country: '',
                      })
                    }
                    variant="outline"
                    size="sm"
                  >
                    Add Address
                  </Button>
                </CardContent>
              </Card>
              {/* Individual IDs */}
              <Card className="eb-mt-6">
                <CardHeader>
                  <CardTitle className="eb-text-lg eb-font-medium">
                    Individual IDs
                  </CardTitle>
                </CardHeader>
                <CardContent className="eb-space-y-4">
                  {idFields.map((fieldName, index) => (
                    <div
                      key={fieldName.id}
                      className="eb-space-y-4 eb-rounded-md eb-border eb-p-4"
                    >
                      <h4 className="eb-font-medium">ID {index + 1}</h4>
                      <div className="eb-grid eb-grid-cols-1 eb-gap-4 md:eb-grid-cols-2 lg:eb-grid-cols-3">
                        <FormField
                          control={ownerForm.control}
                          name={`individualIds.${index}.idType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select ID type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="SSN">SSN</SelectItem>
                                  <SelectItem value="ITIN">ITIN</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name={`individualIds.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID Value</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter ID value"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name={`individualIds.${index}.issuer`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Issuer</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter issuer country code"
                                  maxLength={2}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name={`individualIds.${index}.expiryDate`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date</FormLabel>
                              <FormControl>
                                <Input {...field} type="date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={ownerForm.control}
                          name={`individualIds.${index}.description`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Enter description (optional)"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeId(index)}
                        variant="outline"
                        size="sm"
                        className="eb-mt-2"
                      >
                        Remove ID
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() =>
                      appendId({
                        idType: 'SSN',
                        value: '',
                        issuer: '',
                      })
                    }
                    variant="outline"
                    size="sm"
                  >
                    Add ID
                  </Button>
                </CardContent>
              </Card>

              <Button type="submit">
                {currentDecisionMakerId ? 'Update' : 'Add'} Decision Maker
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ServerErrorAlert error={updateClientError} />
      <div className="eb-flex eb-w-full eb-justify-end eb-gap-4">
        <Button
          disabled={isDisabledStep}
          variant="secondary"
          onClick={prevStep}
        >
          Previous
        </Button>
        <Button onClick={nextStep}>Next</Button>
      </div>
    </div>
  );
};
