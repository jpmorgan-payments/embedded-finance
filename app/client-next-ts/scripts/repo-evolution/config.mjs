/**
 * Editorial config for the /repo-evolution subway map.
 *
 * The generator (generate.mjs) combines this with `git` history. Every date, commit and count is
 * derived from git; planned stations must point at an open item in a file tracked in the repo.
 *
 * - lines: product areas, drawn top-to-bottom in this order, coloured with official MTA route
 *   colours. `weight: 'support'` draws a thinner line. A line opens with its own terminus or
 *   branches off `branchFrom`, at `start` (a rule) or at its first station.
 * - milestones: the stations. `kind`:
 *     express  stops the 60s "express" playback with a caption (white dot)
 *     local    detail stop, captioned only when riding step by step (black dot)
 *     planned  open roadmap item, drawn on a dashed extension after "Today"
 *   `line: null` draws a marker across the whole map instead of a station.
 */

export const REPO_URL = 'https://github.com/jpmorgan-payments/embedded-finance';

export const LINES = [
  {
    id: 'docs',
    label: 'Docs & AI',
    bullet: 'D',
    color: '#EE352E',
    weight: 'support',
    blurb:
      'Guides, recipes, CI and the agent skills that encode our conventions.',
    start: { type: 'first-commit' },
  },
  {
    id: 'showcase',
    label: 'Showcase',
    bullet: 'S',
    color: '#B933AD',
    weight: 'support',
    blurb: 'Demo apps and servers that show the components working end-to-end.',
  },
  {
    id: 'onboarding',
    label: 'Onboarding',
    bullet: 'O',
    color: '#FF6319',
    weight: 'main',
    blurb:
      'Digital onboarding & KYC: collect business and owner data, then keep it current.',
    branchFrom: 'core',
  },
  {
    id: 'core',
    label: 'Core library',
    bullet: 'C',
    color: '#0039A6',
    weight: 'main',
    blurb:
      'Provider, design tokens, eb- UI kit, OpenAPI-generated hooks and i18n.',
  },
  {
    id: 'accounts',
    label: 'Accounts',
    bullet: 'A',
    color: '#00933C',
    weight: 'main',
    blurb:
      'Accounts, linked bank accounts, recipients and transaction history.',
    branchFrom: 'core',
  },
  {
    id: 'payments',
    label: 'Payments',
    bullet: 'P',
    color: '#FCCC0A',
    bulletText: '#000000',
    weight: 'main',
    blurb: 'Pay recipients over ACH, RTP and wire — and across currencies.',
    branchFrom: 'accounts',
  },
];

const EC = 'embedded-components';
const CORE = `${EC}/src/core`;
const BACKLOG = `${EC}/BACKLOG.md`;

/**
 * History rules (resolve to a commit):
 *   first-commit | head | path (first commit touching it) | removed (commit deleting it)
 *   pickaxe (first commit adding `text` under `path`) | version | tag | commit-count | pr
 * Planned rule: { type: 'planned', path, match, open: [...] } — the first line of `path`
 * containing `match` is the source; it stays planned while that line or its section still
 * contains one of `open`. Otherwise the generator warns so it can be promoted to history.
 */
export const MILESTONES = [
  // ------------------------------------------------------------ 2023–2024
  {
    id: 'genesis',
    kind: 'express',
    line: 'showcase',
    label: 'Repo opens',
    rule: { type: 'first-commit' },
    title: 'The repo goes public',
    blurb:
      'J.P. Morgan Payments opens embedded-finance with a sample showcase app and a sandbox API proxy for Embedded Payments.',
  },
  {
    id: 'components-born',
    kind: 'express',
    line: 'core',
    label: 'Library born',
    rule: { type: 'path', path: EC },
    title: 'embedded-components is born',
    blurb:
      'A React + Tailwind component library — every class eb- prefixed — so platforms can drop banking UI straight into their own product.',
  },
  {
    id: 'openapi',
    kind: 'local',
    line: 'core',
    label: 'OpenAPI hooks',
    rule: { type: 'path', path: `${EC}/api-specs` },
    title: 'Contract-first',
    blurb:
      'OpenAPI specs go in, typed React Query hooks come out — the UI is generated against the real Embedded Payments contracts.',
  },
  {
    id: 'linked-accounts',
    kind: 'express',
    line: 'accounts',
    label: 'Linked accounts',
    rule: { type: 'path', path: `${CORE}/LinkedAccountWidget` },
    title: 'Link a bank account',
    blurb:
      'The first money-movement building block: connect an external account and verify it with microdeposits.',
  },
  {
    id: 'first-release',
    kind: 'express',
    line: 'core',
    label: 'v0.1.0',
    rule: { type: 'version', version: '0.1.0' },
    title: 'v0.1.0 ships to npm',
    blurb:
      '@jpmorgan-payments/embedded-finance-components gets its first published version.',
  },
  {
    id: 'onboarding-wizard',
    kind: 'express',
    line: 'onboarding',
    label: 'Onboarding wizard',
    rule: { type: 'path', path: `${CORE}/OnboardingWizard` },
    title: 'Digital onboarding begins',
    blurb:
      'An onboarding wizard collects business, controller and owner details for Know-Your-Customer due diligence.',
  },
  {
    id: 'recipes',
    kind: 'local',
    line: 'docs',
    label: 'First recipes',
    rule: { type: 'path', path: `${EC}/docs/LINKED_ACCOUNTS_RECIPE.md` },
    title: 'Recipes for integrators',
    blurb:
      'Step-by-step integration recipes start alongside the code, beginning with linked accounts.',
  },
  {
    id: 'msw',
    kind: 'local',
    line: 'core',
    label: 'MSW mocks',
    rule: { type: 'path', path: `${EC}/src/msw` },
    title: 'Mock everything',
    blurb:
      'Mock Service Worker lands: every component can be demoed and tested without a backend.',
  },
  {
    id: 'transactions',
    kind: 'express',
    line: 'accounts',
    label: 'Transactions',
    rule: { type: 'path', path: `${CORE}/TransactionsDisplay` },
    title: 'Money you can see',
    blurb:
      'TransactionsDisplay brings account activity and transaction details into the embedded experience.',
  },
  {
    id: 'i18n',
    kind: 'express',
    line: 'core',
    label: 'fr-CA',
    rule: { type: 'path', path: `${EC}/src/i18n/fr-CA` },
    title: 'Bonjour, fr-CA',
    blurb:
      'A second locale and translatable copy: the components start speaking more than English.',
  },

  // ------------------------------------------------------------ 2025
  {
    id: 'ai-rules',
    kind: 'express',
    line: 'docs',
    label: 'AI rules',
    rule: { type: 'path', path: '.cursorrules' },
    title: 'AI joins the team',
    blurb:
      'The first AI-assistant rules are committed — conventions written down for humans and agents alike.',
  },
  {
    id: 'make-payment',
    kind: 'express',
    line: 'payments',
    label: 'MakePayment',
    rule: { type: 'path', path: `${CORE}/MakePayment` },
    title: 'Make a payment',
    blurb:
      'Pay a recipient from an embedded account, choosing the payment rail that fits.',
  },
  {
    id: 'sellsense',
    kind: 'express',
    line: 'showcase',
    label: 'SellSense',
    rule: { type: 'path', path: 'app/client-next-ts' },
    title: 'Welcome to SellSense',
    blurb:
      'A brand-new showcase: a fictional marketplace that embeds every component, with themes and content tones to switch live.',
  },
  {
    id: 'session-transfer',
    kind: 'local',
    line: 'onboarding',
    label: 'Hosted onboarding',
    rule: { type: 'path', path: 'app/server-session-transfer' },
    title: 'Partially hosted onboarding',
    blurb:
      'Hand a user from the platform into hosted onboarding with a secure session transfer.',
  },
  {
    id: 'recipients',
    kind: 'local',
    line: 'accounts',
    label: 'Recipients',
    rule: { type: 'path', path: `${CORE}/Recipients` },
    title: 'Manage recipients',
    blurb:
      'Create and edit the people and businesses a client pays, with ACH, RTP and wire details.',
  },
  {
    id: 'onboarding-flow',
    kind: 'express',
    line: 'onboarding',
    label: 'OnboardingFlow',
    rule: { type: 'path', path: `${CORE}/OnboardingFlow` },
    title: 'OnboardingFlow, rebuilt',
    blurb:
      'Onboarding is redesigned from scratch into a guided, section-by-section flow — the wizards begin to retire.',
  },
  {
    id: 'webhooks',
    kind: 'local',
    line: 'docs',
    label: 'Webhooks recipe',
    rule: { type: 'path', path: `${EC}/docs/WEBHOOK_INTEGRATION_RECIPE.md` },
    title: 'Listen for events',
    blurb:
      'A webhook integration recipe: keep the platform in sync as clients, accounts and payments change state.',
  },
  {
    id: 'indirect-ownership',
    kind: 'local',
    line: 'onboarding',
    label: 'Indirect owners',
    rule: { type: 'path', path: `${CORE}/IndirectOwnership` },
    title: 'Who really owns this business?',
    blurb:
      'Indirect ownership: map beneficial owners through layers of parent companies.',
  },
  {
    id: 'es-us',
    kind: 'local',
    line: 'core',
    label: 'es-US',
    rule: { type: 'path', path: `${EC}/src/i18n/es-US` },
    title: '¡Hola, es-US!',
    blurb:
      'A third locale, with localized formatting for dates, currency and numbers.',
  },

  // ------------------------------------------------------------ 2026
  {
    id: 'recipient-widgets',
    kind: 'local',
    line: 'accounts',
    label: 'RecipientsWidget',
    rule: { type: 'path', path: `${CORE}/RecipientWidgets` },
    title: 'One widget for every recipient',
    blurb:
      'Linked accounts and recipients merge into a single, configurable RecipientsWidget.',
  },
  {
    id: 'payment-flow',
    kind: 'express',
    line: 'payments',
    label: 'PaymentFlow',
    rule: { type: 'path', path: `${CORE}/PaymentFlow` },
    title: 'PaymentFlow',
    blurb:
      'One guided flow for paying anyone: pick a recipient, the rail and the amount, then review and send.',
  },
  {
    id: 'agent-skills',
    kind: 'express',
    line: 'docs',
    label: 'Agent skills',
    rule: { type: 'path', path: '.github/skills' },
    title: 'Agent skills',
    blurb:
      'Architecture, testing, styling and i18n rules become skills that AI coding agents load on demand.',
  },
  {
    id: 'content-tokens',
    kind: 'local',
    line: 'core',
    label: 'Content tokens',
    rule: { type: 'path', path: `${EC}/docs/CONTENT_TOKENS_ARCHITECTURE.md` },
    title: 'Every word is a token',
    blurb:
      'Content tokens let each platform re-word any string in any locale without forking the library.',
  },
  {
    id: 'ptc',
    kind: 'local',
    line: 'onboarding',
    label: 'Public companies',
    rule: {
      type: 'pickaxe',
      text: 'enablePubliclyTradedCompanies',
      path: `${EC}/src`,
    },
    title: 'Publicly traded companies',
    blurb:
      'OnboardingFlow learns to onboard publicly traded companies and their subsidiaries, behind an opt-in flag.',
  },
  {
    id: 'tagged-releases',
    kind: 'local',
    line: 'core',
    label: 'Release train',
    rule: { type: 'tag', tag: 'v0.14.2' },
    title: 'Release train',
    blurb:
      'Git tags and a CHANGELOG: every release is now named, dated and documented.',
  },
  {
    id: 'legacy-retired',
    kind: 'local',
    line: 'core',
    label: 'Legacy retired',
    rule: { type: 'removed', path: `${CORE}/OnboardingWizardBasic` },
    title: 'Last stop for the legacy widgets',
    blurb:
      'A breaking release removes OnboardingWizardBasic and the original MakePayment — OnboardingFlow and PaymentFlow take over.',
  },
  {
    id: 'fx',
    kind: 'express',
    line: 'payments',
    label: 'FX',
    rule: { type: 'path', path: `${CORE}/PaymentFlowFX` },
    title: 'Cross-border FX',
    blurb: 'PaymentFlowFX quotes rates and pays across currencies.',
  },
  {
    id: 'maintenance',
    kind: 'express',
    line: 'onboarding',
    label: 'Client maintenance',
    rule: { type: 'path', path: `${CORE}/ApprovedClientMaintenance` },
    title: 'Life after onboarding',
    blurb:
      'Approved clients can now review and update their details — onboarding becomes an ongoing relationship.',
  },
  {
    id: 'today',
    kind: 'express',
    line: null,
    label: 'Today',
    rule: { type: 'head' },
    title: 'Today',
    blurb:
      'Every station so far ships in the library you can install today. The dashed lines ahead come straight from the backlog.',
  },

  // ------------------------------------------------------------ planned (BACKLOG.md)
  // Drawn in this order; alternate lines so neighbouring labels have room.
  {
    id: 'a11y',
    kind: 'planned',
    line: 'core',
    label: 'WCAG 2.1 AA',
    rule: {
      type: 'planned',
      path: BACKLOG,
      match: '[BL-470]',
      open: ['📋 Planned', '🚧 In Progress'],
    },
    title: 'Accessible by default',
    blurb:
      'WCAG 2.1 AA across every component: axe tests, keyboard and focus management, correct ARIA.',
  },
  {
    id: 'entity-types',
    kind: 'planned',
    line: 'onboarding',
    label: 'More entity types',
    rule: {
      type: 'planned',
      path: BACKLOG,
      match: 'BL-400-1:',
      open: ['- [ ]'],
    },
    title: 'Government & non-profit entities',
    blurb:
      'After publicly traded companies, OnboardingFlow is set to support government and non-profit entities.',
  },
  {
    id: 'react-19',
    kind: 'planned',
    line: 'core',
    label: 'React 19',
    rule: {
      type: 'planned',
      path: BACKLOG,
      match: '[BL-440]',
      open: ['📋 Planned', '🚧 In Progress'],
    },
    title: 'React 19 readiness',
    blurb:
      'Verify peer compatibility, then adopt React 19 incrementally — tests and Storybook first, behind guardrails.',
  },
  {
    id: 'microdeposits',
    kind: 'planned',
    line: 'accounts',
    label: 'Microdeposit retries',
    rule: {
      type: 'planned',
      path: BACKLOG,
      match: 'BL-401-4:',
      open: ['- [ ]'],
    },
    title: 'Sturdier microdeposits',
    blurb:
      'Robust microdeposit verification, with clear retry and lockout messaging for linked accounts.',
  },
  {
    id: 'fees-eta',
    kind: 'planned',
    line: 'payments',
    label: 'Fees & ETA',
    rule: {
      type: 'planned',
      path: BACKLOG,
      match: 'BL-403-2:',
      open: ['- [ ]'],
    },
    title: 'Know the cost and the arrival',
    blurb:
      'PaymentFlow review is set to show fees and an expected arrival time before you send.',
  },
  {
    id: 'analytics',
    kind: 'planned',
    line: 'core',
    label: 'Event catalog',
    rule: {
      type: 'planned',
      path: BACKLOG,
      match: '[BL-450]',
      open: ['📋 Planned', '🚧 In Progress'],
    },
    title: 'Real-user analytics',
    blurb:
      'A standard event catalog for every component, building on the userEventsHandler hooks some widgets already expose.',
  },
  {
    id: 'guides',
    kind: 'planned',
    line: 'docs',
    label: 'Component guides',
    rule: {
      type: 'planned',
      path: BACKLOG,
      match: '[BL-490]',
      open: ['📋 Planned', '🚧 In Progress'],
    },
    title: 'A guide for every component',
    blurb:
      'Per-component docs on usage, validation, security, a11y and testing — plus richer AI agent skills and templates.',
  },
];
