export interface DemoApp {
  id: string;
  title: string;
  kind: 'Marketplace demo' | 'Interactive story' | 'Game';
  description: string;
  /** Path under `public/`. */
  image: string;
  features: readonly string[];
  link: '/sellsense-demo' | '/prosperity-bay' | '/fortress-game';
}

export const DEMO_APPS: readonly DemoApp[] = [
  {
    id: 'sellsense',
    title: 'SellSense Marketplace',
    kind: 'Marketplace demo',
    description:
      'A comprehensive marketplace platform showcasing embedded finance tools for sellers to manage payments, onboarding, and financial operations.',
    image: '/marketplace-dashboard.png',
    features: [
      'Client onboarding',
      'Payment processing',
      'Transaction management',
      'Account linking',
    ],
    link: '/sellsense-demo',
  },
  {
    id: 'prosperity-bay',
    title: 'Prosperity Bay',
    kind: 'Interactive story',
    description:
      'An animated story that explains Embedded Payments through a growing town where you are the mayor. Six chapters follow one business from onboarding to payouts, with links to the official guides.',
    image: '/demos/prosperity-bay.jpg',
    features: [
      'Client onboarding (KYC)',
      'Accounts and checkout',
      'ACH, RTP, and wire payouts',
      'Webhooks and reporting',
    ],
    link: '/prosperity-bay',
  },
  {
    id: 'fintech-fortress',
    title: 'Fintech Fortress',
    kind: 'Game',
    description:
      'A practice game about payment APIs and security. Fix API requests, spot the threat, and choose how to respond. No coding or payments experience required.',
    image: '/demos/fintech-fortress.jpg',
    features: [
      'Build and send API requests',
      'Fraud and security scenarios',
      'Hints, API help, and feedback',
      'Leaderboard',
    ],
    link: '/fortress-game',
  },
];
