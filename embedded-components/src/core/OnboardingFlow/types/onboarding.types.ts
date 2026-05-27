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
  BankAccountFormConfigOverride,
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
 * With `completionMode: 'editable'` (default), partial data is allowed and the user completes the two-step form.
 * With `completionMode: 'reviewOnly'`, supply a full {@link BankAccountFormData}-compatible payload;
 * the UI shows a read-only summary plus optional `reviewAcknowledgements`.
 * With `completionMode: 'editable'`, the same optional `reviewAcknowledgements` render on step 2 of the bank form.
 */
export type LinkAccountInitialValues = Partial<BankAccountFormData>;

/**
 * A preset linked-account entry with party identification and bank details.
 * Used when hosts supply multiple accounts via {@link LinkAccountStepOptions.presetAccounts}.
 *
 * Each preset identifies the party either by `partyId` (server-known) or inline
 * `partyDetails`. When both are provided, `partyId` takes precedence at submission.
 */
export type LinkAccountPresetEntry = {
  /** Unique key for this preset (used as React key and for selection tracking). */
  id: string;
  /**
   * Human-readable label shown in the account selector dropdown.
   * Falls back to party name or "Account {index}" when omitted.
   */
  label?: string;
  /**
   * Existing party ID to associate with this linked account.
   * When provided, the API links the account to this party rather than
   * creating a new one from `initialValues` party fields.
   */
  partyId?: string;
  /** Initial values (partial or full) to pre-populate the form for this preset. */
  initialValues: LinkAccountInitialValues;
};

/**
 * - **`editable`** — Full `BankAccountForm` two-step wizard; optional `initialValues` prefill. **(default)**
 * - **`reviewOnly`** — Single page via `LinkAccountPrefillSummaryView` (disabled fields + payment strip; shares config/i18n with the form, not the full form tree).
 *
 * @deprecated `'prefillSummary'` is accepted as an alias for `'reviewOnly'` for backward compatibility.
 */
export type LinkAccountStepCompletionMode =
  | 'editable'
  | 'reviewOnly'
  | 'prefillSummary';

export type LinkAccountStepOptions = {
  initialValues: LinkAccountInitialValues;
  /**
   * Controls whether the user can edit the prefilled bank account data or only review it.
   *
   * - `'editable'` — Interactive form where the user can modify fields before submitting.
   * - `'reviewOnly'` — Read-only summary; user can only acknowledge and confirm.
   *
   * @default 'editable'
   */
  completionMode?: LinkAccountStepCompletionMode;
  /**
   * Zero or more agreements before linking (any `completionMode`).
   * Omitted or `[]` = no supplemental checkboxes. When non-empty, every item must be
   * checked before submit/confirm is enabled.
   */
  reviewAcknowledgements?: readonly LinkAccountReviewAcknowledgement[];
  /**
   * When `completionMode` is `'reviewOnly'`, payment types listed here appear in the read-only
   * summary strip (labels from `BankAccountForm` config). Defaults to
   * `initialValues.paymentTypes` when set, otherwise `['ACH']`.
   */
  summaryDisplayedPaymentTypes?: readonly RoutingInformationTransactionType[];
  /**
   * When `reviewAcknowledgements` is non-empty, show the lead-in line
   * (`screens.linkAccount.prefillSummary.acknowledgementsIntro`) above the checkbox group. Default false.
   */
  showAcknowledgementsIntro?: boolean;
  /**
   * Optional merge on top of {@link useLinkedAccountConfig} for the link-account bank form
   * (editable step and `reviewOnly` labels). Use to document or trial alternative
   * `paymentMethods.available` / `allowMultiple` sets; production onboarding typically omits this.
   */
  bankFormConfigOverride?: BankAccountFormConfigOverride;
  /**
   * Existing party ID to associate with the linked account.
   * When provided, the API links the account to this party rather than
   * deriving party details from `initialValues`. Takes precedence over party
   * fields in `initialValues`.
   */
  partyId?: string;
  /**
   * Multiple preset accounts for the user to choose from via a select dropdown.
   * Each entry can identify the party via `partyId` or inline party fields.
   * When provided, the link-account step renders an account selector before
   * showing the form/summary for the selected preset.
   *
   * **Backward-compatible:** when omitted, the existing single-account
   * (`initialValues` + `completionMode`) flow is unchanged.
   */
  presetAccounts?: readonly LinkAccountPresetEntry[];
  /**
   * Allow creation of multiple linked accounts sequentially.
   * When `true`, after successfully linking an account the UI offers a
   * "Link another account" action instead of immediately returning to Overview.
   * The full list of linked accounts (and add flow) lives on the **link-account**
   * step; **Overview** only shows a short count summary and **Manage linked accounts**
   * so the list is not duplicated.
   * Aligned with `LinkedAccountWidget` `mode: 'list'` behavior.
   *
   * @default false
   */
  allowMultipleAccounts?: boolean;
  /**
   * How existing linked accounts are displayed when `allowMultipleAccounts` is true.
   *
   * - `'compact'` — minimal card showing account info only (overflow menu with View Details / Edit / Remove).
   * - `'detailed'` — full card with status alerts, Verify action, View Details dialog, and Remove action.
   *
   * Applies regardless of the number of existing accounts (one or many).
   *
   * @default 'detailed'
   */
  existingAccountsDisplay?: 'compact' | 'detailed';
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
  /**
   * When true, hides Remove on the **OnboardingFlow Overview** linked-account card (read-only unlink).
   *
   * **Relationship to `hideRemoveRecipient`:** These flags do not conflict — they apply to different
   * surfaces. `hideLinkedAccountRemoval` only affects onboarding Overview. The **Link bank account**
   * step (`LinkAccountScreen`) does not render Remove today; when an active linked account already exists,
   * that step redirects to Overview, where this flag applies. If Remove is ever shown inline on the link
   * step, gate it with this same prop so hosts stay consistent.
   *
   * `hideRemoveRecipient` is passed on **`LinkedAccountWidget`** / recipient widgets and hides Remove in
   * card overflow menus and **table** row actions — not on OnboardingFlow. If your host renders **both**
   * onboarding and the standalone linked-account widget, set each flag where you embed each UI.
   *
   * @default false
   */
  hideLinkedAccountRemoval?: boolean;
  hideSidebar?: boolean;
  /** Whether to show the "Download Checklist" button on the Overview screen. Defaults to false. */
  showDownloadChecklist?: boolean;
  /**
   * Enable Publicly Traded Company (PTC) onboarding support.
   *
   * When `true`, non-sole-proprietorship entities can declare themselves as
   * publicly traded or a subsidiary of a PTC. This unlocks:
   * - A two-step gate question (PTC vs. subsidiary)
   * - Trading information fields (ticker symbol, stock exchange)
   * - Conditional section/field visibility based on US vs. non-US exchange:
   *   - **US exchange (XNYS/XNAS):** beneficial owners skipped, controller gov ID hidden
   *   - **Non-US exchange:** full collection (beneficial owners, gov ID, FinCEN attestation)
   *
   * Defaults to `false`.
   */
  enablePubliclyTradedCompanies?: boolean;
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
  /**
   * Enable indirect ownership hierarchy support.
   *
   * When `true`, the beneficial-owners section renders an enhanced UI that
   * supports both direct and indirect ownership structures. Indirect owners
   * are those who own ≥25% of the business through one or more intermediary
   * entities (e.g. holding companies). The component renders a hierarchy
   * builder for defining the chain of ownership.
   *
   * When `false` (default), only direct beneficial owners are collected.
   *
   * @default false
   */
  enableIndirectOwnership?: boolean;
  /**
   * **Business → Industry** (`IndustryForm`): host-curated NAICS codes to surface
   * as a pinned "Suggested for your platform" group at the top of the industry
   * combobox. Users can still pick any code from the full catalog beneath the
   * pinned group.
   *
   * - Codes are resolved against the bundled NAICS catalog; unknown codes are
   *   silently dropped (with a `console.warn` in development).
   * - Order is preserved (use it to express the host's priority).
   * - Composes with the AI suggestion feature (`NAICS_SUGGESTION_FEATURE_FLAG`)
   *   — the two surfaces are independent and may both be active.
   *
   * The pinned-group header text is a content token
   * (`onboarding-old:industrySelect.priorityHeader`, default
   * "Suggested for your platform") — override it via
   * `EBComponentsProvider` `contentTokens.tokens` when you want a
   * platform-specific label like "Recommended for SellSense sellers".
   *
   * @example
   * ```tsx
   * <OnboardingFlow
   *   priorityIndustryCodes={['722511', '445110', '311811']}
   * />
   * ```
   */
  priorityIndustryCodes?: readonly string[];
};

export type OnboardingFlowProps = OnboardingConfigDefault &
  OnboardingConfigUsedInContext & {
    flowEntry?: OnboardingFlowEntry;
  };
