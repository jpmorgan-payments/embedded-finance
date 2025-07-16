import React, { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type {
  PartyType,
  RecipientRequest,
  UpdateRecipientRequest,
} from '@/api/generated/ep-recipients.schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import {
  defaultRecipientsConfig,
  getAvailablePaymentMethods,
  getPaymentMethodsRequiringAddress,
  getRequiredAddressFields,
  isAddressRequired,
  isMultiplePaymentMethodsAllowed,
  type PaymentMethodType,
} from '../../types/paymentConfig';
import { AccountDetailsSection } from './AccountDetailsSection';
import { AddressSection } from './AddressSection';
import { ContactsSection } from './ContactsSection';
import { PaymentMethodsSection } from './PaymentMethodsSection';
import { PersonalDetailsSection } from './PersonalDetailsSection';
import { createDynamicRecipientFormSchema } from './RecipientForm.schema';
import type { FormData, RecipientFormProps } from './RecipientForm.types';
import { RoutingNumbersSection } from './RoutingNumbersSection';

// Helper function to get required contact types from payment methods
function getRequiredContactTypes(
  config: typeof defaultRecipientsConfig,
  paymentMethods: PaymentMethodType[]
): Set<'EMAIL' | 'PHONE' | 'WEBSITE'> {
  const requiredTypes = new Set<'EMAIL' | 'PHONE' | 'WEBSITE'>();

  paymentMethods.forEach((method) => {
    const methodConfig = config?.paymentMethodConfigs?.[method];
    if (!methodConfig?.enabled) return;

    methodConfig.requiredFields.forEach((field) => {
      if (field === 'partyDetails.contacts.EMAIL.value') {
        requiredTypes.add('EMAIL');
      }
      if (field === 'partyDetails.contacts.PHONE.value') {
        requiredTypes.add('PHONE');
      }
    });
  });

  return requiredTypes;
}

export const RecipientForm: React.FC<RecipientFormProps> = ({
  mode,
  recipient,
  onSubmit,
  onCancel,
  isLoading = false,
  config,
  showCardWrapper = true,
  recipientType = 'RECIPIENT', // Add this as a prop
}) => {
  const [partyType, setPartyType] = useState<PartyType>(
    recipient?.partyDetails?.type || 'INDIVIDUAL'
  );

  // Use provided config or fallback to default
  const formConfig = config || defaultRecipientsConfig;

  // Get configuration values
  const availablePaymentMethods = getAvailablePaymentMethods(formConfig);
  const multipleMethodsAllowed = isMultiplePaymentMethodsAllowed(formConfig);

  // Create dynamic schema with config
  const dynamicSchema = createDynamicRecipientFormSchema(formConfig);

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    watch,
    setValue,
    reset,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      type: partyType,
      countryCode: 'US',
      paymentMethods: [availablePaymentMethods[0]],
      routingNumbers: {},
      contacts: [],
    },
  });

  // Watch for form changes
  const watchedType = watch('type');
  const watchedPaymentMethods = watch('paymentMethods');
  const watchedContacts = watch('contacts');

  // Get configuration-driven address requirements
  const addressRequired = isAddressRequired(
    formConfig,
    (watchedPaymentMethods || []) as PaymentMethodType[]
  );
  const requiredAddressFields = getRequiredAddressFields(
    formConfig,
    (watchedPaymentMethods || []) as PaymentMethodType[]
  );
  const paymentMethodsRequiringAddress = getPaymentMethodsRequiringAddress(
    formConfig,
    (watchedPaymentMethods || []) as PaymentMethodType[]
  );

  // Update party type when it changes
  useEffect(() => {
    if (watchedType !== partyType) {
      setPartyType(watchedType);
    }
  }, [watchedType, partyType]);

  // Initialize routing numbers when payment methods change
  useEffect(() => {
    if (watchedPaymentMethods && watchedPaymentMethods.length > 0) {
      const currentRoutingNumbers = watch('routingNumbers') || {};
      const newRoutingNumbers = { ...currentRoutingNumbers };

      // Add routing number fields for newly selected methods
      watchedPaymentMethods.forEach((method) => {
        if (!newRoutingNumbers[method]) {
          newRoutingNumbers[method] = '';
        }
      });

      // Remove routing number fields for unselected methods
      Object.keys(newRoutingNumbers).forEach((method) => {
        if (!watchedPaymentMethods.includes(method)) {
          delete newRoutingNumbers[method];
        }
      });

      setValue('routingNumbers', newRoutingNumbers);

      // Trigger validation for all fields when payment methods change
      // This ensures validation rules are re-evaluated for new requirements
      trigger();
    }
  }, [watchedPaymentMethods, setValue, watch, trigger]);

  // Auto-manage contacts based on payment method requirements
  useEffect(() => {
    if (watchedPaymentMethods && watchedPaymentMethods.length > 0) {
      const requiredContactTypes = getRequiredContactTypes(
        formConfig,
        watchedPaymentMethods as PaymentMethodType[]
      );
      const currentContacts = watchedContacts || [];

      // Create a map of existing contacts by type
      const existingContactsByType = new Map(
        currentContacts.map((contact) => [contact.contactType, contact])
      );

      let contactsChanged = false;
      const updatedContacts = [...currentContacts];

      // Add missing required contact types
      requiredContactTypes.forEach((contactType) => {
        if (!existingContactsByType.has(contactType)) {
          let newContact: any;

          if (contactType === 'PHONE') {
            newContact = {
              contactType: 'PHONE' as const,
              value: '',
              countryCode: '+1',
            };
          } else if (contactType === 'EMAIL') {
            newContact = {
              contactType: 'EMAIL' as const,
              value: '',
            };
          } else if (contactType === 'WEBSITE') {
            newContact = {
              contactType: 'WEBSITE' as const,
              value: '',
            };
          }

          if (newContact) {
            updatedContacts.push(newContact);
            contactsChanged = true;
          }
        }
      });

      // Only auto-add required contacts, never auto-remove any
      const areContactsEqual = (
        a: typeof updatedContacts,
        b: typeof updatedContacts
      ) => {
        if (a.length !== b.length) return false;
        let allEqual = true;
        a.forEach((contact, i) => {
          if (
            contact.contactType !== b[i].contactType ||
            contact.value !== b[i].value ||
            (contact.countryCode || '') !== (b[i].countryCode || '')
          ) {
            allEqual = false;
          }
        });
        return allEqual;
      };

      if (
        contactsChanged ||
        !areContactsEqual(updatedContacts, currentContacts)
      ) {
        setValue('contacts', updatedContacts);
      }
    }
  }, [watchedPaymentMethods, formConfig, setValue, watchedContacts]);

  // Load existing recipient data
  useEffect(() => {
    if (recipient && mode === 'edit') {
      const formData: Partial<FormData> = {
        type: recipient.partyDetails?.type || 'INDIVIDUAL',
        firstName: recipient.partyDetails?.individual?.firstName,
        lastName: recipient.partyDetails?.individual?.lastName,
        businessName: recipient.partyDetails?.organization?.businessName,
        accountNumber: recipient.account?.number,
        accountType: recipient.account?.type,
        countryCode: recipient.account?.countryCode || 'US',
        addressLine1: recipient.partyDetails?.address?.addressLine1,
        addressLine2: recipient.partyDetails?.address?.addressLine2,
        addressLine3: recipient.partyDetails?.address?.addressLine3,
        city: recipient.partyDetails?.address?.city,
        state: recipient.partyDetails?.address?.state,
        postalCode: recipient.partyDetails?.address?.postalCode,
        contacts:
          recipient.partyDetails?.contacts?.map((contact) => {
            if (contact.contactType === 'PHONE') {
              return {
                contactType: 'PHONE' as const,
                value: contact.value,
                countryCode: contact.countryCode || '+1',
              };
            }
            if (contact.contactType === 'EMAIL') {
              return {
                contactType: 'EMAIL' as const,
                value: contact.value,
              };
            }
            if (contact.contactType === 'WEBSITE') {
              return {
                contactType: 'WEBSITE' as const,
                value: contact.value,
              };
            }
            // Fallback for unknown contact types
            return {
              contactType: 'EMAIL' as const,
              value: contact.value,
            };
          }) || [],
        // Set payment methods based on existing routing information
        paymentMethods: recipient.account?.routingInformation?.map(
          (ri: { transactionType: any }) => ri.transactionType
        ) || [availablePaymentMethods[0]],
        routingNumbers:
          recipient.account?.routingInformation?.reduce(
            (
              acc: { [x: string]: any },
              ri: { transactionType: string | number; routingNumber: any }
            ) => {
              if (ri.transactionType && ri.routingNumber) {
                acc[ri.transactionType] = ri.routingNumber;
              }
              return acc;
            },
            {} as Record<string, string>
          ) || {},
      };

      reset(formData);
      setPartyType(formData.type || 'INDIVIDUAL');
    }
  }, [recipient, mode, reset, availablePaymentMethods]);

  const onFormSubmit = (data: FormData) => {
    // No need for manual validation - the dynamic schema handles everything!
    // Build the request based on the form data
    const baseRequest = {
      type: recipientType, // Use the prop, not a form field
      partyDetails: {
        type: data.type,
        ...(data.type === 'INDIVIDUAL' && {
          individual: {
            firstName: data.firstName!,
            lastName: data.lastName!,
          },
        }),
        ...(data.type === 'ORGANIZATION' && {
          organization: {
            businessName: data.businessName!,
          },
        }),
        ...(data.addressLine1 && {
          address: {
            addressLine1: data.addressLine1,
            addressLine2: data.addressLine2,
            addressLine3: data.addressLine3,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
          },
        }),
        ...(data.contacts &&
          data.contacts.length > 0 && {
            contacts: data.contacts.filter((contact) => contact.value?.trim()),
          }),
      },
      accountDetails: {
        accountNumber: data.accountNumber,
        accountType: data.accountType,
        countryCode: data.countryCode,
      },
      routingInformation: data.paymentMethods
        ?.filter((method) => data.routingNumbers?.[method])
        .map((method) => ({
          routingNumber: data.routingNumbers![method],
          routingCodeType: 'USABA',
          transactionType: method,
        })),
    };

    if (mode === 'create') {
      onSubmit(baseRequest as RecipientRequest);
    } else {
      onSubmit(baseRequest as UpdateRecipientRequest);
    }
  };

  // Get required contact types for UI information
  const requiredContactTypes = getRequiredContactTypes(
    formConfig,
    (watchedPaymentMethods || []) as PaymentMethodType[]
  );

  // Form content that will be rendered with or without Card wrapper
  const formContent = (
    <form onSubmit={handleSubmit(onFormSubmit)} className="eb-space-y-6">
      {/* 1. Payment Methods - moved to top */}
      <PaymentMethodsSection
        control={control}
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
        availablePaymentMethods={availablePaymentMethods}
        multipleMethodsAllowed={multipleMethodsAllowed}
      />

      <Separator />

      {/* 2. Personal/Organization Details */}
      <PersonalDetailsSection
        control={control}
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
        partyType={partyType}
      />

      <Separator />

      {/* 3. Account Details - account type before account number */}
      <AccountDetailsSection
        control={control}
        register={register}
        errors={errors}
        watch={watch}
        setValue={setValue}
      />

      <Separator />

      {/* 4. Routing Numbers - simplified table */}
      <RoutingNumbersSection
        control={control}
        errors={errors}
        watch={watch}
        setValue={setValue}
        selectedPaymentMethods={watchedPaymentMethods || []}
      />

      <Separator />

      {/* 5. Address Information - dynamically required based on config */}
      <div className="eb-space-y-4">
        {addressRequired && (
          <div className="eb-rounded-md eb-border eb-border-blue-200 eb-bg-blue-50 eb-p-3">
            <p className="eb-text-sm eb-text-blue-800">
              <strong>Note:</strong> Address information is required for{' '}
              {paymentMethodsRequiringAddress.join(', ')} transfers.
            </p>
          </div>
        )}
        <AddressSection
          control={control}
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          requiredFields={requiredAddressFields}
          paymentMethodsRequiringAddress={paymentMethodsRequiringAddress}
        />
      </div>

      <Separator />

      {/* 6. Contact Information */}
      <div className="eb-space-y-4">
        {requiredContactTypes.size > 0 && (
          <div className="eb-rounded-md eb-border eb-border-blue-200 eb-bg-blue-50 eb-p-3">
            <p className="eb-text-sm eb-text-blue-800">
              <strong>Note:</strong>{' '}
              {Array.from(requiredContactTypes)
                .map((type) => type.toLowerCase())
                .join(' and ')}{' '}
              contact{requiredContactTypes.size > 1 ? 's are' : ' is'} required
              for the selected payment methods.
            </p>
          </div>
        )}
        <ContactsSection
          control={control}
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
        />
      </div>

      {/* Form Actions */}
      <div className="eb-flex eb-justify-end eb-gap-3 eb-pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? 'Saving...'
            : mode === 'create'
              ? 'Create Recipient'
              : 'Update Recipient'}
        </Button>
      </div>
    </form>
  );

  // Render with or without Card wrapper
  if (showCardWrapper) {
    return (
      <Card className="eb-mx-auto eb-w-full eb-max-w-4xl">
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Create New Recipient' : 'Edit Recipient'}
          </CardTitle>
        </CardHeader>
        <CardContent className="eb-scrollable-content eb-max-h-[70vh] eb-overflow-y-auto">
          {formContent}
        </CardContent>
      </Card>
    );
  }

  // Render just the form content for dialog usage
  return <div className="eb-space-y-4">{formContent}</div>;
};
