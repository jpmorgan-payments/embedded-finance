/**
 * Engineering Recipes (`/stories`) catalog. The list page, the detail page header,
 * and route param validation all read from here.
 *
 * Keep entries sorted newest first by `date`. Set `updated` only for a substantive
 * change to the source doc well after publication, not for small touch-ups.
 */
export interface StoryCatalogEntry {
  id: string;
  title: string;
  excerpt: string;
  /** First published, `YYYY-MM-DD`. */
  date: string;
  /** Last substantive update to the source doc, `YYYY-MM-DD`. */
  updated?: string;
  readTime: string;
  tags: readonly string[];
  /** Related interactive experience, shown as a secondary link on the card. */
  interactiveLink?: { to: string; label: string };
}

const STORY_ENTRIES = [
  {
    id: 'ux-atlas',
    title: 'UX Atlas: Build Your Own Onboarding and Linked Account UX',
    excerpt:
      'One index of the Developer Portal guides, recipes, and live examples for each step of onboarding and linking a bank account. Profile your platform, walk the journey, and find the right resource. Source: UX_ATLAS.md.',
    date: '2026-10-14',
    readTime: '14 min read',
    tags: ['Onboarding', 'Linked Accounts', 'Interactive'],
    interactiveLink: { to: '/ux-atlas', label: 'Open interactive atlas' },
  },
  {
    id: 'publicly-traded-companies-recipe',
    title: 'Publicly Traded Companies UI Recipe (DRAFT)',
    excerpt:
      'Build onboarding for a US publicly traded company or one of its subsidiaries: collect the classification and listing details, adapt the remaining onboarding work, and handle verification. Source: PUBLICLY_TRADED_COMPANIES_RECIPE.md.',
    date: '2026-10-05',
    readTime: '10 min read',
    tags: ['DRAFT', 'Onboarding', 'PTC'],
  },
  {
    id: 'approved-client-maintenance-recipe',
    title: 'Approved Client Maintenance Recipe (DRAFT)',
    excerpt:
      'After approval, let a client add a product and keep its business and related parties current: endpoints, lifecycle, outstanding requirements, review, and attestation on the Digital Onboarding API. Source: APPROVED_CLIENT_MAINTENANCE_RECIPE.md.',
    date: '2026-08-31',
    updated: '2026-10-22',
    readTime: '40 min read',
    tags: ['DRAFT', 'Client Maintenance', 'KYC'],
  },
  {
    id: 'cross-border-fx-payout-client-recipe',
    title: 'Cross-border FX payout — Client UX wiring (DRAFT)',
    excerpt:
      'WIP companion to the PDP cross-border FX payout how-to: how Recipients + PaymentFlowFX wire UX to APIs across currencies. Source: CROSS_BORDER_FX_PAYOUT_CLIENT_RECIPE.md.',
    date: '2026-07-20',
    readTime: '15 min read',
    tags: ['DRAFT', 'FX', 'Payouts', 'UX'],
  },
  {
    id: 'core-functional-requirements-index',
    title: 'Core functional requirements — cross-reference',
    excerpt:
      'Single index of GitHub links to every functional requirements markdown file under embedded-components/src/core for each active core component.',
    date: '2026-04-15',
    readTime: '5 min read',
    tags: ['Documentation', 'Requirements', 'Core'],
  },
  {
    id: 'list-transactions-recipe',
    title: 'List Transactions API Integration Recipe',
    excerpt:
      'Integrate the List Transactions API in a React app: filter parameters, client-side pagination strategies, sorting, detail views, and error handling for common transaction-history use cases. Source: LIST_TRANSACTIONS_RECIPE.md.',
    date: '2026-04-07',
    readTime: '11 min read',
    tags: ['Transactions', 'API', 'Pagination'],
  },
  {
    id: 'partially-hosted-onboarding',
    title: 'Partially Hosted UI Integration Guide',
    excerpt:
      'Integrate the hosted Onboarding UI into your platform with session transfer, iframe embedding, postMessage, and security guidance. Source: PARTIALLY_HOSTED_UI_INTEGRATION_GUIDE.md.',
    date: '2026-03-12',
    updated: '2026-10-27',
    readTime: '25 min read',
    tags: ['Onboarding', 'Hosted UI', 'Integration'],
  },
  {
    id: 'webhook-integration-recipe',
    title: 'Webhook Integration Recipe: UX Guidance',
    excerpt:
      'Suggested UI/UX principles for webhook integration: event types, client-facing vs partner-platform surfaces, onboarding and operations patterns, and reconciliation. Source: WEBHOOK_INTEGRATION_RECIPE.md.',
    date: '2026-01-08',
    updated: '2026-04-04',
    readTime: '12 min read',
    tags: ['Webhooks', 'Integration', 'UX'],
  },
  {
    id: 'important-date-selector-component',
    title: 'Important Date Selector Component Recipe',
    excerpt:
      'Design guidelines for ImportantDateSelector: problem analysis, accessibility, validation, and implementation notes for embedded finance. Source: IMPORTANT_DATE_SELECTOR_RECIPE.md.',
    date: '2025-06-12',
    readTime: '10 min read',
    tags: ['Components', 'Accessibility', 'Dates'],
  },
  {
    id: 'date-selector-challenges',
    title: 'JavaScript/TypeScript Date Parsing Guide',
    excerpt:
      'Common date parsing pitfalls in JS/TS (timezones, ambiguous strings, DST) and reliable patterns for Embedded Finance components. Source: DATE_PARSING_GUIDE.md.',
    date: '2025-04-28',
    readTime: '6 min read',
    tags: ['TypeScript', 'Dates', 'Parsing'],
  },
  {
    id: 'digital-onboarding-recipe',
    title: 'Digital Onboarding UI/UX Recipe (DRAFT)',
    excerpt:
      'Build a stepper wizard on the Digital Onboarding API: business and individual details, owners and decision makers, due diligence questions, review and attestation, and verification. Source: DIGITAL_ONBOARDING_RECIPE.md.',
    date: '2024-07-31',
    updated: '2026-10-22',
    readTime: '17 min read',
    tags: ['DRAFT', 'Onboarding', 'UX'],
  },
] as const satisfies readonly StoryCatalogEntry[];

export type StoryId = (typeof STORY_ENTRIES)[number]['id'];

export type Story = StoryCatalogEntry & { id: StoryId };

export const STORIES: readonly Story[] = STORY_ENTRIES;

export const STORY_IDS = STORY_ENTRIES.map((story) => story.id) as [
  StoryId,
  ...StoryId[],
];

export function getStory(id: StoryId): Story | undefined {
  return STORIES.find((story) => story.id === id);
}
