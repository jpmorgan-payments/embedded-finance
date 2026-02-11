import { ExternalLink, Play } from 'lucide-react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/demos')({
  component: DemosPage,
});

const demos = [
  {
    id: 'sellsense',
    title: 'Sellsense Marketplace',
    description:
      'A comprehensive marketplace platform showcasing embedded finance tools for sellers to manage payments, onboarding, and financial operations.',
    image: '/marketplace-dashboard.png',
    status: 'active',
    features: [
      'Client onboarding',
      'Payment processing',
      'Transaction management',
      'Account linking',
    ],
    link: '/sellsense-demo',
  },
  {
    id: 'commerce',
    title: 'Create Commerce',
    description:
      'An e-commerce platform demonstrating integrated payment processing and financial management capabilities.',
    image: '/ecommerce-platform-concept.png',
    status: 'coming-soon',
    features: [
      'Shopping cart',
      'Payment gateway',
      'Order management',
      'Financial analytics',
    ],
    link: '#',
  },
  {
    id: 'platform',
    title: 'Demo Platform',
    description:
      'A comprehensive platform showcasing all embedded finance capabilities in a unified interface.',
    image: '/modern-finance-platform.png',
    status: 'coming-soon',
    features: [
      'All components',
      'API examples',
      'Integration guides',
      'Best practices',
    ],
    link: '#',
  },
];

function DemosPage() {
  return (
    <div className="min-h-screen bg-sp-bg py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-page-h2 font-bold text-jpm-gray-900">
            Interactive Demo Applications
          </h1>
          <p className="mx-auto max-w-3xl text-page-body leading-relaxed text-jpm-gray">
            Explore live demonstrations of embedded finance solutions in action.
            Each demo showcases different use cases and implementation patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
          {demos.map((demo) => (
            <Card
              key={demo.id}
              className="overflow-hidden rounded-page-md border-0 bg-jpm-white shadow-page-card"
            >
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={demo.image}
                  alt={demo.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-page-h4 text-jpm-gray-900">
                    {demo.title}
                  </CardTitle>
                  <span
                    className={`rounded-page-sm px-2 py-1 text-page-small font-medium ${
                      demo.status === 'active'
                        ? 'border border-sp-border bg-sp-accent text-sp-brand'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {demo.status === 'active' ? 'Live' : 'Coming Soon'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="mb-6 text-page-body leading-relaxed text-jpm-gray">
                  {demo.description}
                </p>

                <div className="mb-6">
                  <h4 className="mb-3 text-page-small font-semibold text-jpm-gray-900">
                    Features Demonstrated:
                  </h4>
                  <ul className="space-y-2 text-page-small text-jpm-gray">
                    {demo.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="mr-3 h-1.5 w-1.5 rounded-full bg-jpm-brown"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  asChild={demo.status === 'active'}
                  variant={demo.status === 'active' ? 'default' : 'outline'}
                  className={`w-full rounded-page-md font-semibold ${
                    demo.status === 'active'
                      ? 'border-0 bg-sp-brand text-white shadow-page-card hover:bg-sp-brand-700'
                      : 'cursor-not-allowed border-jpm-gray-300 text-jpm-gray opacity-50'
                  }`}
                  disabled={demo.status !== 'active'}
                >
                  {demo.status === 'active' ? (
                    <Link to={demo.link} className="flex items-center">
                      <Play className="mr-2 h-4 w-4" />
                      LAUNCH DEMO
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  ) : (
                    <span>COMING SOON</span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
