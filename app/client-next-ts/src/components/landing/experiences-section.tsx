import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Users, Link, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ExperiencesSection() {
  const experiences = [
    {
      id: 'onboarding',
      title: 'Client Onboarding',
      description:
        'Complete KYC/KYB process with document collection and verification',
      icon: <Users className="h-5 w-5" />,
      status: 'live',
      steps: [
        'Collect business details',
        'Verify identity',
        'Upload documents',
        'Review and approve',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/DIGITAL_ONBOARDING_FLOW_RECIPE.md',
    },
    {
      id: 'link-account',
      title: 'Link Bank Account',
      description:
        'Securely connect external bank accounts for payments and transfers',
      icon: <Link className="h-5 w-5" />,
      status: 'live',
      steps: [
        'Select bank',
        'Authenticate',
        'Verify account',
        'Confirm connection',
      ],
      recipeUrl:
        'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/LINKED_ACCOUNTS_RECIPE.md',
    },
    {
      id: 'transactions',
      title: 'Transaction History',
      description:
        'View, filter, and manage transaction records with detailed insights',
      icon: <List className="h-5 w-5" />,
      status: 'coming soon',
      steps: [
        'Fetch transactions',
        'Apply filters',
        'Display results',
        'Export data',
      ],
    },
  ];

  return (
    <section className="py-12 bg-jpm-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-page-h2 text-jpm-gray-900 mb-4 text-center">
            Explore Embedded Experiences and Recipes
          </h2>
          <p className="text-page-body text-jpm-gray text-center mb-12 max-w-3xl mx-auto">
            Pre-built workflows and implementation patterns for common embedded
            finance use cases.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {experiences.map((exp) => (
              <Card
                key={exp.id}
                className="overflow-hidden border-0 shadow-page-card bg-jpm-white rounded-page-lg"
              >
                <CardHeader className="bg-jpm-brown-100 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="flex items-center text-page-h4">
                      <div className="bg-jpm-brown-100 p-1.5 rounded-page-md mr-3 text-jpm-brown">
                        {exp.icon}
                      </div>
                      {exp.title}
                    </CardTitle>
                    <span
                      className={`px-2 py-1 text-page-small font-medium rounded-page-sm ${
                        exp.status === 'live'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {exp.status === 'live' ? 'Live' : 'Coming Soon'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-8">
                  <p className="text-page-body text-jpm-gray leading-relaxed mb-6">
                    {exp.description}
                  </p>

                  <div className="mb-6">
                    <h4 className="text-page-small font-semibold mb-3 text-jpm-gray-900">
                      Implementation Steps:
                    </h4>
                    <ol className="text-page-small text-jpm-gray space-y-2 list-decimal pl-5">
                      {exp.steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  </div>

                  {exp.recipeUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-jpm-brown text-jpm-brown hover:bg-jpm-brown-100 rounded-page-md font-semibold"
                      onClick={() => window.open(exp.recipeUrl, '_blank')}
                    >
                      View Recipe
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
