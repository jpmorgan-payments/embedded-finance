'use client';

import React, { useMemo, useState } from 'react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import type { TransactionRecipientDetailsV2 } from '@/api/generated/ep-transactions.schemas';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import {
  useClientId,
  useInterceptorStatus,
} from '@/core/EBComponentsProvider/EBComponentsProvider';
import {
  BankAccountForm,
  useLinkedAccountConfig,
  useRecipientConfig,
  type BankAccountFormConfig,
  type BankAccountFormData,
} from '@/core/RecipientWidgets/components/BankAccountForm';
import { useRecipientForm } from '@/core/RecipientWidgets/hooks/useRecipientForm';

import type { PaymentMethod, UnsavedRecipient } from '../PaymentFlow.types';

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
  /** Callback when recipient data is submitted without saving (one-time payment) */
  onSubmitWithoutSave?: (unsavedRecipient: UnsavedRecipient) => void;
  /** Callback when form is cancelled */
  onCancel: () => void;
  /** Callback to switch to adding a recipient (only shown when formType is 'linked-account') */
  onSwitchToRecipient?: () => void;
  /** Callback to switch to linking an account (only shown when formType is 'recipient') */
  onSwitchToLinkedAccount?: () => void;
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
  onSubmitWithoutSave,
  onCancel,
  onSwitchToRecipient,
  onSwitchToLinkedAccount,
}: BankAccountFormWrapperProps) {
  // State for "Save for future payments" checkbox (only shown for recipients when onSubmitWithoutSave is provided)
  const [saveForFuture, setSaveForFuture] = useState(true);

  // Get base config based on form type
  const linkedAccountConfig = useLinkedAccountConfig();
  const recipientConfig = useRecipientConfig();

  // Fetch client data for linked accounts (needed for individual selector prefill)
  const clientId = useClientId();
  const { interceptorReady } = useInterceptorStatus();
  const { data: clientData } = useSmbdoGetClient(clientId ?? '', {
    query: {
      enabled: interceptorReady && formType === 'linked-account' && !!clientId,
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

  /**
   * Transform BankAccountFormData to UnsavedRecipient for one-time payments
   */
  const transformToUnsavedRecipient = (
    data: BankAccountFormData
  ): UnsavedRecipient => {
    // Build display name
    const displayName =
      data.accountType === 'INDIVIDUAL'
        ? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()
        : (data.businessName ?? 'Recipient');

    // Get the first routing number (use primary one)
    const primaryRoutingNumber = data.routingNumbers[0]?.routingNumber ?? '';

    // Build routing information for transaction
    const routingInformation = data.routingNumbers.map((routingConfig) => ({
      routingCodeType: 'USABA' as const,
      routingNumber: routingConfig.routingNumber,
      transactionType: routingConfig.paymentType,
    }));

    // Build transaction recipient structure
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
      bankName: undefined, // Not captured in form
      enabledPaymentMethods: data.paymentTypes as Array<'ACH' | 'RTP' | 'WIRE'>,
      recipientType:
        data.accountType === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'BUSINESS',
      transactionRecipient,
    };
  };

  // Handle form submission
  const handleSubmit = (data: BankAccountFormData) => {
    // For recipients with save option disabled, use one-time flow
    if (formType === 'recipient' && !saveForFuture && onSubmitWithoutSave) {
      const unsavedRecipient = transformToUnsavedRecipient(data);
      onSubmitWithoutSave(unsavedRecipient);
      return;
    }

    // Default: save the recipient via API
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
        {/* Switch option link */}
        {formType === 'linked-account' && onSwitchToRecipient && (
          <button
            type="button"
            onClick={onSwitchToRecipient}
            className="eb-mt-2 eb-text-sm eb-text-primary eb-underline-offset-4 hover:eb-underline"
          >
            Or add an external recipient instead
          </button>
        )}
        {formType === 'recipient' && onSwitchToLinkedAccount && (
          <button
            type="button"
            onClick={onSwitchToLinkedAccount}
            className="eb-mt-2 eb-text-sm eb-text-primary eb-underline-offset-4 hover:eb-underline"
          >
            Or link my account instead
          </button>
        )}
      </div>

      {/* Save for future payments checkbox - only for recipients when onSubmitWithoutSave is provided */}
      {formType === 'recipient' && onSubmitWithoutSave && (
        <div className="eb-flex eb-items-center eb-gap-2 eb-px-1">
          <Checkbox
            id="save-for-future"
            checked={saveForFuture}
            onCheckedChange={(checked) => setSaveForFuture(checked === true)}
          />
          <Label
            htmlFor="save-for-future"
            className="eb-cursor-pointer eb-text-sm eb-font-normal"
          >
            Save this recipient for future payments
          </Label>
        </div>
      )}

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
