import { FC, ReactNode, useMemo, useState } from 'react';
import { TranslationResult, useTranslationWithTokens } from '@/i18n';

import { Recipient } from '@/api/generated/ep-recipients.schemas';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { ApiError } from '@/api/generated/smbdo.schemas';
import type { ErrorType } from '@/api/use-axios-instance';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useClientId } from '@/core/EBComponentsProvider/EBComponentsProvider';
import { applyFxBankAccountFormOverrides } from '@/core/PaymentFlowFX/applyFxBankAccountFormOverrides';
import { RecipientAccountCurrencySelect } from '@/core/PaymentFlowFX/components/RecipientAccountCurrencySelect';
import { getFxRoutingCodeType } from '@/core/PaymentFlowFX/fxRecipientRequirements';

import { useRecipientForm, type RecipientFormMode } from '../../hooks';
import { RecipientI18nNamespace, SupportedRecipientType } from '../../types';
import {
  BankAccountForm,
  createCustomConfig,
  useLinkedAccountConfig,
  useLinkedAccountEditConfig,
  useRecipientConfig,
  useRecipientEditConfig,
  type BankAccountFormConfig,
  type BankAccountFormData,
  type LinkAccountReviewAcknowledgement,
} from '../BankAccountForm';
import { FriendlyErrorAlert } from '../FriendlyErrorAlert/FriendlyErrorAlert';
import { RecipientAccountDisplayCard } from '../RecipientAccountDisplayCard/RecipientAccountDisplayCard';

/**
 * Props for RecipientFormDialog component
 */
export interface RecipientFormDialogProps {
  /**
   * Dialog trigger element.
   * Optional when using controlled mode (with `open` prop).
   */
  children?: ReactNode;

  /** Form mode - create or edit */
  mode: RecipientFormMode;

  /** Recipient data (required for edit mode) */
  recipient?: Recipient;

  /** Whether dialog is open (controlled mode) */
  open?: boolean;

  /** Callback when dialog open state changes (controlled mode) */
  onOpenChange?: (open: boolean) => void;

  /** Callback when form submission is settled */
  onRecipientSettled?: (recipient?: Recipient, error?: any) => void;

  /**
   * Type of recipient to create/edit
   */
  recipientType: SupportedRecipientType;

  /**
   * i18n namespace to use for translations
   */
  i18nNamespace: RecipientI18nNamespace;

  /**
   * Optional agreement checkboxes when creating a linked account (same behavior as onboarding
   * `linkAccountStepOptions.reviewAcknowledgements` in `editable` mode).
   */
  linkAccountReviewAcknowledgements?: readonly LinkAccountReviewAcknowledgement[];
  /** Show lead-in copy above the acknowledgement group (`onboarding-overview`). */
  showLinkAccountAcknowledgementsIntro?: boolean;
  /**
   * Optional merge on top of {@link useLinkedAccountConfig} for **create** LINKED_ACCOUNT only.
   * Storybook / hosts can expose alternate `paymentMethods.available` sets without forking the dialog.
   */
  linkAccountBankFormConfigOverride?: Partial<BankAccountFormConfig>;

  /**
   * Enable cross-border (FX) recipient capture (FR-FX-10). When true for
   * **create** + `RECIPIENT`, shows "Recipient's account currency" and adapts
   * form fields / rails for non-USD currencies. Edit and linked-account flows
   * ignore this flag.
   *
   * @default false
   */
  internationalMode?: boolean;

  /**
   * Currencies selectable when {@link internationalMode} is on
   * (USD is always listed as the domestic default).
   */
  supportedCurrencies?: string[];

  /**
   * Optional map of currency code ⇒ display name (e.g. `{ EUR: 'Euro' }`).
   */
  currencyLabels?: Record<string, string>;

  /**
   * Show currency badge on the success card. Defaults to `true` when
   * {@link internationalMode} is enabled.
   */
  showRecipientCurrency?: boolean;
}

/**
 * Select the appropriate bank account form config for the given recipient type and mode.
 */
function selectBankAccountConfig(
  recipientType: SupportedRecipientType,
  mode: RecipientFormMode,
  configs: {
    recipientCreate: BankAccountFormConfig;
    recipientEdit: BankAccountFormConfig;
    linkedAccountCreate: BankAccountFormConfig;
    linkedAccountEdit: BankAccountFormConfig;
  }
): BankAccountFormConfig {
  if (recipientType === 'RECIPIENT') {
    return mode === 'create' ? configs.recipientCreate : configs.recipientEdit;
  }
  return mode === 'create'
    ? configs.linkedAccountCreate
    : configs.linkedAccountEdit;
}

function tagRecipientCurrency(
  recipient: Recipient,
  currencyCode: string
): Recipient {
  return {
    ...recipient,
    account: {
      ...(recipient.account ?? {}),
      currencyCode,
    },
  } as unknown as Recipient;
}

interface RecipientFormAlertOptions {
  fxCreateEnabled: boolean;
  accountCurrency: string;
  onAccountCurrencyChange: (currency: string) => void;
  supportedCurrencies?: string[];
  currencyLabels?: Record<string, string>;
  formError: unknown;
  customErrorTitle: TranslationResult;
  i18nNamespace: RecipientI18nNamespace;
}

function renderRecipientFormAlert({
  fxCreateEnabled,
  accountCurrency,
  onAccountCurrencyChange,
  supportedCurrencies,
  currencyLabels,
  formError,
  customErrorTitle,
  i18nNamespace,
}: RecipientFormAlertOptions): ReactNode {
  if (!fxCreateEnabled && !formError) return undefined;

  return (
    <>
      {fxCreateEnabled && (
        <RecipientAccountCurrencySelect
          value={accountCurrency}
          onValueChange={onAccountCurrencyChange}
          supportedCurrencies={supportedCurrencies}
          currencyLabels={currencyLabels}
        />
      )}
      {formError ? (
        <FriendlyErrorAlert
          error={formError as ErrorType<ApiError>}
          showDetails
          customTitle={customErrorTitle}
          i18nNamespace={i18nNamespace}
        />
      ) : null}
    </>
  );
}

interface LinkAccountAcknowledgementOptions {
  isCreatingLinkedAccount: boolean;
  hasAcknowledgements: boolean;
  showIntro: boolean;
  acknowledgements?: readonly LinkAccountReviewAcknowledgement[];
  intro: TranslationResult;
  groupAriaLabel: string;
}

function getLinkAccountAcknowledgementProps({
  isCreatingLinkedAccount,
  hasAcknowledgements,
  showIntro,
  acknowledgements,
  intro,
  groupAriaLabel,
}: LinkAccountAcknowledgementOptions) {
  return {
    reviewAcknowledgements:
      isCreatingLinkedAccount && acknowledgements
        ? acknowledgements
        : undefined,
    acknowledgementsIntro:
      isCreatingLinkedAccount && hasAcknowledgements && showIntro
        ? intro
        : undefined,
    reviewAcknowledgementsGroupAriaLabel:
      isCreatingLinkedAccount && hasAcknowledgements
        ? groupAriaLabel
        : undefined,
  };
}

/**
 * RecipientFormDialog - Dialog component for creating and editing recipients
 *
 * This component consolidates the common logic between creating and editing recipients,
 * reducing code duplication and improving maintainability. Supports all recipient types:
 * LINKED_ACCOUNT, RECIPIENT, and future SETTLEMENT_ACCOUNT.
 *
 * Supports two modes:
 * - **Uncontrolled mode**: Pass a `children` trigger element, dialog opens when clicked
 * - **Controlled mode**: Pass `open` and `onOpenChange` props, no trigger needed
 *
 * @example
 * ```tsx
 * // Uncontrolled mode - with trigger
 * <RecipientFormDialog mode="create" onRecipientSettled={handleSettled}>
 *   <Button>Create Recipient</Button>
 * </RecipientFormDialog>
 *
 * // Controlled mode - no trigger needed
 * <RecipientFormDialog
 *   mode="create"
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onRecipientSettled={handleSettled}
 * />
 *
 * // Edit mode (controlled)
 * {editingRecipient && (
 *   <RecipientFormDialog
 *     mode="edit"
 *     recipient={editingRecipient}
 *     open
 *     onOpenChange={(open) => !open && setEditingRecipient(null)}
 *     onRecipientSettled={handleSettled}
 *   />
 * )}
 *
 * // FX create (currency select)
 * <RecipientFormDialog
 *   mode="create"
 *   internationalMode
 *   supportedCurrencies={['EUR', 'GBP']}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 * />
 * ```
 */
export const RecipientFormDialog: FC<RecipientFormDialogProps> = ({
  children,
  mode,
  recipient,
  open,
  onOpenChange,
  onRecipientSettled,
  recipientType,
  i18nNamespace,
  linkAccountReviewAcknowledgements,
  showLinkAccountAcknowledgementsIntro = false,
  linkAccountBankFormConfigOverride,
  internationalMode = false,
  supportedCurrencies,
  currencyLabels,
  showRecipientCurrency,
}) => {
  const { t } = useTranslationWithTokens(i18nNamespace);
  const { tString: tMakePaymentString } =
    useTranslationWithTokens('make-payment');
  const { t: tOnboardingOverview, tString: tOnboardingOverviewString } =
    useTranslationWithTokens('onboarding-overview');
  const clientId = useClientId();

  // FR-FX-10: optional international recipient capture (create + RECIPIENT only).
  const fxCreateEnabled =
    internationalMode && mode === 'create' && recipientType === 'RECIPIENT';
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const isInternational = fxCreateEnabled && accountCurrency !== 'USD';
  const shouldShowRecipientCurrency =
    showRecipientCurrency ?? internationalMode;

  // Fetch client data using the client ID
  const { data: clientData } = useSmbdoGetClient(clientId ?? '', {
    query: {
      enabled: !!clientId,
    },
  });

  // Get appropriate config based on recipientType and mode
  const linkedAccountCreateBase = useLinkedAccountConfig();
  const linkedAccountCreateConfig = linkAccountBankFormConfigOverride
    ? createCustomConfig(
        linkedAccountCreateBase,
        linkAccountBankFormConfigOverride
      )
    : linkedAccountCreateBase;
  const linkedAccountEditConfig = useLinkedAccountEditConfig();
  const recipientCreateConfig = useRecipientConfig();
  const recipientEditConfig = useRecipientEditConfig();

  // Select config based on recipientType and mode
  const baseConfig = selectBankAccountConfig(recipientType, mode, {
    recipientCreate: recipientCreateConfig,
    recipientEdit: recipientEditConfig,
    linkedAccountCreate: linkedAccountCreateConfig,
    linkedAccountEdit: linkedAccountEditConfig,
  });

  const config = useMemo(() => {
    if (!isInternational) return baseConfig;
    return applyFxBankAccountFormOverrides(baseConfig, accountCurrency, {
      highValue: tMakePaymentString('fx.rails.label.WIRE', 'FX High-value'),
      lowValue: tMakePaymentString('fx.rails.label.ACH', 'FX Low-value'),
      wireDescription: tMakePaymentString(
        'fx.rails.desc.WIRE',
        'Time-critical cross-currency payouts (same or next business day)'
      ),
      achDescription: tMakePaymentString(
        'fx.rails.desc.ACH',
        'Non-urgent cross-currency payouts (two to five business days)'
      ),
    });
  }, [baseConfig, isInternational, accountCurrency, tMakePaymentString]);

  const handleSettled = (settledRecipient?: Recipient, error?: any) => {
    if (settledRecipient && isInternational) {
      onRecipientSettled?.(
        tagRecipientCurrency(settledRecipient, accountCurrency),
        error
      );
      return;
    }
    onRecipientSettled?.(settledRecipient, error);
  };

  // Use the recipient form hook
  const {
    submit,
    reset,
    status,
    data: responseData,
    error: formError,
  } = useRecipientForm({
    mode,
    recipientId: recipient?.id,
    recipientType,
    // FR-FX-10: persist the currency's canonical routing code for FX recipients.
    routingCodeType: isInternational
      ? getFxRoutingCodeType(accountCurrency)
      : undefined,
    onSettled: handleSettled,
  });

  const displayRecipient = useMemo(() => {
    if (!responseData) return undefined;
    if (isInternational) {
      return tagRecipientCurrency(responseData, accountCurrency);
    }
    return responseData;
  }, [responseData, isInternational, accountCurrency]);

  // Handle form submission - submit already transforms and adds the appropriate type
  const handleSubmit = (data: BankAccountFormData) => {
    submit(data);
  };

  // Handle dialog open/close
  const handleDialogChange = (isOpen: boolean) => {
    // Reset when dialog closes to ensure clean state on next open
    if (!isOpen) {
      reset();
      setAccountCurrency('USD');
    }
    onOpenChange?.(isOpen);
  };

  // Handle cancel action
  const handleCancel = () => {
    onOpenChange?.(false);
  };

  // Get translation keys based on mode
  const translationKey = mode === 'create' ? 'linkAccount' : 'editAccount';

  // Link-account acknowledgements only apply when creating a linked account
  const isCreatingLinkedAccount =
    mode === 'create' && recipientType === 'LINKED_ACCOUNT';
  const hasLinkAccountAcknowledgements = Boolean(
    linkAccountReviewAcknowledgements?.length
  );
  const formAlert = renderRecipientFormAlert({
    fxCreateEnabled,
    accountCurrency,
    onAccountCurrencyChange: setAccountCurrency,
    supportedCurrencies,
    currencyLabels,
    formError,
    customErrorTitle: t(`forms.${translationKey}.error.title`),
    i18nNamespace,
  });
  const acknowledgementProps = getLinkAccountAcknowledgementProps({
    isCreatingLinkedAccount,
    hasAcknowledgements: hasLinkAccountAcknowledgements,
    showIntro: showLinkAccountAcknowledgementsIntro,
    acknowledgements: linkAccountReviewAcknowledgements,
    intro: tOnboardingOverview(
      'screens.linkAccount.prefillSummary.acknowledgementsIntro',
      'By electronically linking this account, you agree that:'
    ),
    groupAriaLabel: tOnboardingOverviewString(
      'screens.linkAccount.review.acknowledgementsGroupLabel',
      'Agreements required to link this account'
    ),
  });

  // Get title based on status
  const getTitle = (): TranslationResult => {
    if (status === 'success') {
      if (responseData?.status) {
        const statusKey =
          `forms.${translationKey}.titleSuccessByStatus.${responseData.status}` as unknown as TemplateStringsArray;
        return t(statusKey);
      }
      // Fallback to descriptionSuccess if no status
      return t(`forms.${translationKey}.descriptionSuccess`);
    }
    return t(`forms.${translationKey}.title`);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="eb-max-h-full eb-max-w-2xl eb-overflow-hidden eb-p-0 sm:eb-max-h-[90vh]">
        <DialogHeader className="eb-shrink-0 eb-space-y-2 eb-border-b eb-p-6 eb-py-4">
          <DialogTitle className="eb-font-header eb-text-xl">
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {status === 'success'
              ? responseData?.status
                ? t(`status.messages.${responseData.status}`)
                : t(`forms.${translationKey}.descriptionSuccess`)
              : t(`forms.${translationKey}.description`)}
          </DialogDescription>
        </DialogHeader>

        {/* Success State */}
        {status === 'success' && displayRecipient && (
          <div className="eb-space-y-6 eb-p-6">
            <RecipientAccountDisplayCard
              recipient={displayRecipient}
              showRecipientCurrency={shouldShowRecipientCurrency}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button className="eb-w-full">Done</Button>
              </DialogClose>
            </DialogFooter>
          </div>
        )}

        {/* Form State — FX currency select scrolls with the form body */}
        {(status === 'idle' || status === 'error' || status === 'pending') && (
          <BankAccountForm
            key={fxCreateEnabled ? accountCurrency : 'domestic'}
            config={config}
            recipient={recipient}
            client={clientData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={status === 'pending'}
            layout="singlePage"
            alert={formAlert}
            {...acknowledgementProps}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
