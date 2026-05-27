import type {
  LinkAccountStepOptions,
  OnboardingFlowProps,
} from '@jpmorgan-payments/embedded-finance-components';

import type { ThemeOption } from '@/components/sellsense/use-sellsense-themes';
import { TEST_SCENARIO_BUNDLE_MULTI_LINKED_CLIENT_ID } from '@/mocks/testScenarioMultiLinkedIllustrationClient.mock';
import { TEST_DEMO_SCENARIO_CLIENT_ID } from '@/mocks/testScenarioOperator80Client.mock';
import type { TestDemoScenarioMode, TestScenarioBundleId } from '@/msw/db';

/** Public pathname for each demo; bundle id matches the route (e.g. `test-scenario-2` → `/test-scenario-2`). */
export const TEST_SCENARIO_ROUTE_BY_BUNDLE = {
  'test-scenario': '/test-scenario',
  'test-scenario-2': '/test-scenario-2',
  'test-scenario-3': '/test-scenario-3',
} as const satisfies Record<TestScenarioBundleId, string>;

export type TestScenarioLoginProfile = {
  email: string;
  label: string;
  scenario: TestDemoScenarioMode;
  /** Override bundle `linkAccountStepOptions` only when a login needs an exceptional shape. */
  linkAccountStepOptions?: LinkAccountStepOptions;
};

export type TestScenarioBundleConfig = {
  id: TestScenarioBundleId;
  headerOrgDisplayName: string;
  theme: ThemeOption;
  contentTokens: {
    name: 'enUS';
    showTokenIds: boolean;
    tokens: Record<string, unknown>;
  };
  showLinkAccountStep: boolean;
  clientId: string;
  /**
   * Default `linkAccountStepOptions` for this bundle’s logins (profiles normally only set MSW `scenario`).
   */
  linkAccountStepOptions?: LinkAccountStepOptions;
  /**
   * Static `<OnboardingFlow />` props for this bundle. When omitted, `TestScenarioPage` uses built-in defaults.
   */
  onboardingFlow?: Pick<
    OnboardingFlowProps,
    | 'availableProducts'
    | 'availableJurisdictions'
    | 'availableOrganizationTypes'
    | 'disclosureConfig'
    | 'hideLinkedAccountRemoval'
  >;
  loginProfiles: TestScenarioLoginProfile[];
};

const LINKED_ACCOUNT_OPTIONS: LinkAccountStepOptions = {
  completionMode: 'reviewOnly',
  initialValues: {
    accountType: 'INDIVIDUAL',
    firstName: 'Taylor',
    lastName: 'Morgan',
    businessName: '',
    routingNumbers: [{ paymentType: 'ACH', routingNumber: '121000248' }],
    useSameRoutingNumber: true,
    accountNumber: '6724301068',
    bankAccountType: 'CHECKING',
    paymentTypes: ['ACH'],
    certify: true,
  },
  summaryDisplayedPaymentTypes: ['ACH'],
  reviewAcknowledgements: [
    {
      id: 'verifyAndAccuracy',
      labelKey:
        'screens.linkAccount.prefillSummary.acknowledgements.verifyAndAccuracy',
    },
  ],
  showAcknowledgementsIntro: false,
};

function buildContentTokens(fieldLabels: {
  controllerJobTitle: string;
  controllerJobTitleDescription: string;
}): TestScenarioBundleConfig['contentTokens'] {
  return {
    name: 'enUS',
    showTokenIds: true,
    tokens: {
      'onboarding-overview': {
        fields: {
          controllerJobTitle: {
            label: fieldLabels.controllerJobTitle,
          },
          controllerJobTitleDescription: {
            label: fieldLabels.controllerJobTitleDescription,
          },
        },
        reviewAndAttest: {
          attestation: {
            accurateInfo:
              'The data I am providing is true, accurate and complete to the best of my knowledge.',
            authorizeSharing:
              'You authorize Platform, Inc. and JPMorgan Chase Bank, N.A. ("JPMC") to share information to facilitate the opening of your deposit account(s), and appoint Platform, Inc. as your agent to act on your behalf regarding your deposit account pursuant to your agreement(s) with Platform, Inc..',
          },
          termsAndConditions: {
            agreeToTerms:
              "You have read, understand, and agree to the J.P. Morgan Account Terms and Platform Inc.'s Program Agreement.",
          },
        },
        screens: {
          linkAccount: {
            prefillSummary: {
              acknowledgements: {
                verifyAndAccuracy:
                  'I authorize verification of this external bank account, including microdeposit verification if required. I certify that the information provided is accurate and matches my bank account details.',
              },
            },
          },
        },
      },
    },
  } as TestScenarioBundleConfig['contentTokens'];
}

/**
 * `/test-scenario-2` only: optional login that seeds three LINKED_ACCOUNT rows (see `applyTestDemoScenario`).
 * Other bundle logins (`linked-microdeposit`, `linked-active`) start with zero linked recipients.
 */
const MULTI_LINK_START_PROFILES: TestScenarioLoginProfile[] = [
  {
    email: '3-linked@demo.test',
    label:
      'Mock starts with three linked bank accounts (GET /recipients returns three LINKED_ACCOUNT rows)',
    scenario: 'multi-linked-start-3',
  },
];

const OPERATOR_PROFILES: TestScenarioLoginProfile[] = [
  {
    email: 'happy-path@demo.test',
    label: 'Happy path \u2013 no document request, no micro deposits',
    scenario: 'happy-path',
  },
  {
    email: 'docs-requested@demo.test',
    label: 'Unhappy path \u2013 straight to document request',
    scenario: 'doc-request',
  },
  {
    email: 'linked-microdeposit@demo.test',
    label: 'Unhappy path \u2013 straight to linked account with microdeposit',
    scenario: 'linked-account-approved',
  },
  {
    email: 'linked-active@demo.test',
    label: 'Happy path \u2013 straight to linked account no microdeposit',
    scenario: 'linked-account-active',
  },
];

/** `/test-scenario-2`: same onboarding logins as `/test-scenario`, plus MSW-only linked-account count variants. */
const MULTI_LINK_DEMO_PROFILES: TestScenarioLoginProfile[] = [
  ...OPERATOR_PROFILES,
  ...MULTI_LINK_START_PROFILES,
];

const NO_LINK_PROFILES: TestScenarioLoginProfile[] = [
  {
    email: 'happy-path@demo.test',
    label: 'Happy path \u2013 no document request, no micro deposits',
    scenario: 'happy-path',
  },
  {
    email: 'docs-requested@demo.test',
    label: 'Unhappy path \u2013 straight to document request',
    scenario: 'doc-request',
  },
];

const BUNDLES: Record<TestScenarioBundleId, TestScenarioBundleConfig> = {
  'test-scenario': {
    id: 'test-scenario',
    headerOrgDisplayName: 'Operator 80 Palo Alto CA',
    theme: 'Salt Theme',
    contentTokens: buildContentTokens({
      controllerJobTitle: 'Occupation',
      controllerJobTitleDescription: 'Occupation Description',
    }),
    showLinkAccountStep: true,
    clientId: TEST_DEMO_SCENARIO_CLIENT_ID,
    linkAccountStepOptions: LINKED_ACCOUNT_OPTIONS,
    loginProfiles: OPERATOR_PROFILES,
  },
  'test-scenario-2': {
    id: 'test-scenario-2',
    headerOrgDisplayName: 'Riverbend Cafe Collective',
    theme: 'SellSense',
    contentTokens: buildContentTokens({
      controllerJobTitle: 'Role',
      controllerJobTitleDescription: 'Role details',
    }),
    showLinkAccountStep: true,
    clientId: TEST_SCENARIO_BUNDLE_MULTI_LINKED_CLIENT_ID,
    /**
     * Same `linkAccountStepOptions` as Storybook `ExistingAccountsWithAddMore`.
     * @see https://storybook.embedded-finance-dev.com/?path=/story/core-onboardingflow-linked-account-multi-account--existing-accounts-with-add-more
     */
    linkAccountStepOptions: {
      completionMode: 'reviewOnly',
      allowMultipleAccounts: true,
      existingAccountsDisplay: 'compact',
      initialValues: {
        accountType: 'INDIVIDUAL',
        firstName: 'Taylor',
        lastName: 'Morgan',
        businessName: '',
        routingNumbers: [{ paymentType: 'ACH', routingNumber: '021000021' }],
        useSameRoutingNumber: true,
        accountNumber: '44556677889900112',
        bankAccountType: 'CHECKING',
        paymentTypes: ['ACH'],
        certify: true,
      },
    },
    onboardingFlow: {
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
      disclosureConfig: { platformName: 'Platform, Inc.' },
      hideLinkedAccountRemoval: true,
    },
    loginProfiles: MULTI_LINK_DEMO_PROFILES,
  },
  'test-scenario-3': {
    id: 'test-scenario-3',
    headerOrgDisplayName: 'Operator 80 Palo Alto CA',
    theme: 'PayFicient',
    contentTokens: buildContentTokens({
      controllerJobTitle: 'Position',
      controllerJobTitleDescription: 'Position summary',
    }),
    showLinkAccountStep: false,
    clientId: TEST_DEMO_SCENARIO_CLIENT_ID,
    loginProfiles: NO_LINK_PROFILES,
  },
};

export function getTestScenarioBundleConfig(
  id: TestScenarioBundleId
): TestScenarioBundleConfig {
  return BUNDLES[id];
}
