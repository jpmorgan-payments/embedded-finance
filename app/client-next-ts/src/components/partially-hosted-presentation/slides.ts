import type { ChapterMeta, SlideMeta } from './deck-state';

export const GUIDE_URL =
  'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UI_INTEGRATION_GUIDE.md';
export const UTILITY_GUIDE_URL =
  'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UTILITY_GUIDE.md';
export const URL_SIZE_GUIDE_URL =
  'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/URL_SIZE_AND_COMPACT_CONFIG.md';
export const SESSION_TRANSFER_SAMPLE_URL =
  'https://github.com/jpmorgan-payments/embedded-finance/tree/main/app/server-session-transfer';
export const ONBOARD_CLIENT_DOCS_URL =
  'https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client';
export const LIVE_ONBOARDING_DEMO_PATH =
  '/sellsense-demo?fullscreen=true&component=onboarding&theme=Empty&view=onboarding';

export const CHAPTERS: readonly ChapterMeta[] = [
  { id: 'why', label: 'Why partially hosted' },
  { id: 'journey', label: 'Integration journey' },
  { id: 'experiences', label: 'Hosted experiences' },
  { id: 'utility', label: 'Utility library' },
  { id: 'customize', label: 'Make it yours' },
  { id: 'ship', label: 'Ship it' },
];

export const SLIDES: readonly SlideMeta[] = [
  {
    id: 'welcome',
    chapter: 'why',
    title: 'Partially Hosted UI',
    builds: 0,
    notes:
      'This deck mirrors the current Partially Hosted UI Integration Guide. Arrow keys or a clicker step through every build; G opens the overview, N the speaker notes.',
  },
  {
    id: 'split',
    chapter: 'why',
    title: 'Hosted by J.P. Morgan, framed by your platform',
    builds: 3,
    notes:
      'Your platform keeps the shell, navigation and the entry point, and owns who gets in: user identity and access management, with MFA. J.P. Morgan hosts the regulated UI inside an iframe and keeps it current, so KYC rules, document requests and API changes ship without a platform release.',
  },
  {
    id: 'options',
    chapter: 'why',
    title: 'Four ways to integrate',
    builds: 4,
    notes:
      'Walk left to right: more control on the left, faster time to market on the right. Partially hosted is the middle path: your brand and your page, our UI and our compliance updates.',
  },
  {
    id: 'prerequisites',
    chapter: 'journey',
    title: 'Before the first session',
    builds: 2,
    notes:
      'A Client ID must exist before a session can start, created through POST /clients (batch CSV creation is not supported); sessions target the client, not an individual party. The status check is optional but lets you flag INFORMATION_REQUESTED clients before they open the UI.',
  },
  {
    id: 'sequence',
    chapter: 'journey',
    title: 'The session-transfer journey',
    builds: 8,
    notes:
      'Nine hops. The key security property: the session token is short-lived (about 60 seconds) and travels inside the URL; the long-lived token that calls banking APIs is created inside the iframe and is never exposed to your frontend.',
    dwellMs: 5000,
  },
  {
    id: 'session-api',
    chapter: 'journey',
    title: 'Your backend: POST /sessions',
    builds: 3,
    notes:
      'This is the one endpoint the platform must build. Only users who signed in through your IAM with MFA, and are authorized for the client, may call it. Then call J.P. Morgan server-to-server with target type CLIENT, retry transient failures, and hand only the URL back to the browser.',
  },
  {
    id: 'iframe',
    chapter: 'journey',
    title: 'Your frontend: mount the iframe',
    builds: 3,
    notes:
      'Use the URL exactly as returned. Everything else is good iframe hygiene: least-privilege sandbox, no referrer, an accessible title, loading and error states, and container-driven sizing.',
  },
  {
    id: 'experiences',
    chapter: 'experiences',
    title: 'Three hosted experiences',
    builds: 2,
    notes:
      'One integration, three experiences selected by hostedExperienceType. Without a value you get document upload, the most common re-entry point.',
  },
  {
    id: 'component-properties',
    chapter: 'experiences',
    title: 'Tune each experience with componentProperties',
    builds: 2,
    notes:
      'Only JSON-serialisable props travel through the URL. Validation is strict: one unknown key or bad value rejects the whole object and the experience falls back to defaults.',
  },
  {
    id: 'utility',
    chapter: 'utility',
    title: 'The PartiallyHostedUIComponent utility',
    builds: 4,
    notes:
      'A zero-dependency reference implementation (ES module and UMD) that wraps everything on the previous slides: URL building, the gateway length check, sandboxed iframe, origin-checked events and runtime updates. It is work in progress; adapt and test before production.',
  },
  {
    id: 'playground',
    chapter: 'customize',
    title: 'Showcase themes, straight into the utility',
    builds: 0,
    notes:
      'These are the same theme presets the showcase site uses for its SellSense demo. Pick one: the preview restyles, the utility config regenerates, and the request-URI budget is measured live, including a real compressed cfg value.',
    dwellMs: 16000,
  },
  {
    id: 'url-budget',
    chapter: 'customize',
    title: 'The 2,047-character budget',
    builds: 3,
    notes:
      'The gateway rejects any path plus query over 2,047 characters with a 403 before the request reaches the application, so there is no app log and no postMessage. Every parameter works alone; only the combination fails. The compact cfg parameter fixes it.',
  },
  {
    id: 'security',
    chapter: 'ship',
    title: 'Security, from sign-in to the iframe',
    builds: 3,
    notes:
      'It starts with your IAM: every user who can open the hosted UI signs in with MFA and is authorized for the client. The platform never handles the long-lived banking token, and status changes are re-verified server-to-server, not trusted from the browser.',
  },
  {
    id: 'results',
    chapter: 'ship',
    title: 'Handling results and re-entry',
    builds: 2,
    notes:
      'postMessage is for real-time UI; webhooks are the definitive answer. Store status, IDs and timestamps, and send returning users back to where they left off.',
  },
  {
    id: 'responsibilities',
    chapter: 'ship',
    title: 'Who owns what',
    builds: 2,
    notes:
      'Identity and access management, including MFA, is always the platform’s. Beyond that, a clean split: two small surfaces on the platform side, and the regulated UI and its APIs on the J.P. Morgan side.',
  },
  {
    id: 'next-steps',
    chapter: 'ship',
    title: 'Go deeper',
    builds: 0,
    notes:
      'Everything here is open source. The interactive guide has full code for every step; the session-transfer sample runs end to end.',
  },
];
