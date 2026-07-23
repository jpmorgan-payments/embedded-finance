'use client';

import { useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ArrowLeft, Loader2, Save, UserX } from 'lucide-react';

import type { Recipient } from '@/api/generated/ep-recipients.schemas';
import type {
  CountryCode,
  TransactionRecipientDetailsV2,
} from '@/api/generated/ep-transactions.schemas';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

import { CurrencyFlag } from '../../PaymentFlowFX/components/CurrencyFlag';
import { FxRailDisclaimer } from '../../PaymentFlowFX/components/FxRailDisclaimer';
import {
  getFxAvailableRails,
  getFxCurrencyRequirement,
  getFxRoutingCodeType,
} from '../../PaymentFlowFX/fxRecipientRequirements';
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
  /** Initial error to display (e.g., from a failed save attempt from unsaved recipient card) */
  initialError?: Error | null;
  /**
   * Enable cross-border (FX) recipient capture (FR-FX-10). When true, a
   * "Recipient's account currency" select is shown; choosing a non-USD currency
   * tags the created recipient with `account.currencyCode` so the downstream FX
   * flow can derive `targetCurrency`. The tag is also applied client-side so the
   * flow has the currency immediately, without waiting for the create response to
   * echo it back. Default: `false` (domestic only, identical to today's behavior).
   */
  internationalMode?: boolean;
  /** Currencies selectable when {@link internationalMode} is on (USD is always the default). */
  supportedCurrencies?: string[];
  /**
   * Optional map of currency code ⇒ display name (e.g. `{ EUR: 'Euro' }`) used to
   * render friendlier options like "EUR — Euro". Falls back to the bare code.
   */
  currencyLabels?: Record<string, string>;
}

/**
 * Confirmation step shown after a recipient form is validated, letting the user
 * choose to save the recipient or use it once without saving.
 */
interface SaveRecipientConfirmationProps {
  recipientName: string;
  status: string;
  formError: unknown;
  initialError: Error | null;
  onSaveAndAdd: () => void;
  onUseWithoutSaving: () => void;
  onBackToForm: () => void;
}

function SaveRecipientConfirmation({
  recipientName,
  status,
  formError,
  initialError,
  onSaveAndAdd,
  onUseWithoutSaving,
  onBackToForm,
}: SaveRecipientConfirmationProps) {
  const { t } = useTranslationWithTokens(['make-payment']);

  return (
    <div className="eb-flex eb-flex-col eb-gap-4">
      {/* Header */}
      <div className="eb-px-1">
        <h2 className="eb-text-lg eb-font-semibold">
          {t('bankAccountForm.saveRecipientTitle', 'Save Recipient?')}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {t(
            'bankAccountForm.saveRecipientDescription',
            'Would you like to save {{recipientName}} for future payments?',
            { recipientName }
          )}
        </p>
      </div>

      {/* Error alert */}
      {(formError || initialError) && (
        <ServerErrorAlert
          error={(formError || initialError) as any}
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
          onClick={onSaveAndAdd}
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
            <div className="eb-font-medium">
              {t('bankAccountForm.saveAndContinue', 'Save & Continue')}
            </div>
            <div className="eb-text-xs eb-font-normal eb-text-muted-foreground">
              {t(
                'bankAccountForm.saveDescription',
                'Add to your recipients for easy access'
              )}
            </div>
          </div>
        </Button>

        <Button
          onClick={onUseWithoutSaving}
          disabled={status === 'pending'}
          variant="outline"
          className="eb-w-full eb-justify-start eb-gap-3 eb-px-4 eb-py-6"
        >
          <UserX className="eb-h-5 eb-w-5 eb-text-muted-foreground" />
          <div className="eb-text-left">
            <div className="eb-font-medium">
              {t('bankAccountForm.useOnce', 'Use Once')}
            </div>
            <div className="eb-text-xs eb-font-normal eb-text-muted-foreground">
              {t('bankAccountForm.useOnceDescription', 'For this payment only')}
            </div>
          </div>
        </Button>
      </div>

      {/* Back link */}
      <button
        type="button"
        onClick={onBackToForm}
        disabled={status === 'pending'}
        className="eb-flex eb-items-center eb-gap-1 eb-text-sm eb-text-primary hover:eb-underline disabled:eb-opacity-50"
      >
        <ArrowLeft className="eb-h-3.5 eb-w-3.5" />
        {t('bankAccountForm.editRecipientDetails', 'Edit recipient details')}
      </button>
    </div>
  );
}

/**
 * Header for the bank account form: title, description, and the option to switch
 * between linking an account and adding a recipient.
 */
interface BankAccountFormHeaderProps {
  formType: BankAccountFormType;
  isEditing: boolean;
  onSwitchToRecipient?: () => void;
  onSwitchToLinkedAccount?: () => void;
}

function BankAccountFormHeader({
  formType,
  isEditing,
  onSwitchToRecipient,
  onSwitchToLinkedAccount,
}: BankAccountFormHeaderProps) {
  const { t } = useTranslationWithTokens(['make-payment']);
  const isLinkedAccount = formType === 'linked-account';

  const getTitle = () => {
    if (isLinkedAccount) {
      return t('bankAccountForm.linkMyAccountTitle', 'Link My Account');
    }
    if (isEditing) {
      return t('bankAccountForm.editRecipientTitle', 'Edit Recipient');
    }
    return t('bankAccountForm.addRecipientTitle', 'Add Recipient');
  };

  const getDescription = () => {
    if (isLinkedAccount) {
      return t(
        'bankAccountForm.linkMyAccountDescription',
        'Connect your account from another bank for transfers.'
      );
    }
    if (isEditing) {
      return t(
        'bankAccountForm.editRecipientDescription',
        'Update the recipient details below.'
      );
    }
    return t(
      'bankAccountForm.addRecipientDescription',
      'Add a new person or business to send payments to.'
    );
  };

  return (
    <div className="eb-px-1">
      <h2 className="eb-text-lg eb-font-semibold">{getTitle()}</h2>
      <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
        {getDescription()}
      </p>
      {/* Switch option link */}
      {isLinkedAccount && onSwitchToRecipient && (
        <button
          type="button"
          onClick={onSwitchToRecipient}
          className="eb-mt-2 eb-text-sm eb-text-primary eb-underline-offset-4 hover:eb-underline"
        >
          {t(
            'bankAccountForm.switchToRecipient',
            'Or add an external recipient instead'
          )}
        </button>
      )}
      {!isLinkedAccount && onSwitchToLinkedAccount && !isEditing && (
        <button
          type="button"
          onClick={onSwitchToLinkedAccount}
          className="eb-mt-2 eb-text-sm eb-text-primary eb-underline-offset-4 hover:eb-underline"
        >
          {t(
            'bankAccountForm.switchToLinkedAccount',
            'Or link my account instead'
          )}
        </button>
      )}
    </div>
  );
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
  initialError = null,
  internationalMode = false,
  supportedCurrencies,
  currencyLabels,
}: BankAccountFormWrapperProps) {
  // If there's an initial error with originalFormData, seed both the confirmation
  // and restore state so the form re-opens at step 2 showing the error.
  const initialFormData =
    initialError && initialData?.originalFormData
      ? initialData.originalFormData
      : null;

  const [pendingFormData, setPendingFormData] =
    useState<BankAccountFormData | null>(initialFormData);

  // Track form data to restore when returning from confirmation
  const [formDataToRestore, setFormDataToRestore] =
    useState<BankAccountFormData | null>(initialFormData);

  // Key to force form remount when returning from confirmation
  const [formKey, setFormKey] = useState(0);

  // FR-FX-10: optional international recipient capture. USD => today's domestic form.
  const [accountCurrency, setAccountCurrency] = useState<string>('USD');
  const isInternational = internationalMode && accountCurrency !== 'USD';
  // The one-time "pay without saving" path is hidden for international recipients (D4/FR-FX-11).
  const effectiveOnSubmitWithoutSave = isInternational
    ? undefined
    : onSubmitWithoutSave;

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
    formType === 'recipient' &&
    effectiveOnSubmitWithoutSave &&
    pendingFormData !== null;

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
    // FR-FX-10: international recipients persist the currency's canonical routing
    // code (e.g. AUBSB, INFSC, BIC) instead of the domestic USABA default. Domestic
    // (USD) recipients pass undefined and fall back to USABA in the transform.
    routingCodeType: isInternational
      ? getFxRoutingCodeType(accountCurrency)
      : undefined,
    onSuccess: (recipient) => {
      if (recipient) {
        // FR-FX-10: tag the created recipient with its account currency so the
        // downstream FX flow can derive `targetCurrency`. Applied client-side so
        // the currency is available immediately, without depending on the create
        // response to echo the selected non-USD currency back.
        const tagged = isInternational
          ? ({
              ...recipient,
              account: {
                ...(recipient.account ?? {}),
                currencyCode: accountCurrency,
              },
            } as unknown as Recipient)
          : recipient;
        onSuccess(tagged);
      }
    },
    onError: (apiError) => {
      // Only go back to form step 2 on 400 errors (bad request - user can fix the data)
      // Other errors (401, 500, etc.) should show error on the confirmation step
      const httpStatus = (apiError as any)?.httpStatus;
      if (httpStatus === 400 && pendingFormData) {
        setFormDataToRestore(pendingFormData);
        setPendingFormData(null);
        setFormKey((k) => k + 1);
      }
    },
  });

  // Build customized config
  const { t, tString } = useTranslationWithTokens(['make-payment']);
  const config: BankAccountFormConfig = useMemo(() => {
    const baseConfig =
      formType === 'linked-account' ? linkedAccountConfig : recipientConfig;
    const isLinkedAccount = formType === 'linked-account';

    // Determine button text
    let submitButtonText = isLinkedAccount
      ? tString('bankAccountForm.linkAccountButton', 'Link Account')
      : tString('bankAccountForm.addRecipientButton', 'Add Recipient');
    if (isEditing) {
      submitButtonText = tString('bankAccountForm.continueButton', 'Continue');
    } else if (!isLinkedAccount && effectiveOnSubmitWithoutSave) {
      // When one-time option is available, use "Continue" to go to confirmation
      submitButtonText = tString('bankAccountForm.continueButton', 'Continue');
    }

    // Base config with shared content overrides.
    let nextConfig: BankAccountFormConfig = {
      ...baseConfig,
      content: {
        ...baseConfig.content,
        submitButtonText,
        cancelButtonText: tString('bankAccountForm.cancelButton', 'Cancel'),
      },
    };

    // For recipients, filter available payment methods if specified by the host.
    if (!isLinkedAccount && availablePaymentMethods) {
      const availableMethodIds = availablePaymentMethods.map(
        (m) => m.id
      ) as Array<'ACH' | 'WIRE' | 'RTP'>;
      nextConfig = {
        ...nextConfig,
        paymentMethods: {
          ...nextConfig.paymentMethods,
          available: nextConfig.paymentMethods.available.filter((m) =>
            availableMethodIds.includes(m as 'ACH' | 'WIRE' | 'RTP')
          ),
        },
      };
    }

    // Cross-border (FX) overrides: relabel the account number, restrict rails to
    // those the destination currency supports, and relax the US-domestic field
    // rules (account type, digits-only account number, 9-digit routing).
    if (isInternational) {
      const requirement = getFxCurrencyRequirement(accountCurrency);
      const rails = getFxAvailableRails(accountCurrency);
      if (requirement) {
        // In the FX flow the rails are the product's value tiers, not US
        // networks — surface them as "FX High-value" / "FX Low-value".
        const highValueLabel = tString('fx.rails.label.WIRE', 'FX High-value');
        const lowValueLabel = tString('fx.rails.label.ACH', 'FX Low-value');
        nextConfig = {
          ...nextConfig,
          paymentMethods: {
            ...nextConfig.paymentMethods,
            available:
              rails.length > 0
                ? rails
                : nextConfig.paymentMethods.available.filter(
                    (m) => m !== 'RTP'
                  ),
            defaultSelected:
              rails.length === 1
                ? rails
                : nextConfig.paymentMethods.defaultSelected,
            configs: {
              ...nextConfig.paymentMethods.configs,
              WIRE: {
                ...nextConfig.paymentMethods.configs.WIRE,
                label: highValueLabel,
                labelString: highValueLabel,
                shortLabel: highValueLabel,
                shortLabelString: highValueLabel,
                description: tString(
                  'fx.rails.desc.WIRE',
                  'Time-critical cross-currency payouts (same or next business day)'
                ),
              },
              ACH: {
                ...nextConfig.paymentMethods.configs.ACH,
                label: lowValueLabel,
                labelString: lowValueLabel,
                shortLabel: lowValueLabel,
                shortLabelString: lowValueLabel,
                description: tString(
                  'fx.rails.desc.ACH',
                  'Non-urgent cross-currency payouts (two to five business days)'
                ),
              },
            },
          },
          content: {
            ...nextConfig.content,
            fieldLabels: {
              ...nextConfig.content.fieldLabels,
              accountNumber: requirement.accountNumberLabel,
            },
          },
          internationalFieldConfig: {
            hideBankAccountType: !requirement.requiresAccountType,
            accountNumberFormat: requirement.accountNumberFormat,
            relaxRoutingFormat: true,
            routingCodeLabel: requirement.routingCode?.label,
            routingCodeRequired: requirement.routingCode?.required ?? false,
            hideRoutingNumber: !requirement.routingCode,
          },
        };
      }
    }

    return nextConfig;
  }, [
    formType,
    linkedAccountConfig,
    recipientConfig,
    availablePaymentMethods,
    isEditing,
    effectiveOnSubmitWithoutSave,
    tString,
    isInternational,
    accountCurrency,
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
            city: data.address.city,
            state: data.address.state,
            postalCode: data.address.postalCode,
            countryCode: data.address.countryCode as CountryCode,
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
      // Store original form data for saving later if user decides to save
      originalFormData: data,
    };
  };

  // Handle form submission
  const handleSubmit = (data: BankAccountFormData) => {
    // When editing an unsaved recipient, directly update without asking save/use-once
    if (isEditing && effectiveOnSubmitWithoutSave) {
      const unsavedRecipient = transformToUnsavedRecipient(data);
      effectiveOnSubmitWithoutSave(unsavedRecipient);
      return;
    }

    // For new recipients with one-time option, go to confirmation step
    if (formType === 'recipient' && effectiveOnSubmitWithoutSave) {
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
      <SaveRecipientConfirmation
        recipientName={getPendingDisplayName()}
        status={status}
        formError={formError}
        initialError={initialError}
        onSaveAndAdd={handleSaveAndAdd}
        onUseWithoutSaving={handleUseWithoutSaving}
        onBackToForm={handleBackToForm}
      />
    );
  }

  // Main form view
  return (
    <div className="eb-flex eb-flex-col eb-gap-3">
      <BankAccountFormHeader
        formType={formType}
        isEditing={isEditing}
        onSwitchToRecipient={onSwitchToRecipient}
        onSwitchToLinkedAccount={onSwitchToLinkedAccount}
      />

      {/* FR-FX-10: cross-border recipient currency capture (opt-in via internationalMode) */}
      {internationalMode && formType === 'recipient' && !isEditing && (
        <div className="eb-rounded-lg eb-border eb-bg-card eb-p-4">
          <label
            htmlFor="fx-account-currency"
            className="eb-mb-1.5 eb-block eb-text-sm eb-font-medium"
          >
            {t(
              'bankAccountForm.accountCurrencyLabel',
              "Recipient's account currency"
            )}
          </label>
          <Select value={accountCurrency} onValueChange={setAccountCurrency}>
            <SelectTrigger id="fx-account-currency" className="eb-w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">
                {t(
                  'bankAccountForm.accountCurrencyDomestic',
                  'USD — US Dollar (domestic)'
                )}
              </SelectItem>
              {(supportedCurrencies ?? []).map((cur) => (
                <SelectItem key={cur} value={cur}>
                  <span className="eb-flex eb-items-center eb-gap-2">
                    <CurrencyFlag currency={cur} />
                    <span>
                      {currencyLabels?.[cur]
                        ? `${cur} — ${currencyLabels[cur]}`
                        : cur}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isInternational && (
            <div className="eb-mt-3">
              <FxRailDisclaimer currency={accountCurrency} />
            </div>
          )}
        </div>
      )}

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
          initialStep={formDataToRestore ? 2 : 1}
          initialPaymentTypes={
            formDataToRestore?.paymentTypes ??
            (initialData?.enabledPaymentMethods as Array<
              'ACH' | 'WIRE' | 'RTP'
            >)
          }
          alert={
            formError || initialError ? (
              <ServerErrorAlert
                error={(formError || initialError) as any}
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
