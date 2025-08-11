import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import { Play, ExternalLink } from 'lucide-react';

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
    <div className="min-h-screen py-16 bg-sp-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-page-h2 font-bold text-jpm-gray-900 mb-6">
            Interactive Demo Applications
          </h1>
          <p className="text-page-body text-jpm-gray max-w-3xl mx-auto leading-relaxed">
            Explore live demonstrations of embedded finance solutions in action.
            Each demo showcases different use cases and implementation patterns.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {demos.map((demo) => (
            <Card
              key={demo.id}
              className="border-0 shadow-page-card bg-jpm-white rounded-page-lg overflow-hidden"
            >
              <div className="aspect-video w-full overflow-hidden">
                <img
                  src={demo.image}
                  alt={demo.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-page-h4 text-jpm-gray-900">
                    {demo.title}
                  </CardTitle>
                  <span
                    className={`px-2 py-1 text-page-small font-medium rounded-page-sm ${
                      demo.status === 'active'
                        ? 'bg-sp-accent text-sp-brand border border-sp-border'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {demo.status === 'active' ? 'Live' : 'Coming Soon'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-page-body text-jpm-gray leading-relaxed mb-6">
                  {demo.description}
                </p>

                <div className="mb-6">
                  <h4 className="text-page-small font-semibold mb-3 text-jpm-gray-900">
                    Features Demonstrated:
                  </h4>
                  <ul className="text-page-small text-jpm-gray space-y-2">
                    {demo.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1.5 h-1.5 bg-jpm-brown rounded-full mr-3"></div>
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
                      ? 'bg-sp-brand hover:bg-sp-brand-700 text-white shadow-page-card border-0'
                      : 'border-jpm-gray-300 text-jpm-gray opacity-50 cursor-not-allowed'
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
