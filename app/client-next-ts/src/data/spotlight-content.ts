/**
 * Client stories and thought leadership for `/spotlight`.
 * Dates, URLs, and descriptions were checked against the public pages on 2026-10-28.
 */
export type SpotlightKind = 'client-story' | 'thought-leadership';

export interface SpotlightItem {
  id: string;
  kind: SpotlightKind;
  /** Article headline. */
  title: string;
  /** Client or author organization. */
  org: string;
  /** Short text for the monogram tile (no third-party logos). */
  monogram: string;
  publisher: string;
  /** Publication date, `YYYY-MM-DD`. */
  date: string;
  description: string;
  url: string;
}

export const SPOTLIGHT_ITEMS: readonly SpotlightItem[] = [
  {
    id: 'mercado-libre',
    kind: 'client-story',
    title:
      "J.P. Morgan Payments Powers Mercado Libre's Global Selling Expansion",
    org: 'Mercado Libre',
    monogram: 'ML',
    publisher: 'J.P. Morgan Payments Newsroom',
    date: '2026-10-15',
    description:
      "Our embedded payments solutions are supporting Mercado Libre's Global Selling program by streamlining cross-border payments and accelerating onboarding to our financial services for U.S. marketplace sellers.",
    url: 'https://www.jpmorgan.com/payments/newsroom/mercado-libre-global-selling-embedded-payments',
  },
  {
    id: 'ai-fraud-prevention',
    kind: 'thought-leadership',
    title: 'How embedded finance is evolving to combat AI-enhanced fraud',
    org: 'J.P. Morgan Payments',
    monogram: 'JPM',
    publisher: 'J.P. Morgan Insights',
    date: '2026-09-30',
    description:
      "As real-time payments and AI accelerate the movement of money, the winners won't be the platforms that move fastest, but the ones that move fast with security.",
    url: 'https://www.jpmorgan.com/insights/payments/embedded-finance-baas/embedded-finance-ai-fraud-prevention',
  },
  {
    id: 'dream-payments',
    kind: 'client-story',
    title:
      "Dream Payments Launches Dream Payouts, the Payment Network for America's 36 Million Small Businesses",
    org: 'Dream Payments',
    monogram: 'DP',
    publisher: 'Dream Payments',
    date: '2026-08-11',
    description:
      'Dream and J.P. Morgan Payments have collaborated to deliver programmable business payments that let companies pay people, partners and suppliers, with eligible payments delivered in real time.',
    url: 'https://www.dreampayments.com/post/dream-payments-launches-dream-payouts',
  },
  {
    id: 'bill',
    kind: 'client-story',
    title: 'BILL Transforms SMB Payments With Embedded Finance',
    org: 'BILL',
    monogram: 'B',
    publisher: 'J.P. Morgan Insights',
    date: '2026-05-20',
    description:
      'Learn how BILL helps businesses manage payments in real time with an API-based sub-ledgering solution.',
    url: 'https://www.jpmorgan.com/insights/payments/embedded-finance-baas/bill-embedded-payments-api-sub-ledger',
  },
  {
    id: 'saas-growth-ai',
    kind: 'thought-leadership',
    title: 'How embedded payments can unlock SaaS growth in the AI era',
    org: 'J.P. Morgan Payments',
    monogram: 'JPM',
    publisher: 'J.P. Morgan Insights',
    date: '2026-04-30',
    description:
      'Embedding payments does more than help your clients transact. It creates a competitive edge by making your software platform indispensable and unlocking new revenue opportunities.',
    url: 'https://www.jpmorgan.com/insights/payments/embedded-finance-baas/embedded-payments-saas-growth-ai',
  },
  {
    id: 'walmart-marketplace',
    kind: 'client-story',
    title: 'Embedded Finance for Walmart Marketplace Sellers',
    org: 'Walmart Marketplace',
    monogram: 'W',
    publisher: 'J.P. Morgan Payments Newsroom',
    date: '2025-03-26',
    description:
      "For the first time, we've unveiled our embedded finance solution for Walmart Marketplace, one of the fastest-growing e-commerce platforms in the world, at Shoptalk 2025 in Las Vegas.",
    url: 'https://www.jpmorgan.com/payments/newsroom/embedded-finance-walmart-marketplace-sellers',
  },
];

export interface SpotlightSections {
  latest: SpotlightItem | undefined;
  clientStories: SpotlightItem[];
  thoughtLeadership: SpotlightItem[];
}

/** Newest item becomes the featured card; the rest are grouped by kind, newest first. */
export function getSpotlightSections(
  items: readonly SpotlightItem[] = SPOTLIGHT_ITEMS
): SpotlightSections {
  const [latest, ...rest] = [...items].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  return {
    latest,
    clientStories: rest.filter((item) => item.kind === 'client-story'),
    thoughtLeadership: rest.filter(
      (item) => item.kind === 'thought-leadership'
    ),
  };
}
