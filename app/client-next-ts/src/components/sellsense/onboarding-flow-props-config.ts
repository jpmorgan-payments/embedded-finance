/**
 * SellSense helpers for editing / exporting OnboardingFlow host props
 * in the same shape as hosted-ui `globalConfiguration.onboardingFlowConfig`.
 */

export type OnboardingFlowConfigProps = {
  availableProducts?: string[];
  availableJurisdictions?: string[];
  availableOrganizationTypes?: string[];
  showLinkAccountStep?: boolean;
  hideLinkedAccountRemoval?: boolean;
  showReviewAttestTermsAcknowledgementsIntro?: boolean;
  enablePubliclyTradedCompanies?: boolean;
  showDisclosureFooter?: boolean;
  showDownloadChecklist?: boolean;
  hideSidebar?: boolean;
  docUploadOnlyMode?: boolean;
  alertOnExit?: boolean;
  alertOnPreviousStep?: boolean;
  linkAccountEnabledStatuses?: string[];
  priorityIndustryCodes?: string[];
  disclosureConfig?: {
    platformName: string;
    productName?: string;
    platformAgreementUrl?: string;
    platformAgreementLabel?: string;
  };
  linkAccountStepOptions?: Record<string, unknown>;
  reviewAttestTermsAcknowledgements?: Array<{
    id: string;
    labelKey: string;
    linkHrefs?: Record<string, string>;
  }>;
};

/** Keys allowed in onboardingFlowConfig export / import (no callbacks). */
export const ONBOARDING_FLOW_CONFIG_KEYS = [
  'availableProducts',
  'availableJurisdictions',
  'availableOrganizationTypes',
  'showLinkAccountStep',
  'hideLinkedAccountRemoval',
  'showReviewAttestTermsAcknowledgementsIntro',
  'enablePubliclyTradedCompanies',
  'showDisclosureFooter',
  'showDownloadChecklist',
  'hideSidebar',
  'docUploadOnlyMode',
  'alertOnExit',
  'alertOnPreviousStep',
  'linkAccountEnabledStatuses',
  'priorityIndustryCodes',
  'disclosureConfig',
  'linkAccountStepOptions',
  'reviewAttestTermsAcknowledgements',
] as const satisfies ReadonlyArray<keyof OnboardingFlowConfigProps>;

export type OnboardingFlowConfigKey =
  (typeof ONBOARDING_FLOW_CONFIG_KEYS)[number];

export type PropFieldControl =
  | 'boolean'
  | 'select'
  | 'multi-select'
  | 'text'
  | 'json';

export type PropFieldGroup =
  | 'linkAccount'
  | 'disclosure'
  | 'products'
  | 'advanced';

export type PropFieldDescriptor = {
  key: OnboardingFlowConfigKey;
  label: string;
  description: string;
  group: PropFieldGroup;
  control: PropFieldControl;
  options?: ReadonlyArray<{ value: string; label: string }>;
};

export const PROP_FIELD_GROUPS: ReadonlyArray<{
  id: PropFieldGroup;
  label: string;
}> = [
  { id: 'linkAccount', label: 'Link account' },
  { id: 'disclosure', label: 'Disclosure & attest' },
  { id: 'products', label: 'Products & jurisdiction' },
  { id: 'advanced', label: 'Advanced' },
];

export const ONBOARDING_PROP_FIELDS: ReadonlyArray<PropFieldDescriptor> = [
  {
    key: 'showLinkAccountStep',
    label: 'Show link account step',
    description: 'Controls visibility of the linked account section.',
    group: 'linkAccount',
    control: 'boolean',
  },
  {
    key: 'hideLinkedAccountRemoval',
    label: 'Hide linked account removal',
    description:
      'Hides Remove on the OnboardingFlow Overview linked-account card.',
    group: 'linkAccount',
    control: 'boolean',
  },
  {
    key: 'linkAccountEnabledStatuses',
    label: 'Link account enabled statuses',
    description:
      'Client statuses for which linking is enabled. Empty array disables linking for all statuses.',
    group: 'linkAccount',
    control: 'multi-select',
    options: [
      { value: 'NEW', label: 'NEW' },
      { value: 'INFORMATION_REQUESTED', label: 'INFORMATION_REQUESTED' },
      { value: 'REVIEW_IN_PROGRESS', label: 'REVIEW_IN_PROGRESS' },
      { value: 'APPROVED', label: 'APPROVED' },
      { value: 'REJECTED', label: 'REJECTED' },
    ],
  },
  {
    key: 'linkAccountStepOptions',
    label: 'Link account step options',
    description:
      'Prefill / completion mode for the link-account step (completionMode, initialValues, etc.).',
    group: 'linkAccount',
    control: 'json',
  },
  {
    key: 'disclosureConfig',
    label: 'Disclosure config',
    description:
      'Platform name and agreement labels used in review attestation / footer.',
    group: 'disclosure',
    control: 'json',
  },
  {
    key: 'reviewAttestTermsAcknowledgements',
    label: 'Review & attest acknowledgements',
    description:
      'Host-defined checkbox rows replacing the default terms attestation UI.',
    group: 'disclosure',
    control: 'json',
  },
  {
    key: 'showReviewAttestTermsAcknowledgementsIntro',
    label: 'Show terms acknowledgements intro',
    description:
      'When custom acknowledgements are set, show the intro line above the checkbox group.',
    group: 'disclosure',
    control: 'boolean',
  },
  {
    key: 'showDisclosureFooter',
    label: 'Show disclosure footer',
    description: 'Show the regulatory disclosure footer independently.',
    group: 'disclosure',
    control: 'boolean',
  },
  {
    key: 'availableProducts',
    label: 'Available products',
    description: 'Products offered during onboarding.',
    group: 'products',
    control: 'multi-select',
    options: [
      { value: 'EMBEDDED_PAYMENTS', label: 'EMBEDDED_PAYMENTS' },
      { value: 'MERCHANT_SERVICES', label: 'MERCHANT_SERVICES' },
    ],
  },
  {
    key: 'availableJurisdictions',
    label: 'Available jurisdictions',
    description: 'Jurisdictions available in the flow.',
    group: 'products',
    control: 'multi-select',
    options: [
      { value: 'US', label: 'US' },
      { value: 'CA', label: 'CA' },
    ],
  },
  {
    key: 'availableOrganizationTypes',
    label: 'Organization types',
    description: 'Organization types the user can select.',
    group: 'products',
    control: 'multi-select',
    options: [
      { value: 'SOLE_PROPRIETORSHIP', label: 'SOLE_PROPRIETORSHIP' },
      {
        value: 'LIMITED_LIABILITY_COMPANY',
        label: 'LIMITED_LIABILITY_COMPANY',
      },
      {
        value: 'LIMITED_LIABILITY_PARTNERSHIP',
        label: 'LIMITED_LIABILITY_PARTNERSHIP',
      },
      { value: 'GENERAL_PARTNERSHIP', label: 'GENERAL_PARTNERSHIP' },
      { value: 'LIMITED_PARTNERSHIP', label: 'LIMITED_PARTNERSHIP' },
      { value: 'C_CORPORATION', label: 'C_CORPORATION' },
      { value: 'S_CORPORATION', label: 'S_CORPORATION' },
      { value: 'NON_PROFIT_CORPORATION', label: 'NON_PROFIT_CORPORATION' },
      {
        value: 'UNINCORPORATED_ASSOCIATION',
        label: 'UNINCORPORATED_ASSOCIATION',
      },
    ],
  },
  {
    key: 'priorityIndustryCodes',
    label: 'Priority industry codes',
    description:
      'NAICS codes pinned as “Suggested for your platform” in the industry combobox.',
    group: 'products',
    control: 'json',
  },
  {
    key: 'enablePubliclyTradedCompanies',
    label: 'Enable publicly traded companies',
    description: 'Unlock PTC / subsidiary onboarding paths.',
    group: 'advanced',
    control: 'boolean',
  },
  {
    key: 'showDownloadChecklist',
    label: 'Show download checklist',
    description: 'Show the Download Checklist button on Overview.',
    group: 'advanced',
    control: 'boolean',
  },
  {
    key: 'hideSidebar',
    label: 'Hide sidebar',
    description: 'Hide the onboarding flow sidebar navigation.',
    group: 'advanced',
    control: 'boolean',
  },
  {
    key: 'docUploadOnlyMode',
    label: 'Document upload only mode',
    description: 'Restrict the flow to document upload.',
    group: 'advanced',
    control: 'boolean',
  },
  {
    key: 'alertOnExit',
    label: 'Alert on exit',
    description: 'Confirm before leaving the flow.',
    group: 'advanced',
    control: 'boolean',
  },
  {
    key: 'alertOnPreviousStep',
    label: 'Alert on previous step',
    description: 'Confirm when navigating back with unsaved entries.',
    group: 'advanced',
    control: 'boolean',
  },
];

/** SellSense demo baseline (matches kyc-onboarding defaults). */
export const SELLSENSE_ONBOARDING_BASELINE: OnboardingFlowConfigProps = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  availableOrganizationTypes: [
    'SOLE_PROPRIETORSHIP',
    'LIMITED_LIABILITY_COMPANY',
    'LIMITED_LIABILITY_PARTNERSHIP',
    'GENERAL_PARTNERSHIP',
    'LIMITED_PARTNERSHIP',
    'C_CORPORATION',
  ],
  showLinkAccountStep: true,
};

/**
 * Sample hosted-platform onboardingFlowConfig values
 * (generic platform naming — for demo / copy reference).
 */
export const HOSTED_PLATFORM_SAMPLE: OnboardingFlowConfigProps = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  showLinkAccountStep: true,
  hideLinkedAccountRemoval: true,
  showReviewAttestTermsAcknowledgementsIntro: true,
  linkAccountStepOptions: {
    completionMode: 'prefillSummary',
    initialValues: {},
    summaryDisplayedPaymentTypes: ['ACH'],
  },
  disclosureConfig: {
    platformName: 'Platform, Inc.',
    platformAgreementLabel: 'Platform, Inc. Program Agreement',
  },
  reviewAttestTermsAcknowledgements: [
    {
      id: 'agreeJpTerms',
      labelKey: 'reviewAndAttest.termsAndConditions.agreeToTerms',
    },
    {
      id: 'authorizeSharing',
      labelKey: 'reviewAndAttest.attestation.authorizeSharing',
    },
    {
      id: 'accurateAndBusinessOnly',
      labelKey: 'reviewAndAttest.attestation.accurateInfo',
    },
  ],
};

export function isOnboardingFlowConfigKey(
  key: string
): key is OnboardingFlowConfigKey {
  return (ONBOARDING_FLOW_CONFIG_KEYS as readonly string[]).includes(key);
}

/** Keep only known hosted-config keys (strip callbacks / unknown). */
export function pickOnboardingFlowConfig(
  value: Record<string, unknown> | OnboardingFlowConfigProps | null | undefined
): OnboardingFlowConfigProps {
  if (!value || typeof value !== 'object') return {};
  const result: OnboardingFlowConfigProps = {};
  for (const key of ONBOARDING_FLOW_CONFIG_KEYS) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      (result as Record<string, unknown>)[key] = (
        value as Record<string, unknown>
      )[key];
    }
  }
  return result;
}

/**
 * Parse import payload: `{ onboardingFlowConfig: {...} }` or bare props object.
 */
export function parseOnboardingFlowConfigImport(
  raw: unknown
):
  | { ok: true; config: OnboardingFlowConfigProps }
  | { ok: false; error: string } {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Expected a JSON object' };
  }
  const obj = raw as Record<string, unknown>;
  const source =
    obj.onboardingFlowConfig != null &&
    typeof obj.onboardingFlowConfig === 'object' &&
    !Array.isArray(obj.onboardingFlowConfig)
      ? (obj.onboardingFlowConfig as Record<string, unknown>)
      : obj;
  const config = pickOnboardingFlowConfig(source);
  if (Object.keys(config).length === 0) {
    return {
      ok: false,
      error: 'No recognized onboardingFlowConfig properties found',
    };
  }
  return { ok: true, config };
}

export function buildOnboardingFlowConfigExport(
  config: OnboardingFlowConfigProps
): { onboardingFlowConfig: OnboardingFlowConfigProps } {
  return { onboardingFlowConfig: pickOnboardingFlowConfig(config) };
}

/** Component defaults for keys omitted from the SellSense baseline. */
const ONBOARDING_COMPONENT_DEFAULTS: OnboardingFlowConfigProps = {
  showLinkAccountStep: false,
  hideLinkedAccountRemoval: false,
  showReviewAttestTermsAcknowledgementsIntro: false,
  enablePubliclyTradedCompanies: false,
  showDisclosureFooter: false,
  showDownloadChecklist: false,
  hideSidebar: false,
  docUploadOnlyMode: false,
  alertOnExit: false,
  alertOnPreviousStep: false,
};

/** Effective demo defaults (component defaults + SellSense baseline). */
export function getDemoOnboardingBaseline(): OnboardingFlowConfigProps {
  return {
    ...ONBOARDING_COMPONENT_DEFAULTS,
    ...SELLSENSE_ONBOARDING_BASELINE,
  };
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj);
    const bKeys = Object.keys(bObj);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) => deepEqual(aObj[key], bObj[key]));
  }
  return false;
}

export function isMeaningfulPropOverride(
  key: OnboardingFlowConfigKey,
  value: unknown,
  baseline: OnboardingFlowConfigProps = getDemoOnboardingBaseline()
): boolean {
  if (value === undefined) return false;
  const baselineValue = (baseline as Record<string, unknown>)[key];
  return !deepEqual(value, baselineValue);
}

/** Drop override keys whose values match the demo baseline. */
export function pruneBaselineEqualProps(
  overrides: OnboardingFlowConfigProps,
  baseline: OnboardingFlowConfigProps = getDemoOnboardingBaseline()
): OnboardingFlowConfigProps {
  const picked = pickOnboardingFlowConfig(overrides);
  const pruned: OnboardingFlowConfigProps = {};
  for (const key of ONBOARDING_FLOW_CONFIG_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(picked, key)) continue;
    const value = (picked as Record<string, unknown>)[key];
    if (isMeaningfulPropOverride(key, value, baseline)) {
      (pruned as Record<string, unknown>)[key] = value;
    }
  }
  return pruned;
}

export function countConfiguredProps(
  overrides: OnboardingFlowConfigProps,
  baseline: OnboardingFlowConfigProps = getDemoOnboardingBaseline()
): number {
  return Object.keys(pruneBaselineEqualProps(overrides, baseline)).length;
}

/** Deep-ish merge for nested objects used in overrides. */
export function mergeOnboardingFlowConfig(
  baseline: OnboardingFlowConfigProps,
  ...layers: Array<OnboardingFlowConfigProps | undefined>
): OnboardingFlowConfigProps {
  let result: OnboardingFlowConfigProps = { ...baseline };
  for (const layer of layers) {
    if (!layer) continue;
    const picked = pickOnboardingFlowConfig(layer);
    result = {
      ...result,
      ...picked,
      disclosureConfig:
        picked.disclosureConfig !== undefined
          ? picked.disclosureConfig
          : result.disclosureConfig,
      linkAccountStepOptions:
        picked.linkAccountStepOptions !== undefined
          ? {
              ...(result.linkAccountStepOptions ?? {}),
              ...picked.linkAccountStepOptions,
            }
          : result.linkAccountStepOptions,
      reviewAttestTermsAcknowledgements:
        picked.reviewAttestTermsAcknowledgements !== undefined
          ? picked.reviewAttestTermsAcknowledgements
          : result.reviewAttestTermsAcknowledgements,
    };
  }
  return result;
}

export function setConfigProp(
  overrides: OnboardingFlowConfigProps,
  key: OnboardingFlowConfigKey,
  value: unknown,
  baseline: OnboardingFlowConfigProps = getDemoOnboardingBaseline()
): OnboardingFlowConfigProps {
  const next = { ...overrides };
  if (value === undefined || !isMeaningfulPropOverride(key, value, baseline)) {
    delete (next as Record<string, unknown>)[key];
    return next;
  }
  (next as Record<string, unknown>)[key] = value;
  return next;
}

export function clearConfigProp(
  overrides: OnboardingFlowConfigProps,
  key: OnboardingFlowConfigKey
): OnboardingFlowConfigProps {
  const next = { ...overrides };
  delete (next as Record<string, unknown>)[key];
  return next;
}

export function isPropConfigured(
  overrides: OnboardingFlowConfigProps,
  key: OnboardingFlowConfigKey,
  baseline: OnboardingFlowConfigProps = getDemoOnboardingBaseline()
): boolean {
  if (!Object.prototype.hasOwnProperty.call(overrides, key)) return false;
  return isMeaningfulPropOverride(
    key,
    (overrides as Record<string, unknown>)[key],
    baseline
  );
}
