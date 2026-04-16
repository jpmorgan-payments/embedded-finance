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
import type {
  BankAccountFormData,
  LinkAccountReviewAcknowledgement,
} from '@/core/RecipientWidgets/components/BankAccountForm/BankAccountForm.types';

import type { ScreenId } from './flow.types';

export type { LinkAccountReviewAcknowledgement };

/**
 * Host-defined checkbox rows for **Review & attest → Terms** when replacing the
 * default attestation UI. Same structural pattern as linked-account acknowledgements
 * (`id`, `labelKey`, `linkHrefs`) but typed separately to avoid coupling packages.
 */
export type ReviewAttestTermsAcknowledgement = {
  id: string;
  /** `onboarding-overview` i18n key; optional `<tagName>` links via {@link linkHrefs}. */
  labelKey: string;
  /** Maps Trans component names to absolute URLs (same pattern as link-account rows). */
  linkHrefs?: Record<string, string>;
};

/**
 * Opens the flow at a specific screen after client data has loaded.
 * Intended for Storybook and tests; ignored when {@link OnboardingConfigUsedInContext.docUploadOnlyMode}
 * is true (entry remains the document-upload section).
 */
export type OnboardingFlowEntry = {
  screenId: ScreenId;
  /** When `screenId` is a stepper section, sets the visible step (e.g. `documents` on review-attest). */
  stepperStepId?: string;
};

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
  /**
   * Show the regulatory disclosure footer at the bottom of the onboarding flow.
   * The footer content currently requires `disclosureConfig` to be set, but this
   * prop controls its visibility independently so that `disclosureConfig` can
   * drive attestation checkboxes without rendering the footer.
   *
   * @default false
   */
  showDisclosureFooter?: boolean;
  /**
   * **Review & attest → Terms** (`TermsAndConditionsForm`): optional full replacement
   * of the built-in attestation checkboxes with a host-defined list
   * ({@link ReviewAttestTermsAcknowledgement} — same pattern as link-account ack rows).
   *
   * - Omitted or `[]` — default UI: agree-to-terms checkbox, plus authorize-sharing when
   *   {@link disclosureConfig} has `platformName` (unchanged legacy behavior).
   * - Non-empty — only these rows; every item must be checked to submit.
   */
  reviewAttestTermsAcknowledgements?: readonly ReviewAttestTermsAcknowledgement[];
  /**
   * When {@link reviewAttestTermsAcknowledgements} is non-empty, show
   * `reviewAndAttest.termsAcknowledgements.intro` above the checkbox group. Default false.
   */
  showReviewAttestTermsAcknowledgementsIntro?: boolean;
};

export type OnboardingFlowProps = OnboardingConfigDefault &
  OnboardingConfigUsedInContext & {
    flowEntry?: OnboardingFlowEntry;
  };
