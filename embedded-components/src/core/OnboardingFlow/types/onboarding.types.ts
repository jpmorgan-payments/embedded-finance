import type { UserTrackingProps } from '@/lib/types/userTracking.types';
import { ErrorType } from '@/api/axios-instance';
import type { RoutingInformationTransactionType } from '@/api/generated/ep-recipients.schemas';
import {
  ApiError,
  ClientProduct,
  ClientResponse,
  ClientStatus,
  ClientVerificationResponse,
  OrganizationType,
  PartyResponse,
  SchemasApiError,
} from '@/api/generated/smbdo.schemas';
import type { BankAccountFormData } from '@/core/RecipientWidgets/components/BankAccountForm/BankAccountForm.types';

export type Jurisdiction = 'US' | 'CA';

/**
 * Host-supplied values for the optional link-account step.
 * With `completionMode: 'editable'`, partial data is allowed and the user completes the two-step form.
 * With `completionMode: 'prefillSummary'`, supply a full {@link BankAccountFormData}-compatible payload;
 * the UI shows a read-only summary plus optional `reviewAcknowledgements`.
 */
export type LinkAccountInitialValues = Partial<BankAccountFormData>;

/**
 * - **`editable`** — Full `BankAccountForm` two-step wizard; optional `initialValues` prefill.
 * - **`prefillSummary`** — Single page via `LinkAccountPrefillSummaryView` (disabled fields + payment strip; shares config/i18n with the form, not the full form tree).
 */
export type LinkAccountStepCompletionMode = 'editable' | 'prefillSummary';

/**
 * Checkbox rows above the link-account confirm CTA (`prefillSummary` layout).
 *
 * - **Copy & rich markup** (including `<termsLink>…</termsLink>`-style tags) live in
 *   `onboarding-overview` JSON so content tokens / locales stay the source of truth.
 * - **URLs** for those tags are supplied here (`linkHrefs`) so hosts can point to
 *   their own legal pages without hard-coding links in translations.
 */
export type LinkAccountReviewAcknowledgement = {
  id: string;
  /** `onboarding-overview` key, e.g. `screens.linkAccount.review.acknowledgements.termsAndPolicies` */
  labelKey: string;
  /** Maps Trans component names to absolute URLs */
  linkHrefs?: Record<string, string>;
};

export type LinkAccountStepOptions = {
  initialValues: LinkAccountInitialValues;
  completionMode: LinkAccountStepCompletionMode;
  /**
   * Zero or more agreements before confirm (`prefillSummary` only).
   * Omitted or `[]` = no supplemental checkboxes. When non-empty, every item must be
   * checked before the confirm action is enabled.
   */
  reviewAcknowledgements?: readonly LinkAccountReviewAcknowledgement[];
  /**
   * When `completionMode` is `prefillSummary`, payment types listed here appear in the read-only
   * summary strip (labels from `BankAccountForm` config). Defaults to
   * `initialValues.paymentTypes` when set, otherwise `['ACH']`.
   */
  summaryDisplayedPaymentTypes?: readonly RoutingInformationTransactionType[];
  /**
   * When `prefillSummary` with `reviewAcknowledgements`, show the lead-in line
   * (`screens.linkAccount.prefillSummary.acknowledgementsIntro`) above the checkbox group. Default false.
   */
  showAcknowledgementsIntro?: boolean;
};

/**
 * Configuration for platform disclosures and attestation language displayed
 * during onboarding.  All text containing `[Platform Provider]` in the
 * regulatory requirements is interpolated with {@link platformName}.
 *
 * When provided, the component renders:
 * - A persistent footer disclosure (FDIC / "not a bank" language).
 * - Enhanced review-step attestation checkboxes (§ 1.2).
 *
 * When omitted the component falls back to its legacy single-checkbox
 * attestation and no footer is shown, preserving backward compatibility.
 */
export type OnboardingDisclosureConfig = {
  /** Display name of the platform provider (replaces `[Platform Provider]`). */
  platformName: string;
  /** URL for the Platform Provider's Program Agreement link shown in attestation text. */
  platformAgreementUrl?: string;
  /**
   * Custom label for the platform agreement link.
   * Defaults to `"[platformName]'s Program Agreement"` when omitted.
   */
  platformAgreementLabel?: string;
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
  /** Controls visibility of the linked account section. Use alongside `linkAccountEnabledStatuses` to control which statuses allow linking. */
  showLinkAccountStep?: boolean;
  /**
   * Array of ClientStatus values for which the Linked Account step is enabled
   * (i.e. the user can initiate account linking).
   * When provided, takes precedence over the default status check.
   * Visibility of the section is still controlled by `showLinkAccountStep`.
   * Pass an empty array to disable linking for all statuses.
   */
  linkAccountEnabledStatuses?: ClientStatus[];
  /**
   * Pre-populate the link-account step and control whether the user edits fields or only reviews and confirms.
   * Ignored when an active linked account already exists from the recipients API.
   */
  linkAccountStepOptions?: LinkAccountStepOptions;
  hideSidebar?: boolean;
  /** Whether to show the "Download Checklist" button on the Overview screen. Defaults to false. */
  showDownloadChecklist?: boolean;
  /**
   * Platform disclosure and attestation configuration.
   * When provided, enables the regulatory footer and enhanced attestation
   * checkboxes on the review screen.  See {@link OnboardingDisclosureConfig}.
   */
  disclosureConfig?: OnboardingDisclosureConfig;
};

export type OnboardingFlowProps = OnboardingConfigDefault &
  OnboardingConfigUsedInContext;
