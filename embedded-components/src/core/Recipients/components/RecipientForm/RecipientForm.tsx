import React, { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import type {
  PartyType,
  Recipient,
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
// Utils
import {
  buildRecipientRequest,
  extractPaymentMethods,
  extractRoutingNumbers,
  mapContactsToFormData,
} from './utils';

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
  const dataLoadedRef = useRef(false);

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
  } = useForm<FormData>({
    resolver: zodResolver(dynamicSchema),
    mode: 'onChange', // Validate on change
    defaultValues: {
      type: 'INDIVIDUAL',
      firstName: '',
      lastName: '',
      businessName: '',
      countryCode: 'US',
      paymentMethods: [availablePaymentMethods[0]],
      routingNumbers: {},
      contacts: [],
      accountNumber: '',
      accountType: 'CHECKING',
      addressLine1: '',
      addressLine2: '',
      addressLine3: '',
      city: '',
      state: '',
      postalCode: '',
    },
  });

  // Watch for form changes
  const watchedType = watch('type');
  const watchedPaymentMethods = watch('paymentMethods');

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

  // Reset data loaded flag when recipient changes
  useEffect(() => {
    dataLoadedRef.current = false;
  }, [recipient?.id]);

  // Helper function to load recipient data into form
  const loadRecipientData = (recipientData: Recipient) => {
    // Basic information
    setValue('type', recipientData.partyDetails?.type || 'INDIVIDUAL');
    setValue('firstName', recipientData.partyDetails?.firstName || '');
    setValue('lastName', recipientData.partyDetails?.lastName || '');
    setValue(
      'businessName',
      recipientData.partyDetails?.businessName || ''
    );

    // Account information
    setValue('accountNumber', recipientData.account?.number || '');
    setValue('accountType', recipientData.account?.type || 'CHECKING');
    setValue('countryCode', recipientData.account?.countryCode || 'US');

    // Address information
    setValue(
      'addressLine1',
      recipientData.partyDetails?.address?.addressLine1 || ''
    );
    setValue(
      'addressLine2',
      recipientData.partyDetails?.address?.addressLine2 || ''
    );
    setValue(
      'addressLine3',
      recipientData.partyDetails?.address?.addressLine3 || ''
    );
    setValue('city', recipientData.partyDetails?.address?.city || '');
    setValue('state', recipientData.partyDetails?.address?.state || '');
    setValue(
      'postalCode',
      recipientData.partyDetails?.address?.postalCode || ''
    );

    // Contacts
    const contacts = mapContactsToFormData(
      recipientData.partyDetails?.contacts
    );
    setValue('contacts', contacts);

    // Payment methods
    const paymentMethods = extractPaymentMethods(
      recipientData,
      availablePaymentMethods[0]
    );
    setValue('paymentMethods', paymentMethods);

    // Routing numbers
    const routingNumbers = extractRoutingNumbers(recipientData);
    setValue('routingNumbers', routingNumbers);

    setPartyType(recipientData.partyDetails?.type || 'INDIVIDUAL');
  };

  // Load existing recipient data
  useEffect(() => {
    if (recipient && mode === 'edit' && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      loadRecipientData(recipient);
    }
  }, [recipient?.id, mode, setValue, availablePaymentMethods]);

  const onFormSubmit = (data: FormData) => {
    console.log('RecipientForm submit', data);
    const baseRequest = buildRecipientRequest(data, recipientType);

    if (mode === 'create') {
      onSubmit(baseRequest);
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
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="eb-space-y-6 eb-px-4 eb-py-2"
    >
      {/* Error Summary for Debugging */}
      {Object.keys(errors).length > 0 && (
        <div className="eb-mb-4 eb-rounded eb-border eb-border-red-200 eb-bg-red-50 eb-p-3">
          <p className="eb-mb-2 eb-font-semibold eb-text-red-700">
            Form Errors:
          </p>
          <ul className="eb-list-inside eb-list-disc eb-text-xs eb-text-red-600">
            {Object.entries(errors).flatMap(([key, value]) => {
              if (Array.isArray(value)) {
                return value
                  .map((v, i) =>
                    v &&
                    typeof v === 'object' &&
                    'message' in v &&
                    typeof v.message === 'string' &&
                    v.message ? (
                      <li key={`${key}-${i}`}>
                        <strong>
                          {key}[{i}]:
                        </strong>{' '}
                        {v.message}
                      </li>
                    ) : null
                  )
                  .filter(Boolean);
              }
              // Only render if value is a FieldError with a string message
              if (
                value &&
                typeof value === 'object' &&
                'message' in value &&
                typeof value.message === 'string' &&
                value.message
              ) {
                return (
                  <li key={key}>
                    <strong>{key}:</strong> {value.message}
                  </li>
                );
              }
              // For all other types (including primitives), return null
              return null;
            })}
          </ul>
        </div>
      )}
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
