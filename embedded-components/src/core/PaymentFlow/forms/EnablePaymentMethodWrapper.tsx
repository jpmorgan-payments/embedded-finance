'use client';

import React, { useMemo } from 'react';

import { useGetRecipient } from '@/api/generated/ep-recipients';
import type { Recipient } from '@/api/generated/ep-recipients.schemas';
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

import type { Payee, PaymentMethod } from '../PaymentFlow.types';

/**
 * Props for EnablePaymentMethodWrapper
 */
export interface EnablePaymentMethodWrapperProps {
  /** The payee (recipient or linked account) to enable the payment method for */
  payee: Payee;
  /** The payment method to enable */
  paymentMethod: PaymentMethod;
  /** Callback when recipient is successfully updated */
  onSuccess: (recipient: Recipient) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
}

/**
 * EnablePaymentMethodWrapper
 *
 * Uses the BankAccountForm in edit mode to enable a new payment method
 * for an existing payee (recipient or linked account).
 */
export function EnablePaymentMethodWrapper({
  payee,
  paymentMethod,
  onSuccess,
  onCancel,
}: EnablePaymentMethodWrapperProps) {
  const isLinkedAccount = payee.type === 'LINKED_ACCOUNT';
  const recipientType = isLinkedAccount ? 'LINKED_ACCOUNT' : 'RECIPIENT';

  // Fetch the full recipient data
  const {
    data: recipient,
    isLoading: isLoadingRecipient,
    error: fetchError,
  } = useGetRecipient(payee.id);

  // Get base config based on payee type
  const linkedAccountConfig = useLinkedAccountConfig();
  const recipientConfig = useRecipientConfig();

  // Use the recipient form hook for API submission (edit mode)
  const {
    submit,
    status,
    error: formError,
    reset,
  } = useRecipientForm({
    mode: 'edit',
    recipientId: payee.id,
    recipientType,
    onSuccess: (updatedRecipient) => {
      if (updatedRecipient) {
        onSuccess(updatedRecipient);
      }
    },
  });

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

  // Handle form submission
  const handleSubmit = (data: BankAccountFormData) => {
    submit(data);
  };

  // Reset on cancel
  const handleCancel = () => {
    reset();
    onCancel();
  };

  // Loading state
  if (isLoadingRecipient) {
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

  // Error fetching recipient
  if (fetchError) {
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
          key={`${payee.id}-${recipient?.id}`}
          config={config}
          recipient={recipient}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={status === 'pending'}
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
