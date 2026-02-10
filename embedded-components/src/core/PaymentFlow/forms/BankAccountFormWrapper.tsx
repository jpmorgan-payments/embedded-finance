'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Save, UserX } from 'lucide-react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import type { TransactionRecipientDetailsV2 } from '@/api/generated/ep-transactions.schemas';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Button } from '@/components/ui/button';
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
  /** Initial data to pre-fill the form (for editing unsaved recipients) */
  initialData?: UnsavedRecipient;
  /** Whether we're editing an existing unsaved recipient */
  isEditing?: boolean;
  /** Whether to skip step 1 (payment method selection) and go directly to step 2 */
  skipStepOne?: boolean;
}

/**
 * BankAccountFormWrapper
 *
 * Wraps the shared BankAccountForm component for use in PaymentFlow.
 * Handles API submission and provides proper configuration for both
 * linked accounts and recipients.
 *
 * For recipients, shows a confirmation step after form validation
 * where user can choose to save or use without saving.
 */
export function BankAccountFormWrapper({
  formType,
  availablePaymentMethods,
  onSuccess,
  onSubmitWithoutSave,
  onCancel,
  onSwitchToRecipient,
  onSwitchToLinkedAccount,
  initialData,
  isEditing = false,
  skipStepOne = false,
}: BankAccountFormWrapperProps) {
  // For recipients with one-time option, show confirmation step after form
  // Don't pre-initialize from initialData - we want to show the form first when editing
  const [pendingFormData, setPendingFormData] =
    useState<BankAccountFormData | null>(null);

  // Track form data to restore when returning from confirmation
  const [formDataToRestore, setFormDataToRestore] =
    useState<BankAccountFormData | null>(null);

  // Key to force form remount when returning from confirmation
  const [formKey, setFormKey] = useState(0);

  /**
   * Transform BankAccountFormData to a Recipient-like object for form pre-fill
   */
  const transformFormDataToRecipient = (
    data: BankAccountFormData
  ): Recipient => {
    return {
      id: 'restoring',
      partyDetails: {
        type: data.accountType,
        firstName:
          data.accountType === 'INDIVIDUAL' ? data.firstName : undefined,
        lastName: data.accountType === 'INDIVIDUAL' ? data.lastName : undefined,
        businessName:
          data.accountType === 'ORGANIZATION' ? data.businessName : undefined,
        address: data.address,
        contacts: data.contacts,
      },
      account: {
        number: data.accountNumber,
        type: data.bankAccountType,
        routingInformation: data.routingNumbers.map((rn) => ({
          routingCodeType: 'USABA' as const,
          routingNumber: rn.routingNumber,
          transactionType: rn.paymentType,
        })),
      },
    } as Recipient;
  };

  // Transform UnsavedRecipient to a Recipient-like object for form pre-fill
  const recipientForEdit = useMemo(() => {
    // First priority: restore form data when returning from confirmation
    if (formDataToRestore) {
      return transformFormDataToRecipient(formDataToRestore);
    }
    // Second priority: use initialData when editing existing unsaved recipient
    if (!initialData) return undefined;
    const { transactionRecipient } = initialData;
    const { partyDetails, account } = transactionRecipient;
    // Create a fake Recipient object that BankAccountForm can use for default values
    return {
      id: 'editing',
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
  }, [initialData, formDataToRestore]);
  const showConfirmation =
    formType === 'recipient' && onSubmitWithoutSave && pendingFormData !== null;

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

    // Determine button text
    let submitButtonText = isLinkedAccount ? 'Link Account' : 'Add Recipient';
    if (isEditing) {
      submitButtonText = 'Continue';
    } else if (!isLinkedAccount && onSubmitWithoutSave) {
      // When one-time option is available, use "Continue" to go to confirmation
      submitButtonText = 'Continue';
    }

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
        content: {
          ...baseConfig.content,
          submitButtonText,
          cancelButtonText: 'Cancel',
        },
      };
    }

    return {
      ...baseConfig,
      content: {
        ...baseConfig.content,
        submitButtonText,
        cancelButtonText: 'Cancel',
      },
    };
  }, [
    formType,
    linkedAccountConfig,
    recipientConfig,
    availablePaymentMethods,
    isEditing,
    onSubmitWithoutSave,
  ]);

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
    // For recipients with one-time option, go to confirmation step
    if (formType === 'recipient' && onSubmitWithoutSave) {
      setPendingFormData(data);
      return;
    }

    // Default: save the recipient via API
    submit(data);
  };

  // Handle "Save & Add" from confirmation
  const handleSaveAndAdd = () => {
    if (pendingFormData) {
      submit(pendingFormData);
    }
  };

  // Handle "Use Without Saving" from confirmation
  const handleUseWithoutSaving = () => {
    if (pendingFormData && onSubmitWithoutSave) {
      const unsavedRecipient = transformToUnsavedRecipient(pendingFormData);
      onSubmitWithoutSave(unsavedRecipient);
    }
  };

  // Go back to form from confirmation
  const handleBackToForm = () => {
    // Save the form data so we can restore it
    setFormDataToRestore(pendingFormData);
    setPendingFormData(null);
    // Increment key to force form remount with restored data
    setFormKey((k) => k + 1);
    reset();
  };

  // Reset on cancel
  const handleCancel = () => {
    reset();
    setPendingFormData(null);
    onCancel();
  };

  // Get display name from pending form data
  const getPendingDisplayName = () => {
    if (!pendingFormData) return '';
    return pendingFormData.accountType === 'INDIVIDUAL'
      ? `${pendingFormData.firstName ?? ''} ${pendingFormData.lastName ?? ''}`.trim()
      : (pendingFormData.businessName ?? 'Recipient');
  };

  // Confirmation step view
  if (showConfirmation) {
    return (
      <div className="eb-flex eb-flex-col eb-gap-4">
        {/* Header */}
        <div className="eb-px-1">
          <h2 className="eb-text-lg eb-font-semibold">Save Recipient?</h2>
          <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
            Would you like to save{' '}
            <span className="eb-font-medium eb-text-foreground">
              {getPendingDisplayName()}
            </span>{' '}
            for future payments?
          </p>
        </div>

        {/* Error alert */}
        {formError && (
          <ServerErrorAlert
            error={formError as any}
            customTitle="Failed to add recipient"
            customErrorMessage={{
              '400': 'Please check the information you entered and try again.',
              '401': 'Your session has expired. Please log in and try again.',
              '409': 'This recipient may already exist.',
              '422':
                'The recipient information is invalid. Please verify and try again.',
              '500': 'An unexpected error occurred. Please try again later.',
              default: 'An unexpected error occurred. Please try again.',
            }}
            showDetails={false}
          />
        )}

        {/* Action buttons */}
        <div className="eb-flex eb-flex-col eb-gap-3">
          <Button
            onClick={handleSaveAndAdd}
            disabled={status === 'pending'}
            className="eb-w-full eb-justify-start eb-gap-3 eb-px-4 eb-py-6"
            variant="outline"
          >
            {status === 'pending' ? (
              <Loader2 className="eb-h-5 eb-w-5 eb-animate-spin eb-text-primary" />
            ) : (
              <Save className="eb-h-5 eb-w-5 eb-text-primary" />
            )}
            <div className="eb-text-left">
              <div className="eb-font-medium">Save & Continue</div>
              <div className="eb-text-xs eb-font-normal eb-text-muted-foreground">
                Add to your recipients for easy access
              </div>
            </div>
          </Button>

          <Button
            onClick={handleUseWithoutSaving}
            disabled={status === 'pending'}
            variant="outline"
            className="eb-w-full eb-justify-start eb-gap-3 eb-px-4 eb-py-6"
          >
            <UserX className="eb-h-5 eb-w-5 eb-text-muted-foreground" />
            <div className="eb-text-left">
              <div className="eb-font-medium">Use Once</div>
              <div className="eb-text-xs eb-font-normal eb-text-muted-foreground">
                For this payment only
              </div>
            </div>
          </Button>
        </div>

        {/* Back link */}
        <button
          type="button"
          onClick={handleBackToForm}
          disabled={status === 'pending'}
          className="eb-flex eb-items-center eb-gap-1 eb-text-sm eb-text-primary hover:eb-underline disabled:eb-opacity-50"
        >
          <ArrowLeft className="eb-h-3.5 eb-w-3.5" />
          Edit recipient details
        </button>
      </div>
    );
  }

  // Main form view
  return (
    <div className="eb-flex eb-flex-col eb-gap-3">
      {/* Header */}
      <div className="eb-px-1">
        <h2 className="eb-text-lg eb-font-semibold">
          {formType === 'linked-account'
            ? 'Link My Account'
            : isEditing
              ? 'Edit Recipient'
              : 'Add Recipient'}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {formType === 'linked-account'
            ? 'Connect your account from another bank for transfers.'
            : isEditing
              ? 'Update the recipient details below.'
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
        {formType === 'recipient' && onSwitchToLinkedAccount && !isEditing && (
          <button
            type="button"
            onClick={onSwitchToLinkedAccount}
            className="eb-mt-2 eb-text-sm eb-text-primary eb-underline-offset-4 hover:eb-underline"
          >
            Or link my account instead
          </button>
        )}
      </div>

      {/* Form - embedded in a bordered card for visual separation */}
      <div className="eb-rounded-lg eb-border eb-bg-card">
        <BankAccountForm
          key={formKey}
          config={config}
          client={formType === 'linked-account' ? clientData : undefined}
          recipient={recipientForEdit}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={status === 'pending'}
          showCard={false}
          embedded
          skipStepOne={skipStepOne}
          initialStep={formDataToRestore ? 2 : 1}
          initialPaymentTypes={
            formDataToRestore?.paymentTypes ??
            (initialData?.enabledPaymentMethods as Array<
              'ACH' | 'WIRE' | 'RTP'
            >)
          }
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
