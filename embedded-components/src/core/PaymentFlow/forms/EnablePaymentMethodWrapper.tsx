'use client';

import React, { useMemo, useState } from 'react';

import { useGetRecipient } from '@/api/generated/ep-recipients';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import type { TransactionRecipientDetailsV2 } from '@/api/generated/ep-transactions.schemas';
import { Skeleton } from '@/components/ui/skeleton';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import {
  BankAccountForm,
  useLinkedAccountConfig,
  useRecipientConfig,
  type BankAccountFormConfig,
  type BankAccountFormData,
} from '@/core/RecipientWidgets/components/BankAccountForm';
import { useRecipientForm } from '@/core/RecipientWidgets/hooks/useRecipientForm';

import type {
  Payee,
  PaymentMethod,
  UnsavedRecipient,
} from '../PaymentFlow.types';

/**
 * Props for EnablePaymentMethodWrapper
 */
export interface EnablePaymentMethodWrapperProps {
  /** The payee (recipient or linked account) to enable the payment method for */
  payee: Payee;
  /** The payment method to enable */
  paymentMethod: PaymentMethod;
  /** Callback when recipient is successfully updated (for saved recipients) */
  onSuccess: (recipient: Recipient) => void;
  /** Callback when unsaved recipient is updated (for unsaved recipients) */
  onUnsavedSuccess?: (unsavedRecipient: UnsavedRecipient) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Unsaved recipient data (if enabling for an unsaved recipient) */
  unsavedRecipient?: UnsavedRecipient;
}

/**
 * EnablePaymentMethodWrapper
 *
 * Uses the BankAccountForm in edit mode to enable a new payment method
 * for an existing payee (recipient, linked account, or unsaved recipient).
 */
export function EnablePaymentMethodWrapper({
  payee,
  paymentMethod,
  onSuccess,
  onUnsavedSuccess,
  onCancel,
  unsavedRecipient,
}: EnablePaymentMethodWrapperProps) {
  const isUnsaved = !!unsavedRecipient;
  const isLinkedAccount = payee.type === 'LINKED_ACCOUNT';
  const recipientType = isLinkedAccount ? 'LINKED_ACCOUNT' : 'RECIPIENT';

  // Track loading state for unsaved recipient "submission"
  const [isSubmittingUnsaved, setIsSubmittingUnsaved] = useState(false);

  // Fetch the full recipient data (only for saved recipients)
  const {
    data: recipient,
    isLoading: isLoadingRecipient,
    error: fetchError,
  } = useGetRecipient(payee.id, {
    query: {
      enabled: !isUnsaved, // Don't fetch for unsaved recipients
    },
  });

  // Get base config based on payee type
  const linkedAccountConfig = useLinkedAccountConfig();
  const recipientConfig = useRecipientConfig();

  // Use the recipient form hook for API submission (edit mode) - only for saved recipients
  const {
    submit,
    status,
    error: formError,
    reset,
  } = useRecipientForm({
    mode: 'edit',
    recipientId: isUnsaved ? undefined : payee.id,
    recipientType,
    onSuccess: (updatedRecipient) => {
      if (updatedRecipient) {
        onSuccess(updatedRecipient);
      }
    },
  });

  // Build a fake Recipient object from unsaved recipient for form pre-fill
  const recipientForForm = useMemo(() => {
    if (!isUnsaved || !unsavedRecipient) return recipient;

    const { transactionRecipient } = unsavedRecipient;
    const { partyDetails, account } = transactionRecipient;

    return {
      id: 'unsaved',
      partyDetails: {
        type: partyDetails?.type,
        firstName:
          partyDetails?.type === 'INDIVIDUAL'
            ? partyDetails?.firstName
            : undefined,
        lastName:
          partyDetails?.type === 'INDIVIDUAL'
            ? partyDetails?.lastName
            : undefined,
        businessName:
          partyDetails?.type === 'ORGANIZATION'
            ? partyDetails?.businessName
            : undefined,
        address: partyDetails?.address,
        contacts: partyDetails?.contacts,
      },
      account: {
        number: account?.number,
        type: account?.type,
        routingInformation: account?.routingInformation?.map((ri) => ({
          routingCodeType: ri.routingCodeType,
          routingNumber: ri.routingNumber,
          transactionType: ri.transactionType,
        })),
      },
    } as Recipient;
  }, [isUnsaved, unsavedRecipient, recipient]);

  // Build customized config for enabling the payment method
  const config: BankAccountFormConfig = useMemo(() => {
    const baseConfig = isLinkedAccount ? linkedAccountConfig : recipientConfig;

    // Get the payment method type to enable
    const methodToEnable = paymentMethod.id as 'ACH' | 'WIRE' | 'RTP';

    // Combine existing enabled methods with the new method
    const existingMethods = (payee.enabledPaymentMethods || []) as Array<
      'ACH' | 'WIRE' | 'RTP'
    >;
    const allMethods = [...new Set([...existingMethods, methodToEnable])];

    return {
      ...baseConfig,
      paymentMethods: {
        ...baseConfig.paymentMethods,
        // Only show the methods that will be enabled (existing + new)
        available: allMethods,
        // Pre-select all methods including the new one
        defaultSelected: allMethods,
      },
      // Make account holder fields read-only since we're just adding a payment method
      readonlyFields: {
        accountType: true,
        firstName: true,
        lastName: true,
        businessName: true,
        accountNumber: true,
        bankAccountType: true,
      },
      content: {
        ...baseConfig.content,
        submitButtonText: `Enable ${paymentMethod.name}`,
        cancelButtonText: 'Cancel',
      },
    };
  }, [
    isLinkedAccount,
    linkedAccountConfig,
    recipientConfig,
    paymentMethod,
    payee.enabledPaymentMethods,
  ]);

  // Compute initial payment types - must include both existing and new methods
  const initialPaymentTypes = useMemo(() => {
    const methodToEnable = paymentMethod.id as 'ACH' | 'WIRE' | 'RTP';
    const existingMethods = (payee.enabledPaymentMethods || []) as Array<
      'ACH' | 'WIRE' | 'RTP'
    >;
    return [...new Set([...existingMethods, methodToEnable])];
  }, [payee.enabledPaymentMethods, paymentMethod.id]);

  /**
   * Transform BankAccountFormData to UnsavedRecipient
   */
  const transformToUnsavedRecipient = (
    data: BankAccountFormData
  ): UnsavedRecipient => {
    const displayName =
      data.accountType === 'INDIVIDUAL'
        ? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()
        : (data.businessName ?? 'Recipient');

    const primaryRoutingNumber = data.routingNumbers[0]?.routingNumber ?? '';

    const routingInformation = data.routingNumbers.map((routingConfig) => ({
      routingCodeType: 'USABA' as const,
      routingNumber: routingConfig.routingNumber,
      transactionType: routingConfig.paymentType,
    }));

    const transactionRecipient: TransactionRecipientDetailsV2 = {
      account: {
        countryCode: 'US',
        number: data.accountNumber,
        routingInformation,
        type: data.bankAccountType,
      },
      partyDetails: {
        type: data.accountType,
        ...(data.accountType === 'INDIVIDUAL'
          ? {
              firstName: data.firstName!,
              lastName: data.lastName!,
            }
          : {
              businessName: data.businessName!,
            }),
        ...(data.address && {
          address: {
            addressLine1: data.address.addressLine1,
            addressLine2: data.address.addressLine2,
            addressLine3: data.address.addressLine3,
            city: data.address.city,
            state: data.address.state,
            postalCode: data.address.postalCode,
            countryCode: data.address.countryCode,
          },
        }),
        ...(data.contacts &&
          data.contacts.length > 0 && {
            contacts: data.contacts,
          }),
      },
      recipientType: 'RECIPIENT',
    };

    return {
      displayName,
      accountNumber: data.accountNumber,
      routingNumber: primaryRoutingNumber,
      bankName: undefined,
      enabledPaymentMethods: data.paymentTypes as Array<'ACH' | 'RTP' | 'WIRE'>,
      recipientType:
        data.accountType === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'BUSINESS',
      transactionRecipient,
    };
  };

  // Handle form submission
  const handleSubmit = (data: BankAccountFormData) => {
    if (isUnsaved && onUnsavedSuccess) {
      // For unsaved recipients, just transform and return
      setIsSubmittingUnsaved(true);
      const updated = transformToUnsavedRecipient(data);
      // Small delay to show loading state
      setTimeout(() => {
        setIsSubmittingUnsaved(false);
        onUnsavedSuccess(updated);
      }, 100);
    } else {
      // For saved recipients, submit via API
      submit(data);
    }
  };

  // Reset on cancel
  const handleCancel = () => {
    reset();
    onCancel();
  };

  // Loading state (only for saved recipients)
  if (!isUnsaved && isLoadingRecipient) {
    return (
      <div className="eb-flex eb-flex-col eb-gap-3">
        <div className="eb-px-1">
          <Skeleton className="eb-h-7 eb-w-48" />
          <Skeleton className="eb-mt-2 eb-h-5 eb-w-64" />
        </div>
        <div className="eb-rounded-lg eb-border eb-bg-card eb-p-4">
          <div className="eb-space-y-4">
            <Skeleton className="eb-h-10 eb-w-full" />
            <Skeleton className="eb-h-10 eb-w-full" />
            <Skeleton className="eb-h-10 eb-w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error fetching recipient (only for saved recipients)
  if (!isUnsaved && fetchError) {
    return (
      <div className="eb-flex eb-flex-col eb-gap-3">
        <ServerErrorAlert
          error={fetchError as any}
          customTitle="Failed to load recipient"
          customErrorMessage={{
            '404': 'The recipient could not be found.',
            default: 'An error occurred while loading the recipient details.',
          }}
          tryAgainAction={onCancel}
        />
      </div>
    );
  }

  const isLoading = isUnsaved ? isSubmittingUnsaved : status === 'pending';

  return (
    <div className="eb-flex eb-flex-col eb-gap-3">
      {/* Header */}
      <div className="eb-px-1">
        <h2 className="eb-text-lg eb-font-semibold">
          Enable {paymentMethod.name}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          Add {paymentMethod.name.toLowerCase()} capability for {payee.name}
        </p>
      </div>

      {/* Form - embedded in a bordered card for visual separation */}
      <div className="eb-rounded-lg eb-border eb-bg-card">
        <BankAccountForm
          key={`${payee.id}-${recipientForForm?.id}`}
          config={config}
          recipient={recipientForForm}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          showCard={false}
          embedded
          skipStepOne
          initialPaymentTypes={initialPaymentTypes}
          alert={
            formError ? (
              <ServerErrorAlert
                error={formError as any}
                customTitle={`Failed to enable ${paymentMethod.name}`}
                customErrorMessage={{
                  '400':
                    'Please check the information you entered and try again.',
                  '401':
                    'Your session has expired. Please log in and try again.',
                  '422':
                    'The information provided is invalid. Please verify and try again.',
                  '500':
                    'An unexpected error occurred. Please try again later.',
                  default: 'An unexpected error occurred. Please try again.',
                }}
                showDetails={false}
              />
            ) : undefined
          }
        />
      </div>
    </div>
  );
}
