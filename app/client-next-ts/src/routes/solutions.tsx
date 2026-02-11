import { useEffect, useState } from 'react';

import { createFileRoute } from '@tanstack/react-router';

import ElectricBorder from '@/components/custom/ElectricBorder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/solutions')({
  component: SolutionsPage,
});

function SolutionsPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isShiftFPressed, setIsShiftFPressed] = useState(false);

  // Handle Shift+F key combination
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'F') {
        setIsShiftFPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === 'F') {
        setIsShiftFPressed(false);
      }
    };

    // Also handle when Shift is released
    const handleKeyUpShift = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftFPressed(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keyup', handleKeyUpShift);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keyup', handleKeyUpShift);
    };
  }, []);

  // Column-specific border colors
  const getBorderColor = (groupKey: string) => {
    switch (groupKey) {
      case 'build':
        return '#ff6b6b'; // Vibrant red for Build column
      case 'dropin':
        return '#4ecdc4'; // Bright teal for Drop-in column
      case 'hosted':
        return '#45b7d1'; // Electric blue for Hosted column
      default:
        return '#7df9ff'; // Fallback cyan
    }
  };

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
    <div className="min-h-screen bg-white py-16">
      <div className="grid grid-cols-5 gap-4">
        {/* Mobile Menu Button - improved position */}
        <button
          className="fixed left-6 top-24 z-50 rounded-md bg-jpm-white p-2 shadow-md lg:hidden"
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
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div id="overview" className="mb-16 text-center">
              <p className="mb-2 text-sm font-semibold text-sp-ink">
                IMPLEMENTATION OPTIONS
              </p>
              <h1 className="mb-8 text-page-h1 font-bold text-sp-ink">
                Developer Solutions for Every Integration Need
              </h1>
              <div className="rounded-t-page-md bg-sp-topaz-600 px-4 py-4">
                <div className="text-page-subtitle font-bold text-white">
                  Choose Your Integration Approach
                </div>
              </div>
              {/* Bulleted summary of options */}
              <div className="bg-sp-bullets-bg px-6 py-5">
                <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-x-10 gap-y-3 text-sp-ink md:grid-cols-2">
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
              <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
                {groupsOrder.map((groupKey) => {
                  const meta = groupMeta[groupKey];
                  const items = implementationApproaches.filter(
                    (a) => a.group === groupKey
                  );
                  const borderColor = getBorderColor(groupKey);

                  return (
                    <div
                      key={meta.id}
                      id={meta.id}
                      className="flex flex-col space-y-6"
                    >
                      {/* Summary Block with Visualization */}
                      <div className="relative">
                        <div className="relative flex h-[220px] flex-col rounded-page-md border-0 bg-white shadow-page-card transition-all hover:shadow-lg">
                          <div className="h-36 overflow-hidden rounded-t-page-md border-b border-sp-border bg-sp-accent">
                            <div
                              className="h-full w-full"
                              style={{
                                backgroundImage: `url("${meta.imageUrl}")`,
                                backgroundSize: '250%',
                                backgroundPosition: 'center 25%',
                                backgroundRepeat: 'no-repeat',
                              }}
                            ></div>
                            {/* COMING SOON tag for JPM Hosted */}
                            {groupKey === 'hosted' && (
                              <div className="absolute right-3 top-3">
                                <span className="inline-flex items-center rounded-full bg-gray-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                                  Coming Soon
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-1 flex-col justify-center p-4">
                            <h2 className="mb-2 text-center font-heading text-page-body font-semibold text-sp-ink">
                              {meta.summaryTitle}
                            </h2>
                            <p className="text-center font-body text-sm text-sp-ink/80">
                              {meta.summarySubtitle}
                            </p>
                          </div>
                        </div>

                        {/* ElectricBorder overlay - only visible when Shift+F is pressed */}
                        {isShiftFPressed && (
                          <div className="pointer-events-none absolute inset-0 z-10">
                            <ElectricBorder
                              color={borderColor}
                              speed={1.2}
                              chaos={0.6}
                              thickness={3}
                              style={{ borderRadius: 16 }}
                              className="h-full w-full"
                            />
                          </div>
                        )}
                      </div>

                      {items.map((approach, index) => (
                        <div key={index} className="relative">
                          <Card className="overflow-hidden !rounded-[0.375rem] border border-sp-border bg-jpm-white shadow-page-card">
                            <CardHeader className="bg-sp-accent">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-page-body text-sp-ink">
                                  <span className="font-heading">
                                    {approach.title}
                                  </span>
                                </CardTitle>
                              </div>
                            </CardHeader>
                            <CardContent className="p-6 font-body">
                              <p className="mb-4 text-sm leading-relaxed text-sp-ink">
                                {approach.description}
                              </p>
                              <div className="rounded-page-sm border border-sp-border bg-sp-benefit p-4">
                                <p className="text-sm font-semibold text-sp-ink">
                                  Key Benefit: {approach.benefit}
                                </p>
                              </div>
                            </CardContent>
                          </Card>

                          {/* ElectricBorder overlay - only visible when Shift+F is pressed */}
                          {isShiftFPressed && (
                            <div className="pointer-events-none absolute inset-0 z-10">
                              <ElectricBorder
                                color={borderColor}
                                speed={1.2}
                                chaos={0.6}
                                thickness={3}
                                style={{ borderRadius: 16 }}
                                className="h-full w-full"
                              />
                            </div>
                          )}
                        </div>
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
