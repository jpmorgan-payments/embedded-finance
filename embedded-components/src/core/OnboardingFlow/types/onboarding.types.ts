import type { UserTrackingProps } from '@/lib/types/userTracking.types';
import { ErrorType } from '@/api/axios-instance';
import type { RoutingInformationTransactionType } from '@/api/generated/ep-recipients.schemas';
import {
  ApiError,
  ClientProduct,
  ClientResponse,
  ClientVerificationResponse,
  OrganizationType,
  PartyResponse,
  SchemasApiError,
} from '@/api/generated/smbdo.schemas';
import type {
  BankAccountFormData,
  LinkAccountReviewAcknowledgement,
} from '@/core/RecipientWidgets/components/BankAccountForm/BankAccountForm.types';

export type { LinkAccountReviewAcknowledgement };

export type Jurisdiction = 'US' | 'CA';

/**
 * Host-supplied values for the optional link-account step.
 * With `completionMode: 'editable'`, partial data is allowed and the user completes the two-step form.
 * With `completionMode: 'prefillSummary'`, supply a full {@link BankAccountFormData}-compatible payload;
 * the UI shows a read-only summary plus optional `reviewAcknowledgements`.
 * With `completionMode: 'editable'`, the same optional `reviewAcknowledgements` render on step 2 of the bank form.
 */
export type LinkAccountInitialValues = Partial<BankAccountFormData>;

/**
 * - **`editable`** — Full `BankAccountForm` two-step wizard; optional `initialValues` prefill.
 * - **`prefillSummary`** — Single page via `LinkAccountPrefillSummaryView` (disabled fields + payment strip; shares config/i18n with the form, not the full form tree).
 */
export type LinkAccountStepCompletionMode = 'editable' | 'prefillSummary';

export type LinkAccountStepOptions = {
  initialValues: LinkAccountInitialValues;
  completionMode: LinkAccountStepCompletionMode;
  /**
   * Zero or more agreements before linking (any `completionMode`).
   * Omitted or `[]` = no supplemental checkboxes. When non-empty, every item must be
   * checked before submit/confirm is enabled.
   */
  reviewAcknowledgements?: readonly LinkAccountReviewAcknowledgement[];
  /**
   * When `completionMode` is `prefillSummary`, payment types listed here appear in the read-only
   * summary strip (labels from `BankAccountForm` config). Defaults to
   * `initialValues.paymentTypes` when set, otherwise `['ACH']`.
   */
  summaryDisplayedPaymentTypes?: readonly RoutingInformationTransactionType[];
  /**
   * When `reviewAcknowledgements` is non-empty, show the lead-in line
   * (`screens.linkAccount.prefillSummary.acknowledgementsIntro`) above the checkbox group. Default false.
   */
  showAcknowledgementsIntro?: boolean;
};

export type OnboardingConfigDefault = UserTrackingProps & {
  alertOnExit?: boolean;
  /**
   * When true, navigating to the previous step or screen (Back / Previous), document
   * upload **Cancel**, or **Return to overview** on the document list screen shows a
   * confirmation that unsaved entries may be lost.
   */
  alertOnPreviousStep?: boolean;
  height?: string;
};

export type OnboardingConfigUsedInContext = {
  onGetClientSettled?: (
    clientData: ClientResponse | undefined,
    status: 'success' | 'pending' | 'error',
    error: ErrorType<SchemasApiError> | null
  ) => void;
  onPostClientSettled?: (response?: ClientResponse, error?: ApiError) => void;
  onPostPartySettled?: (response?: PartyResponse, error?: ApiError) => void;
  onPostClientVerificationsSettled?: (
    response?: ClientVerificationResponse,
    error?: ApiError
  ) => void;
  availableProducts: Array<ClientProduct>;
  availableJurisdictions: Array<Jurisdiction>;
  availableOrganizationTypes?: Array<OrganizationType>;
  docUploadOnlyMode?: boolean;
  docUploadMaxFileSizeBytes?: number;
  showLinkAccountStep?: boolean;
  /**
   * Pre-populate the link-account step and control whether the user edits fields or only reviews and confirms.
   * Ignored when an active linked account already exists from the recipients API.
   */
  linkAccountStepOptions?: LinkAccountStepOptions;
  hideSidebar?: boolean;
  /** Whether to show the "Download Checklist" button on the Overview screen. Defaults to false. */
  showDownloadChecklist?: boolean;
};

export type OnboardingFlowProps = OnboardingConfigDefault &
  OnboardingConfigUsedInContext;
