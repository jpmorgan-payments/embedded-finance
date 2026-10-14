/**
 * Data behind `/ux-atlas`. Mirrors `embedded-components/docs/UX_ATLAS.md`;
 * `atlas.test.ts` fails when a URL here is missing from that document.
 */

export type ResourceKind =
  'guide' | 'api' | 'recipe' | 'storybook' | 'demo' | 'test';

export interface AtlasResource {
  kind: ResourceKind;
  label: string;
  url: string;
}

export const RESOURCE_KIND_ORDER: ResourceKind[] = [
  'guide',
  'api',
  'recipe',
  'storybook',
  'demo',
  'test',
];

export const RESOURCE_KIND_LABELS: Record<ResourceKind, string> = {
  guide: 'Guide',
  api: 'API',
  recipe: 'Recipe',
  storybook: 'Storybook',
  demo: 'Demo',
  test: 'Test',
};

export const RESOURCE_KIND_DESCRIPTIONS: Record<ResourceKind, string> = {
  guide: 'Payments Developer Portal how-to. The normative API documentation.',
  api: 'API reference.',
  recipe: 'UX recipe in this repository. Suggested patterns, not requirements.',
  storybook: 'Live UI states built on the same APIs with our React components.',
  demo: "Page in this repository's showcase app.",
  test: 'Sandbox scenario or magic values from the Testing Catalog.',
};

export const SHOWCASE_ORIGIN = 'https://embedded-finance-dev.com';

const PDP_DOCS =
  'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments';
const PDP_HOW_TO = `${PDP_DOCS}/capabilities/onboard-a-client/how-to`;
const PDP_API = 'https://developer.payments.jpmorgan.com/api';
const PDP_EP_API = `${PDP_API}/embedded-finance-solutions/embedded-payments`;
const GH_BLOB =
  'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components';
const GH_DOCS = `${GH_BLOB}/docs`;
const SB = 'https://storybook.embedded-finance-dev.com/?path=';

export const ATLAS_MARKDOWN_URL = `${GH_DOCS}/UX_ATLAS.md`;
export const PDP_EMBEDDED_PAYMENTS_URL = PDP_DOCS;

const resource =
  (kind: ResourceKind) =>
  (label: string, url: string): AtlasResource => ({ kind, label, url });
const guide = resource('guide');
const api = resource('api');
const recipe = resource('recipe');
const story = resource('storybook');
const demo = resource('demo');
const test = resource('test');

const R = {
  pdpGetStarted: guide('Get started', `${PDP_DOCS}/get-started`),
  pdpCoreConcepts: guide(
    'Core concepts and test personas',
    `${PDP_DOCS}/core-concepts`
  ),
  pdpCreateClient: guide(
    'Create a client profile',
    `${PDP_HOW_TO}/create-a-client-profile`
  ),
  pdpOnboardingReference: guide(
    'Onboarding reference',
    `${PDP_HOW_TO}/onboarding-reference`
  ),
  pdpMultiProduct: guide(
    'Onboard to sub-products and multiple products',
    `${PDP_HOW_TO}/onboard-to-sub-products-and-multiple-products`
  ),
  pdpQuestions: guide(
    'Present onboarding questions',
    `${PDP_HOW_TO}/present-onboarding-questions`
  ),
  pdpNaics: guide(
    'Business classification recommendation',
    `${PDP_HOW_TO}/business-classification-recommendation`
  ),
  pdpIndustry: guide(
    'Industry descriptor reference',
    `${PDP_HOW_TO}/industry-descriptor-reference`
  ),
  pdpPtc: guide(
    'Onboard publicly traded companies',
    `${PDP_HOW_TO}/publicly-traded-companies`
  ),
  pdpIndirect: guide(
    'Collect indirect ownership information',
    `${PDP_HOW_TO}/indirect-ownership`
  ),
  pdpTerms: guide(
    'Display terms and conditions',
    `${PDP_HOW_TO}/display-terms-conditions`
  ),
  pdpAttestations: guide(
    'Present attestations',
    `${PDP_HOW_TO}/present-attestations`
  ),
  pdpComplete: guide(
    'Complete onboarding',
    `${PDP_HOW_TO}/complete-onboarding`
  ),
  pdpUploadDocs: guide('Upload documents', `${PDP_HOW_TO}/upload-documents`),
  pdpUpdateParty: guide(
    'Update party information',
    `${PDP_HOW_TO}/update-party`
  ),
  pdpLinked: guide(
    'Add a linked account',
    `${PDP_DOCS}/capabilities/external-accounts/add-linked-account`
  ),
  pdpPayoutLinked: guide(
    'Pay out to a linked account',
    `${PDP_DOCS}/capabilities/transactions/payouts/how-to/linked-account`
  ),
  pdpNotifications: guide(
    'Notifications',
    `${PDP_DOCS}/capabilities/notification-subscriptions/how-to/notifications`
  ),
  pdpNotificationPayloads: guide(
    'Notification payloads',
    `${PDP_DOCS}/capabilities/notification-subscriptions/how-to/notification-payloads`
  ),

  apiOnboarding: api('Onboarding API reference', `${PDP_EP_API}/onboarding`),
  apiDocuments: api(
    'Documents API reference',
    `${PDP_EP_API}/embedded-payments/documents`
  ),
  apiRecipients: api(
    'Recipients API reference',
    `${PDP_EP_API}/embedded-payments/recipients`
  ),
  apiErrorCodes: api('Error codes', `${PDP_EP_API}/error-codes`),
  apiAuth: api('Authentication', `${PDP_API}/authentication`),
  apiMtls: api(
    'mTLS with digital signature',
    `${PDP_API}/mtls-with-digital-signature`
  ),

  recipeOnboarding: recipe(
    'Digital Onboarding Recipe',
    `${GH_DOCS}/DIGITAL_ONBOARDING_RECIPE.md`
  ),
  recipeOnboardingOwners: recipe(
    'Digital Onboarding Recipe: owners and decision makers',
    `${GH_DOCS}/DIGITAL_ONBOARDING_RECIPE.md#steps-3--4-business-owners-and-decision-makers`
  ),
  recipeOnboardingQuestions: recipe(
    'Digital Onboarding Recipe: due diligence questions',
    `${GH_DOCS}/DIGITAL_ONBOARDING_RECIPE.md#step-5-due-diligence-additional-questions`
  ),
  recipeOnboardingReview: recipe(
    'Digital Onboarding Recipe: review and attestation',
    `${GH_DOCS}/DIGITAL_ONBOARDING_RECIPE.md#step-6-review-and-attestation`
  ),
  recipeOnboardingVerify: recipe(
    'Digital Onboarding Recipe: trigger verification',
    `${GH_DOCS}/DIGITAL_ONBOARDING_RECIPE.md#step-7-trigger-verification`
  ),
  recipeFlowAddress: recipe(
    'Digital Onboarding Flow Recipe: address reference data',
    `${GH_DOCS}/DIGITAL_ONBOARDING_FLOW_RECIPE.md#address-reference-data`
  ),
  recipePtc: recipe(
    'Publicly Traded Companies UI Recipe',
    `${GH_DOCS}/PUBLICLY_TRADED_COMPANIES_RECIPE.md`
  ),
  recipeDocs: recipe(
    'Document Upload Form Guide',
    `${GH_DOCS}/DOCS_UPLOAD_FORM_RECIPE.md`
  ),
  recipeLinked: recipe(
    'Linked Accounts API Workflow Recipe',
    `${GH_DOCS}/LINKED_ACCOUNTS_RECIPE.md`
  ),
  recipeWebhookOnboarding: recipe(
    'Webhook Integration Recipe: onboarding UI',
    `${GH_DOCS}/WEBHOOK_INTEGRATION_RECIPE.md#1-client-facing-onboarding-ui`
  ),
  recipeWebhookRecipients: recipe(
    'Webhook Integration Recipe: linked account events',
    `${GH_DOCS}/WEBHOOK_INTEGRATION_RECIPE.md#recipient-linked-account-events--ux-recommendations`
  ),
  recipeMaintenance: recipe(
    'Approved Client Maintenance Recipe',
    `${GH_DOCS}/APPROVED_CLIENT_MAINTENANCE_RECIPE.md`
  ),
  recipeNaics: recipe(
    'NAICS Recommendation Guide',
    `${GH_DOCS}/NAICS_RECOMMENDATION_IMPLEMENTATION_GUIDE.md`
  ),
  recipeDates: recipe('Date Parsing Guide', `${GH_DOCS}/DATE_PARSING_GUIDE.md`),
  recipeDateSelector: recipe(
    'Important Date Selector Recipe',
    `${GH_DOCS}/IMPORTANT_DATE_SELECTOR_RECIPE.md`
  ),
  recipeQa: recipe('Connect to API Q&A', `${GH_DOCS}/CONNECT_TO_API_QA.md`),
  recipeQaAddress: recipe(
    'Connect to API Q&A: UAT address validation',
    `${GH_DOCS}/CONNECT_TO_API_QA.md#uat-address-validation`
  ),
  recipeQaDocs: recipe(
    'Connect to API Q&A: document requests',
    `${GH_DOCS}/CONNECT_TO_API_QA.md#document-requests`
  ),
  recipeAccelerating: recipe(
    'Accelerating API Implementation',
    `${GH_DOCS}/ACCELERATING_API_IMPLEMENTATION.md`
  ),
  recipeArazzo: recipe(
    'Arazzo workflow spec',
    `${GH_DOCS}/arazzo_specification.yaml`
  ),
  recipeIndirectRules: recipe(
    'IndirectOwnership functional requirements',
    `${GH_BLOB}/src/core/IndirectOwnership/FUNCTIONAL_REQUIREMENTS.md`
  ),
  recipeComponentsReadme: recipe('Components README', `${GH_BLOB}/README.md`),
  recipeHostedGuide: recipe(
    'Partially Hosted UI Integration Guide',
    `${GH_DOCS}/partially-hosted/PARTIALLY_HOSTED_UI_INTEGRATION_GUIDE.md`
  ),

  sbOnboardingDocs: story(
    'OnboardingFlow docs',
    `${SB}/docs/core-onboardingflow--docs`
  ),
  sbLinkedDocs: story(
    'LinkedAccountWidget docs',
    `${SB}/docs/core-linkedaccountwidget--docs`
  ),
  sbGatewayLlc: story(
    'Interactive workflow: registered business',
    `${SB}/story/core-onboardingflow-interactive-workflows--1-a-gateway-select-llc`
  ),
  sbGatewaySoleProp: story(
    'Gateway: select sole proprietorship',
    `${SB}/story/core-onboardingflow-interactive-workflows--1-b-gateway-select-sole-proprietorship`
  ),
  sbOwners: story(
    'Interactive workflow: owners',
    `${SB}/story/core-onboardingflow-interactive-workflows--4-owners-complete-section`
  ),
  sbOperational: story(
    'Interactive workflow: operational details',
    `${SB}/story/core-onboardingflow-interactive-workflows--5-operational-details`
  ),
  sbQuestionConditional: story(
    'Conditional sub-question',
    `${SB}/story/core-onboardingflow-prepopulated-client-questions--conditional-sub-question`
  ),
  sbNaics: story(
    'Industry recommendation',
    `${SB}/story/core-onboardingflow-naics-industry--ai-single-recommendation`
  ),
  sbPtcFresh: story(
    'PTC: fresh client',
    `${SB}/story/core-onboardingflow-publicly-traded-companies--fresh-client`
  ),
  sbPtcPrimary: story(
    'PTC: primary listing, directly traded',
    `${SB}/story/core-onboardingflow-publicly-traded-companies--primary-ptc-nyse`
  ),
  sbPtcSubsidiary: story(
    'PTC: subsidiary of a traded parent',
    `${SB}/story/core-onboardingflow-publicly-traded-companies--primary-subsidiary-nasdaq`
  ),
  sbPtcSoleProp: story(
    'Sole proprietorship: no PTC option',
    `${SB}/story/core-onboardingflow-publicly-traded-companies--sole-proprietorship-no-ptc`
  ),
  sbAddressStatePostal: story(
    'Address: state picker and postal code',
    `${SB}/story/core-onboardingflow-address-countries--state-picker-and-postal-code`
  ),
  sbAddressNone: story(
    'Address: no state, no postal code',
    `${SB}/story/core-onboardingflow-address-countries--no-state-no-postal-code`
  ),
  sbBadAddressCountry: story(
    'Mismatched address country',
    `${SB}/story/core-onboardingflow-bad-api-data--mismatched-address-country`
  ),
  sbIndirectEnabled: story(
    'Onboarding with indirect ownership enabled',
    `${SB}/story/core-onboardingflow-indirect-ownership--enabled`
  ),
  sbIndirectComponent: story(
    'Ownership structure editor',
    `${SB}/story/beta-indirectownership--default`
  ),
  sbPrepopulated: story(
    'Prepopulated client',
    `${SB}/story/core-onboardingflow-prepopulated-client--operator-80-prepopulated`
  ),
  sbReadonlyPopulated: story(
    'Read-only fields when populated',
    `${SB}/story/core-onboardingflow-readonly-fields--when-populated`
  ),
  sbReadonlyLocked: story(
    'Always locked fields',
    `${SB}/story/core-onboardingflow-readonly-fields--always-locked`
  ),
  sbDeltaOperational: story(
    'Only missing fields',
    `${SB}/story/core-onboardingflow-delta-mode--operational-details-only`
  ),
  sbStateReview: story(
    'Client state: review in progress',
    `${SB}/story/core-onboardingflow-client-states--review-in-progress`
  ),
  sbStateInfo: story(
    'Client state: information requested',
    `${SB}/story/core-onboardingflow-client-states--information-requested`
  ),
  sbStateApproved: story(
    'Client state: approved',
    `${SB}/story/core-onboardingflow-client-states--approved`
  ),
  sbStateDeclined: story(
    'Client state: declined',
    `${SB}/story/core-onboardingflow-client-states--declined`
  ),
  sbDocsRequested: story(
    'Documents requested',
    `${SB}/story/core-onboardingflow-documentupload--docs-requested`
  ),
  sbDocsMulti: story(
    'Several documents per requirement',
    `${SB}/story/core-onboardingflow-documentupload--docs-requested-multiple-docs-in-requirement`
  ),
  sbDocsUploadError: story(
    'Document upload error',
    `${SB}/story/core-onboardingflow-documentupload--error-on-upload-document`
  ),
  sbLaEnabled: story(
    'When: enabled client statuses',
    `${SB}/story/core-onboardingflow-linked-account-enabled-statuses--multiple-statuses`
  ),
  sbLaMulti: story(
    'How many: multiple accounts',
    `${SB}/story/core-onboardingflow-linked-account-multi-account--allow-multiple-accounts`
  ),
  sbLaAch: story(
    'Methods: ACH only',
    `${SB}/story/core-onboardingflow-linked-account-payment-methods--link-step-default-ach-only`
  ),
  sbLaMultiMethod: story(
    'Methods: ACH, wire, RTP',
    `${SB}/story/core-onboardingflow-linked-account-payment-methods--link-step-ach-wire-rtp-multi`
  ),
  sbLaMicrodeposits: story(
    'Status: microdeposits initiated',
    `${SB}/story/core-onboardingflow-linked-account-client-states--approved-with-linked-account-microdeposits-initiated`
  ),
  sbLaRejected: story(
    'Status: only rejected accounts',
    `${SB}/story/core-onboardingflow-linked-account-client-states--approved-with-only-rejected-accounts`
  ),
  sbLawStatuses: story(
    'Status: all statuses',
    `${SB}/story/core-linkedaccountwidget-account-statuses--mixed-statuses`
  ),
  sbLawFailed: story(
    'Verification failed',
    `${SB}/story/core-linkedaccountwidget-interactive-workflows--failed-verification`
  ),
  sbLawMax: story(
    'Too many verification attempts',
    `${SB}/story/core-linkedaccountwidget-interactive-workflows--max-attempts-exceeded`
  ),
  sbLawRtp: story(
    'RTP unavailable at bank',
    `${SB}/story/core-linkedaccountwidget-interactive-workflows--rtp-unavailable-at-bank`
  ),
  sbLaErrorRouting: story(
    'Error: invalid routing number',
    `${SB}/story/core-onboardingflow-linked-account-api-errors--error-400-invalid-routing`
  ),
  sbLaErrorDuplicate: story(
    'Error: duplicate account',
    `${SB}/story/core-onboardingflow-linked-account-api-errors--error-409-duplicate`
  ),
  sbMaintenance: story(
    'Approved Client Maintenance overview',
    `${SB}/docs/draft-approvedclientmaintenance--docs`
  ),
  sbMaintenanceStatuses: story(
    'Update request statuses',
    `${SB}/story/draft-approvedclientmaintenance-maintenance-request-statuses--submitted`
  ),

  demoOnboarding: demo(
    'Showcase: onboarding',
    `${SHOWCASE_ORIGIN}/sellsense-demo?fullscreen=true&component=onboarding&theme=Empty`
  ),
  demoLinked: demo(
    'Showcase: linked accounts',
    `${SHOWCASE_ORIGIN}/sellsense-demo?fullscreen=true&component=linked-accounts&theme=Empty`
  ),
  demoHosted: demo(
    'Partially hosted demo',
    `${SHOWCASE_ORIGIN}/partially-hosted-demo`
  ),
  demoWebhooks: demo('Webhook Explorer', `${SHOWCASE_ORIGIN}/webhook-explorer`),
  demoFlowSimulator: demo(
    'Payments Flow Simulator',
    `${SHOWCASE_ORIGIN}/payments-flow-simulator`
  ),

  testCatalog: test(
    'Testing Catalog: prerequisites',
    `${GH_DOCS}/TESTING_CATALOG.md`
  ),
  testMagic: test(
    'Testing Catalog: magic values',
    `${GH_DOCS}/TESTING_CATALOG.md#magic-values-for-sandbox-testing`
  ),
  testOnboard: test(
    'Testing Catalog: Guide 1, onboard clients',
    `${GH_DOCS}/TESTING_CATALOG.md#guide-1-onboard-clients`
  ),
  testLinked: test(
    'Testing Catalog: Guide 4, link an external bank account',
    `${GH_DOCS}/TESTING_CATALOG.md#guide-4-link-an-external-bank-account`
  ),
} satisfies Record<string, AtlasResource>;

export type StageId =
  | 'prepare'
  | 'collect'
  | 'submit'
  | 'after-submission'
  | 'link-account'
  | 'after-approval';

export type ProfileId = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';

export type Answer = 'yes' | 'no' | 'unsure';

export type Answers = Partial<Record<ProfileId, Answer>>;

export const ANSWER_LABELS: Record<Answer, string> = {
  yes: 'Yes',
  no: 'No',
  unsure: 'Not sure',
};

export interface AtlasStage {
  id: StageId;
  number: number;
  title: string;
  summary: string;
  /** Profile question that puts this stage in or out of scope. */
  gate?: ProfileId;
  decisions?: string[];
  build: string[];
  resources: AtlasResource[];
}

interface ProfileQuestionBase {
  id: ProfileId;
  letter: string;
  question: string;
  title: string;
  stageId: StageId;
}

export interface ModuleQuestion extends ProfileQuestionBase {
  type: 'module';
  summary: string;
  build: string[];
  resources: AtlasResource[];
}

export interface GateQuestion extends ProfileQuestionBase {
  type: 'gate';
}

export type ProfileQuestion = ModuleQuestion | GateQuestion;

export const ATLAS_STAGES: AtlasStage[] = [
  {
    id: 'prepare',
    number: 0,
    title: 'Before you build',
    summary: 'Get access, learn the model, and set up testing and webhooks.',
    build: [
      'Create a developer account and a project with the Embedded Payments API enabled, and complete the certificate exchange for the Client Test Environment.',
      'Learn the core concepts: clients, parties, and roles. The test personas cover a limited liability company and a sole proprietor.',
      'Learn the sandbox magic values so you can trigger each state on demand.',
      'Subscribe to webhooks early. Most status screens depend on them.',
    ],
    resources: [
      R.pdpGetStarted,
      R.pdpCoreConcepts,
      R.pdpNotifications,
      R.apiAuth,
      R.apiMtls,
      R.apiErrorCodes,
      R.recipeQa,
      R.recipeAccelerating,
      R.recipeArazzo,
      R.testCatalog,
      R.testMagic,
    ],
  },
  {
    id: 'collect',
    number: 1,
    title: 'Create client and collect data',
    summary: 'Create the client, add its parties, and answer due diligence.',
    build: [
      'Create the client with `POST /clients`. You can start with minimum data (the business, one controller, and the product) and add the rest over time.',
      'Add parties: a controller, every beneficial owner with 25% or more, and any decision makers.',
      'Collect business identity, industry (category and type, or a NAICS code), and contact details. Only mailing addresses may be P.O. boxes, private mailboxes, virtual offices, or registered agent addresses.',
      "Render the due diligence questions listed in the client's `outstanding` object. Ask follow-up sub-questions only when the parent answer requires them.",
      'Apply the profile modules that matched your platform.',
    ],
    resources: [
      R.pdpCreateClient,
      R.pdpMultiProduct,
      R.pdpQuestions,
      R.pdpNaics,
      R.pdpIndustry,
      R.apiOnboarding,
      R.recipeOnboarding,
      R.recipeOnboardingQuestions,
      R.recipeNaics,
      R.recipeDates,
      R.recipeDateSelector,
      R.sbGatewayLlc,
      R.sbOwners,
      R.sbOperational,
      R.sbQuestionConditional,
      R.sbNaics,
      R.testOnboard,
    ],
  },
  {
    id: 'submit',
    number: 2,
    title: 'Review, attest, submit',
    summary: 'Review everything, record the attestation, and submit.',
    build: [
      "Show a review of everything collected, and clear every item in the client's `outstanding` object.",
      'Present the terms and the attestation documents, record the attestation, then submit with `POST /clients/{id}/verifications`.',
    ],
    resources: [
      R.pdpTerms,
      R.pdpAttestations,
      R.pdpComplete,
      R.recipeOnboardingReview,
      R.recipeOnboardingVerify,
    ],
  },
  {
    id: 'after-submission',
    number: 3,
    title: 'After submission',
    summary:
      'Show each status, collect requested documents, react to webhooks.',
    build: [
      'Design a screen for each client status: `REVIEW_IN_PROGRESS`, `INFORMATION_REQUESTED`, `APPROVED`, and `DECLINED`. Approved clients can later become `SUSPENDED` or `TERMINATED`.',
      'When documents are needed, the client moves from `REVIEW_IN_PROGRESS` to `INFORMATION_REQUESTED`, and `outstanding.documentRequestIds` lists the requests. A request can target the client or a related party, and one requirement can accept several document types.',
      'Accept PNG, JPEG, and PDF files up to 2 MB. One document type can take several files, such as the front and back of an ID. Submit each request with `POST /document-requests/{id}/submit`; its status moves from `ACTIVE` to `CLOSED`.',
      'Drive status changes from webhooks and poll only as a fallback. Respond with a `200` within three seconds, ignore duplicate `eventId` values, and expect events out of order.',
    ],
    resources: [
      R.pdpUploadDocs,
      R.pdpNotificationPayloads,
      R.apiDocuments,
      R.recipeDocs,
      R.recipeQaDocs,
      R.recipeWebhookOnboarding,
      R.sbStateReview,
      R.sbStateInfo,
      R.sbStateApproved,
      R.sbStateDeclined,
      R.sbDocsRequested,
      R.sbDocsMulti,
      R.sbDocsUploadError,
      R.demoWebhooks,
      R.testOnboard,
    ],
  },
  {
    id: 'link-account',
    number: 4,
    title: 'Link a bank account',
    summary: 'Add and verify the external account your client gets paid to.',
    gate: 'g',
    decisions: [
      'When: right after submission, or only after approval?',
      'How many: one account, or several? A client with a `LIMITED_DDA` account needs at least one active linked account to receive settlement.',
      "Payment methods: ACH only, or ACH, wire, and RTP? Always send ACH routing details, because microdeposits use ACH. Wire also needs the holder's address. You can add wire and RTP later.",
      "Account holder: ask who owns the external account, the business or an individual. Don't let a preselected default stand in for that answer. Reference the owner's `partyId`, or send a name that exactly matches the onboarded business or one of its owners.",
    ],
    build: [
      'Linked accounts must be US bank accounts with ABA routing numbers.',
      'Design for every status: `PENDING`, `MICRODEPOSITS_INITIATED`, `READY_FOR_VALIDATION`, `ACTIVE`, `REJECTED`, and `INACTIVE`.',
      'Most accounts are validated immediately. Otherwise two microdeposits arrive within 3-5 business days and the account becomes `READY_FOR_VALIDATION`. The client then has 20 business days and 3 attempts to confirm the amounts. After 3 failed attempts, the account is `REJECTED`.',
      'To remove an account, set its status to `INACTIVE`.',
      'Handle API errors such as an invalid routing number or a duplicate account.',
    ],
    resources: [
      R.pdpLinked,
      R.pdpPayoutLinked,
      R.apiRecipients,
      R.recipeLinked,
      R.recipeWebhookRecipients,
      R.sbLaEnabled,
      R.sbLaMulti,
      R.sbLaAch,
      R.sbLaMultiMethod,
      R.sbLaMicrodeposits,
      R.sbLaRejected,
      R.sbLawStatuses,
      R.sbLawFailed,
      R.sbLawMax,
      R.sbLawRtp,
      R.sbLaErrorRouting,
      R.sbLaErrorDuplicate,
      R.testLinked,
    ],
  },
  {
    id: 'after-approval',
    number: 5,
    title: 'After approval',
    summary: 'Let approved clients update their details and add products.',
    gate: 'h',
    build: [
      'Let approved clients update their details through update requests. This is available for clients in the US and Canada with supported legal entity types.',
      'Send only the changed fields with `PATCH /parties/{partyId}`, or add a party with `POST /parties`. Changes collect in one draft request per client (`updateRequest` with status `NEW`). Supported changes: legal name or DBA, address, and adding, removing, or modifying related parties.',
      'Upload any requested documents and complete the attestations, then submit with `POST /clients/{id}/verifications`. Outcomes are `APPROVED`, `DECLINED`, or `TERMINATED`, for example when an information request goes unanswered for 30 days. Approved data appears in responses 24 to 48 hours after approval.',
      'Show the approved values next to the proposed changes until the request completes.',
      'Add sub-products to an approved client when needed.',
    ],
    resources: [
      R.pdpUpdateParty,
      R.pdpMultiProduct,
      R.recipeMaintenance,
      R.sbMaintenance,
      R.sbMaintenanceStatuses,
    ],
  },
];

export const PROFILE_QUESTIONS: ProfileQuestion[] = [
  {
    id: 'a',
    letter: 'A',
    type: 'module',
    stageId: 'collect',
    title: 'Sole proprietorships',
    question: 'Do you onboard sole proprietorships?',
    summary:
      'The individual is the business, but it is still onboarded as a business.',
    build: [
      "Collect business details for the individual: a DBA name if they operate under one, and a tax ID. Use the business's EIN if it has one, otherwise the owner's SSN.",
      'Give the individual both the `CONTROLLER` and `BENEFICIAL_OWNER` roles.',
      "The business is formed in the US, and the owner's country of residence can only be the US.",
      "Don't offer publicly traded options to a sole proprietorship.",
    ],
    resources: [
      R.pdpCreateClient,
      R.pdpOnboardingReference,
      R.pdpCoreConcepts,
      R.recipeOnboardingOwners,
      R.sbGatewaySoleProp,
      R.sbPtcSoleProp,
    ],
  },
  {
    id: 'b',
    letter: 'B',
    type: 'module',
    stageId: 'collect',
    title: 'Publicly traded companies',
    question: 'Do you onboard publicly traded companies or their subsidiaries?',
    summary:
      'Listed companies and their subsidiaries follow different owner and controller rules.',
    build: [
      "Ask for the business's legal form, then whether it is directly traded, a subsidiary of a publicly traded parent, or neither.",
      'Send both `isSubsidiary` and `publiclyTraded` for these businesses. For a subsidiary, send the listing of the publicly traded parent that owns 51% or more of it.',
      'Owner and controller requirements depend on where the company or its parent is listed. Adjust the rest of the journey to match.',
    ],
    resources: [
      R.pdpPtc,
      R.recipePtc,
      R.sbPtcFresh,
      R.sbPtcPrimary,
      R.sbPtcSubsidiary,
    ],
  },
  {
    id: 'c',
    letter: 'C',
    type: 'module',
    stageId: 'collect',
    title: 'Non-US individuals',
    question:
      'Do businesses have controllers or beneficial owners who live outside the US?',
    summary:
      'Country of residence drives the address fields and the ID types you collect.',
    build: [
      'Let users change the country of residence for controllers and beneficial owners. Sole proprietorships are the exception.',
      'Collect the address for that country. State and postal code rules vary: HK, SG, AE, and QA need special handling of the state and postal code fields.',
      "Offer government ID types that fit the issuing country (`individualIds[].idType` and `issuer`). The Portal's field reference lists `SSN` and `ITIN`, so confirm which ID types your program accepts for non-US individuals.",
    ],
    resources: [
      R.pdpOnboardingReference,
      R.recipeFlowAddress,
      R.recipeQaAddress,
      R.sbAddressStatePostal,
      R.sbAddressNone,
      R.sbBadAddressCountry,
    ],
  },
  {
    id: 'd',
    letter: 'D',
    type: 'module',
    stageId: 'collect',
    title: 'Indirect ownership',
    question: 'Do businesses have intermediary (indirect) ownership?',
    summary:
      'Owners can hold their stake through one or more intermediary businesses.',
    build: [
      'Ask whether any businesses own part of the client (`entitiesInOwnership`).',
      'If so, collect every individual and every intermediary business that owns 25% or more of the client, directly or indirectly.',
      'Create intermediaries as `ORGANIZATION` parties with the `INTERMEDIARY_OWNER` role. Link each layer to its immediate parent with `parentPartyId`, and set `natureOfOwnership`.',
      'Confirm with your J.P. Morgan representative which sub-products, such as `LIMITED_DDA_PAYMENTS`, require the full ownership chain.',
    ],
    resources: [
      R.pdpIndirect,
      R.recipeIndirectRules,
      R.sbIndirectEnabled,
      R.sbIndirectComponent,
    ],
  },
  {
    id: 'e',
    letter: 'E',
    type: 'module',
    stageId: 'collect',
    title: 'Other legal forms',
    question:
      'Do you onboard nonprofits, government entities, partnerships, or unincorporated associations?',
    summary:
      'These organization types can need different fields, owners, and documents.',
    build: [
      'Besides LLCs, corporations, and sole proprietorships, the API accepts nonprofits (`NON_PROFIT_CORPORATION`), government entities (`GOVERNMENT_ENTITY`), unincorporated associations (`UNINCORPORATED_ASSOCIATION`), and partnerships.',
      'Check the API reference for the current list of organization types and any deprecated values.',
      'Confirm the required fields, owners, and documents for these forms with your J.P. Morgan representative.',
    ],
    resources: [R.pdpOnboardingReference, R.apiOnboarding],
  },
  {
    id: 'f',
    letter: 'F',
    type: 'module',
    stageId: 'collect',
    title: 'Prefilled data',
    question:
      'Do you already hold business or owner data, for example from existing customers or a migration?',
    summary:
      'Decide what you send up front, what users may change, and what they still see.',
    build: [
      'Decide which data you send when you create the client. You can start with minimum data and add the rest over time.',
      'Decide which prefilled fields the participant may change and which are locked.',
      "Decide whether participants see only what is still missing. The client's `outstanding` object lists missing items, and each party's `validationResponse` lists its missing fields.",
      'After approval, changes go through update requests instead (Stage 5).',
    ],
    resources: [
      R.pdpCreateClient,
      R.sbPrepopulated,
      R.sbReadonlyPopulated,
      R.sbReadonlyLocked,
      R.sbDeltaOperational,
    ],
  },
  {
    id: 'g',
    letter: 'G',
    type: 'gate',
    stageId: 'link-account',
    title: 'Linked bank accounts',
    question: 'Will clients link an external bank account?',
  },
  {
    id: 'h',
    letter: 'H',
    type: 'gate',
    stageId: 'after-approval',
    title: 'Updates after approval',
    question: 'Will clients update their details after approval?',
  },
];

export const ALTERNATIVES: {
  title: string;
  whenToChoose: string;
  resources: AtlasResource[];
}[] = [
  {
    title: 'Embedded components (React)',
    whenToChoose: 'You want our screens inside your React app.',
    resources: [
      R.recipeComponentsReadme,
      R.sbOnboardingDocs,
      R.sbLinkedDocs,
      R.demoOnboarding,
      R.demoLinked,
    ],
  },
  {
    title: 'Partially hosted UI',
    whenToChoose: 'You want J.P. Morgan to host the onboarding screens.',
    resources: [R.recipeHostedGuide, R.demoHosted],
  },
  {
    title: 'Compare integration patterns',
    whenToChoose: "You're still choosing.",
    resources: [R.demoFlowSimulator],
  },
];

const PROFILE_IDS = PROFILE_QUESTIONS.map((q) => q.id);

export function isProfileId(value: string): value is ProfileId {
  return (PROFILE_IDS as string[]).includes(value);
}

export function getStage(id: StageId): AtlasStage {
  const stage = ATLAS_STAGES.find((s) => s.id === id);
  if (!stage) throw new Error(`Unknown atlas stage: ${id}`);
  return stage;
}

export function getQuestion(id: ProfileId): ProfileQuestion {
  const question = PROFILE_QUESTIONS.find((q) => q.id === id);
  if (!question) throw new Error(`Unknown profile question: ${id}`);
  return question;
}

/** "Not sure" counts as yes so the work stays visible until confirmed. */
export function isIncluded(answer: Answer | undefined): boolean {
  return answer === 'yes' || answer === 'unsure';
}

export function isStageInScope(stage: AtlasStage, answers: Answers): boolean {
  return !stage.gate || answers[stage.gate] !== 'no';
}

export function modulesForStage(stageId: StageId): ModuleQuestion[] {
  return PROFILE_QUESTIONS.filter(
    (q): q is ModuleQuestion => q.type === 'module' && q.stageId === stageId
  );
}

export function countAnswered(answers: Answers): number {
  return PROFILE_IDS.filter((id) => answers[id] !== undefined).length;
}

export interface StageSelection {
  stage: AtlasStage;
  inScope: boolean;
  modules: { module: ModuleQuestion; answer: Answer }[];
}

export function selectAtlas(answers: Answers): StageSelection[] {
  return ATLAS_STAGES.map((stage) => ({
    stage,
    inScope: isStageInScope(stage, answers),
    modules: modulesForStage(stage.id)
      .filter((module) => isIncluded(answers[module.id]))
      .map((module) => ({ module, answer: answers[module.id] as Answer })),
  }));
}

export interface AnswersSearch {
  yes?: string;
  no?: string;
  unsure?: string;
}

const SEARCH_KEYS: (keyof AnswersSearch & Answer)[] = ['yes', 'unsure', 'no'];

/** Reads `?yes=a,b&no=c&unsure=d`. An ID listed under several answers keeps the first one. */
export function parseAnswers(search: AnswersSearch): Answers {
  const answers: Answers = {};
  for (const key of SEARCH_KEYS) {
    for (const raw of (search[key] ?? '').split(',')) {
      const id = raw.trim().toLowerCase();
      if (isProfileId(id) && answers[id] === undefined) answers[id] = key;
    }
  }
  return answers;
}

export function serializeAnswers(answers: Answers): AnswersSearch {
  const search: AnswersSearch = {};
  for (const key of SEARCH_KEYS) {
    const ids = PROFILE_IDS.filter((id) => answers[id] === key);
    if (ids.length > 0) search[key] = ids.join(',');
  }
  return search;
}

function resourcesToMarkdown(resources: AtlasResource[]): string[] {
  return RESOURCE_KIND_ORDER.flatMap((kind) =>
    resources
      .filter((r) => r.kind === kind)
      .map((r) => `- ${RESOURCE_KIND_LABELS[kind]}: [${r.label}](${r.url})`)
  );
}

/** Checklist for the selected profile, ready to paste into an email or ticket. */
export function toMarkdown(
  answers: Answers,
  options: { shareUrl?: string } = {}
): string {
  const lines: string[] = [
    '# Embedded Payments UX Atlas: implementation checklist',
    '',
  ];
  if (options.shareUrl) {
    lines.push(`Interactive version: ${options.shareUrl}`, '');
  }

  lines.push('## Platform profile', '');
  for (const q of PROFILE_QUESTIONS) {
    const answer = answers[q.id];
    const label = answer ? ANSWER_LABELS[answer] : 'Not answered';
    const note =
      answer === 'unsure'
        ? ' Confirm with your J.P. Morgan representative.'
        : '';
    lines.push(`- **${q.letter}. ${q.question}** ${label}.${note}`);
  }

  for (const { stage, inScope, modules } of selectAtlas(answers)) {
    if (!inScope) continue;
    lines.push('', `## Stage ${stage.number}: ${stage.title}`, '');
    if (stage.decisions) {
      lines.push('Decide first:', '');
      stage.decisions.forEach((d, i) => lines.push(`${i + 1}. ${d}`));
      lines.push('');
    }
    lines.push(...stage.build.map((b) => `- ${b}`), '');
    lines.push('Resources:', '', ...resourcesToMarkdown(stage.resources));

    for (const { module, answer } of modules) {
      const flag = answer === 'unsure' ? ' (not sure yet)' : '';
      lines.push('', `### ${module.letter}. ${module.title}${flag}`, '');
      lines.push(...module.build.map((b) => `- ${b}`), '');
      lines.push('Resources:', '', ...resourcesToMarkdown(module.resources));
    }
  }

  return `${lines.join('\n')}\n`;
}

export function allAtlasResources(): AtlasResource[] {
  return [
    ...ATLAS_STAGES.flatMap((s) => s.resources),
    ...PROFILE_QUESTIONS.flatMap((q) =>
      q.type === 'module' ? q.resources : []
    ),
    ...ALTERNATIVES.flatMap((a) => a.resources),
  ];
}

export type AtlasFocus =
  | { type: 'stage'; stage: AtlasStage }
  | { type: 'module'; module: ModuleQuestion };

/** Maps `?focus=` (a stage ID or module letter) to a map item; unknown values fall back to Stage 0. */
export function resolveFocus(focus: string | undefined): AtlasFocus {
  const id = focus?.trim().toLowerCase() ?? '';
  const stage = ATLAS_STAGES.find((s) => s.id === id);
  if (stage) return { type: 'stage', stage };
  if (isProfileId(id)) {
    const question = getQuestion(id);
    if (question.type === 'module') return { type: 'module', module: question };
    return { type: 'stage', stage: getStage(question.stageId) };
  }
  return { type: 'stage', stage: ATLAS_STAGES[0] };
}

export function focusId(focus: AtlasFocus): string {
  return focus.type === 'stage' ? focus.stage.id : focus.module.id;
}

/** Keeps showcase links inside the current deployment (local dev, previews). */
export function toAppHref(url: string): string {
  return url.startsWith(`${SHOWCASE_ORIGIN}/`)
    ? url.slice(SHOWCASE_ORIGIN.length)
    : url;
}
