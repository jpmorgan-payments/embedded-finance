import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export const Route = createFileRoute('/solutions')({
  component: SolutionsPage,
});

function SolutionsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const implementationApproaches = [
    {
      title: 'Fully Hosted UI Solutions',
      group: 'hosted',
      description:
        'Turnkey options that handle infrastructure, security, and user interface, allowing consumers to integrate complete, production-ready components with minimal effort.',
      benefit: 'Dramatically reduced implementation time and risk.',
    },
    {
      title: 'Runtime UI Injection',
      group: 'dropin',
      description:
        'More flexible options including iframes for easy embedding, server-side composition for seamless integration, and client-side composition (e.g., module federation) for dynamic, performant experiences.',
      benefit: 'Balance between ease of implementation and customization.',
    },
    {
      title: 'Embedded UI Components',
      group: 'build',
      description:
        'UI components published as npm packages that allow for build-time integration. This approach offers deep customization while still providing pre-built, tested components.',
      benefit: 'Customizable UI with reduced development overhead.',
    },
    {
      title: 'UI/UX Cookbooks',
      group: 'build',
      description:
        'Detailed, human-readable guidelines for implementing web applications including flow diagrams, sequence diagrams, best practices and code samples.',
      benefit:
        'Clear roadmap for custom implementations, reducing design and architecture time.',
    },
    {
      title: 'Machine-Readable Specifications',
      group: 'build',
      description:
        'Specifications like Arazzo provide a structured way to describe complex workflows and their underlying APIs. These machine-readable formats enable automated code generation for basic implementations, integration with LLMs to quickly produce skeleton/draft versions of digital experiences, and framework-agnostic approach for any UI library or custom instruction set.',
      benefit: 'Rapid prototyping and reduced boilerplate coding.',
    },
  ];

  // Column configuration and ordering
  const groupsOrder = ['build', 'dropin', 'hosted'] as const;
  type GroupKey = (typeof groupsOrder)[number];
  const groupMeta: Record<
    GroupKey,
    {
      id: string;
      summaryTitle: string;
      summarySubtitle: string;
      imageUrl: string;
    }
  > = {
    build: {
      id: 'build-it-yourself',
      summaryTitle: 'Build It Yourself',
      summarySubtitle:
        'Fully customizable solutions that give you complete control over the user experience.',
      imageUrl:
        'https://developer.payments.jpmorgan.com/api/download/en/docs/commerce/online-payments/overview-cfs/direct-api-Integration.png?type=image',
    },
    dropin: {
      id: 'drop-in-ui',
      summaryTitle: 'Drop-in UI',
      summarySubtitle:
        'Ready-made UI components that can be easily integrated into your existing applications.',
      imageUrl:
        'https://developer.payments.jpmorgan.com/api/download/en/docs/commerce/online-payments/overview-cfs/drop-in-checkout.png?type=image',
    },
    hosted: {
      id: 'jpm-hosted',
      summaryTitle: 'JPM Hosted',
      summarySubtitle:
        'Complete turnkey solutions hosted and maintained by JPMorgan Chase.',
      imageUrl:
        'https://developer.payments.jpmorgan.com/api/download/en/docs/commerce/online-payments/overview-cfs/checkout-hosted-pay-page.png?type=image',
    },
  };

  return (
    <div className="min-h-screen py-16 bg-white">
      <div className="grid grid-cols-5 gap-4">
        {/* Mobile Menu Button - improved position */}
        <button
          className="lg:hidden fixed top-24 left-6 z-50 p-2 rounded-md bg-jpm-white shadow-md"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-jpm-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Main Content Area */}
        <div className="col-span-5 lg:col-span-5">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div id="overview" className="text-center mb-16">
              <p className="text-sm font-semibold text-sp-ink mb-2">
                IMPLEMENTATION OPTIONS
              </p>
              <h1 className="text-page-h1 font-bold text-sp-ink mb-8">
                Developer Solutions for Every Integration Need
              </h1>
              <div className="bg-sp-topaz-600 py-4 px-4 rounded-t-page-md">
                <div className="text-page-subtitle font-bold text-white">
                  Choose Your Integration Approach
                </div>
              </div>
              {/* Bulleted summary of options */}
              <div className="bg-sp-bullets-bg px-6 py-5">
                <ul className="mx-auto max-w-5xl grid grid-cols-1 gap-y-3 gap-x-10 text-sp-ink md:grid-cols-2">
                  <li className="flex items-start gap-3 text-page-h3">
                    <span className="mt-2.5 h-2.5 w-2.5 rounded-full bg-sp-brand" />
                    <span>Fully hosted UI solutions</span>
                  </li>
                  <li className="flex items-start gap-3 text-page-h3">
                    <span className="mt-2.5 h-2.5 w-2.5 rounded-full bg-sp-brand" />
                    <span>Drop-in UI (runtime injection)</span>
                  </li>
                  <li className="flex items-start gap-3 text-page-h3">
                    <span className="mt-2.5 h-2.5 w-2.5 rounded-full bg-sp-brand" />
                    <span>Embedded UI components</span>
                  </li>
                  <li className="flex items-start gap-3 text-page-h3">
                    <span className="mt-2.5 h-2.5 w-2.5 rounded-full bg-sp-brand" />
                    <span>UI/UX cookbooks</span>
                  </li>
                  <li className="flex items-start gap-3 text-page-h3">
                    <span className="mt-2.5 h-2.5 w-2.5 rounded-full bg-sp-brand" />
                    <span>Machine-readable specifications</span>
                  </li>
                </ul>
              </div>
            </div>

            <div id="integration-options" className="mb-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                {groupsOrder.map((groupKey) => {
                  const meta = groupMeta[groupKey];
                  const items = implementationApproaches.filter(
                    (a) => a.group === groupKey,
                  );
                  return (
                    <div
                      key={meta.id}
                      id={meta.id}
                      className="flex flex-col space-y-6"
                    >
                      {/* Summary Block with Visualization */}
                      <div className="bg-white rounded-page-md shadow-page-card border-0 hover:shadow-lg transition-all h-[220px] flex flex-col">
                        <div className="bg-sp-accent rounded-t-page-md h-36 overflow-hidden border-b border-sp-border">
                          <div
                            className="h-full w-full"
                            style={{
                              backgroundImage: `url("${meta.imageUrl}")`,
                              backgroundSize: '250%',
                              backgroundPosition: 'center 25%',
                              backgroundRepeat: 'no-repeat',
                            }}
                          ></div>
                        </div>
                        <div className="p-4 flex flex-col flex-1 justify-center">
                          <h2 className="text-page-body font-semibold text-sp-ink mb-2 text-center font-heading">
                            {meta.summaryTitle}
                          </h2>
                          <p className="text-sp-ink/80 text-center text-sm font-body">
                            {meta.summarySubtitle}
                          </p>
                        </div>
                      </div>
                      {items.map((approach, index) => (
                        <Card
                          key={index}
                          className="border border-sp-border shadow-page-card bg-jpm-white !rounded-[0.375rem] overflow-hidden"
                        >
                          <CardHeader className="bg-sp-accent">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-page-body text-sp-ink">
                                <span className="font-heading">
                                  {approach.title}
                                </span>
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6 font-body">
                            <p className="text-sm text-sp-ink leading-relaxed mb-4">
                              {approach.description}
                            </p>
                            <div className="bg-sp-benefit p-4 rounded-page-sm border border-sp-border">
                              <p className="text-sm font-semibold text-sp-ink">
                                Key Benefit: {approach.benefit}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
