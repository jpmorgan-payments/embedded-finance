'use client';

import React, { useMemo } from 'react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { useClientId } from '@/core/EBComponentsProvider/EBComponentsProvider';
import {
  BankAccountForm,
  useLinkedAccountConfig,
  useRecipientConfig,
  type BankAccountFormConfig,
  type BankAccountFormData,
} from '@/core/RecipientWidgets/components/BankAccountForm';
import { useRecipientForm } from '@/core/RecipientWidgets/hooks/useRecipientForm';

import type { PaymentMethod } from '../PaymentFlow.types';

/**
 * Form type for the BankAccountFormWrapper
 */
export type BankAccountFormType = 'linked-account' | 'recipient';

/**
 * Props for BankAccountFormWrapper
 */
export interface BankAccountFormWrapperProps {
  /** Type of form to render */
  formType: BankAccountFormType;
  /** Available payment methods */
  availablePaymentMethods?: PaymentMethod[];
  /** Callback when recipient is successfully created and should be selected */
  onSuccess: (recipient: Recipient) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
}

/**
 * BankAccountFormWrapper
 *
 * Wraps the shared BankAccountForm component for use in PaymentFlow.
 * Handles API submission and provides proper configuration for both
 * linked accounts and recipients.
 *
 * This reduces duplication and ensures consistent form behavior across
 * the PaymentFlow and RecipientWidgets.
 */
export function BankAccountFormWrapper({
  formType,
  availablePaymentMethods,
  onSuccess,
  onCancel,
}: BankAccountFormWrapperProps) {
  // Get base config based on form type
  const linkedAccountConfig = useLinkedAccountConfig();
  const recipientConfig = useRecipientConfig();

  // Fetch client data for linked accounts (needed for individual selector prefill)
  const clientId = useClientId();
  const { data: clientData } = useSmbdoGetClient(clientId ?? '', {
    query: {
      enabled: formType === 'linked-account' && !!clientId,
    },
  });

  // Determine recipient type for API
  const recipientType =
    formType === 'linked-account' ? 'LINKED_ACCOUNT' : 'RECIPIENT';

  // Use the recipient form hook for API submission
  const {
    submit,
    status,
    error: formError,
    reset,
  } = useRecipientForm({
    mode: 'create',
    recipientType,
    onSuccess: (recipient) => {
      if (recipient) {
        onSuccess(recipient);
      }
    },
  });

  // Build customized config
  const config: BankAccountFormConfig = useMemo(() => {
    const baseConfig =
      formType === 'linked-account' ? linkedAccountConfig : recipientConfig;
    const isLinkedAccount = formType === 'linked-account';

    // For recipients, filter available payment methods if specified
    if (!isLinkedAccount && availablePaymentMethods) {
      const availableMethodIds = availablePaymentMethods.map(
        (m) => m.id
      ) as Array<'ACH' | 'WIRE' | 'RTP'>;
      return {
        ...baseConfig,
        paymentMethods: {
          ...baseConfig.paymentMethods,
          available: baseConfig.paymentMethods.available.filter((m) =>
            availableMethodIds.includes(m as 'ACH' | 'WIRE' | 'RTP')
          ),
        },
        // Customize content for embedded flow
        content: {
          ...baseConfig.content,
          submitButtonText: 'Add Recipient',
          cancelButtonText: 'Cancel',
        },
      };
    }

    // For linked accounts, just customize the submit button text
    return {
      ...baseConfig,
      content: {
        ...baseConfig.content,
        submitButtonText: isLinkedAccount ? 'Link Account' : 'Add Recipient',
        cancelButtonText: 'Cancel',
      },
    };
  }, [formType, linkedAccountConfig, recipientConfig, availablePaymentMethods]);

  // Handle form submission
  const handleSubmit = (data: BankAccountFormData) => {
    submit(data);
  };

  // Reset on cancel
  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <div className="eb-flex eb-flex-col eb-gap-3">
      {/* Header */}
      <div className="eb-px-1">
        <h2 className="eb-text-lg eb-font-semibold">
          {formType === 'linked-account' ? 'Link My Account' : 'Add Recipient'}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {formType === 'linked-account'
            ? 'Connect your account from another bank for transfers.'
            : 'Add a new person or business to send payments to.'}
        </p>
      </div>

      {/* Form - embedded in a bordered card for visual separation */}
      <div className="eb-rounded-lg eb-border eb-bg-card">
        <BankAccountForm
          config={config}
          client={formType === 'linked-account' ? clientData : undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={status === 'pending'}
          showCard={false}
          embedded
          alert={
            formError ? (
              <ServerErrorAlert
                error={formError as any}
                customTitle={
                  formType === 'linked-account'
                    ? 'Failed to link account'
                    : 'Failed to add recipient'
                }
                customErrorMessage={{
                  '400':
                    'Please check the information you entered and try again.',
                  '401':
                    'Your session has expired. Please log in and try again.',
                  '409':
                    'This account may already exist. Please check your linked accounts.',
                  '422':
                    'The account information is invalid. Please verify and try again.',
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
