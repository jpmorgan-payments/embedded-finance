import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect, useRef } from 'react';

export const Route = createFileRoute('/solutions')({
  component: SolutionsPage,
});

function SolutionsPage() {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'buildItYourself-0': false,
    'buildItYourself-1': false,
    'buildItYourself-2': false,
    dropInUI: false,
    jpmHosted: false,
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        cardsRef.current &&
        !cardsRef.current.contains(event.target as Node)
      ) {
        setExpandedCards({
          'buildItYourself-0': false,
          'buildItYourself-1': false,
          'buildItYourself-2': false,
          dropInUI: false,
          jpmHosted: false,
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  };

  const implementationApproaches = [
    {
      title: 'Fully Hosted UI Solutions',
      description:
        'Turnkey options that handle infrastructure, security, and user interface, allowing consumers to integrate complete, production-ready components with minimal effort.',
      benefit: 'Dramatically reduced implementation time and risk.',
    },
    {
      title: 'Runtime UI Injection',
      description:
        'More flexible options including iframes for easy embedding, server-side composition for seamless integration, and client-side composition (e.g., module federation) for dynamic, performant experiences.',
      benefit: 'Balance between ease of implementation and customization.',
    },
    {
      title: 'Embedded UI Components',
      description:
        'UI components published as npm packages that allow for build-time integration. This approach offers deep customization while still providing pre-built, tested components.',
      benefit: 'Customizable UI with reduced development overhead.',
    },
    {
      title: 'UI/UX Cookbooks',
      description:
        'Detailed, human-readable guidelines for implementing web applications including flow diagrams, sequence diagrams, best practices and code samples.',
      benefit:
        'Clear roadmap for custom implementations, reducing design and architecture time.',
    },
    {
      title: 'Machine-Readable Specifications',
      description:
        'Specifications like Arazzo provide a structured way to describe complex workflows and their underlying APIs. These machine-readable formats enable automated code generation for basic implementations, integration with LLMs to quickly produce skeleton/draft versions of digital experiences, and framework-agnostic approach for any UI library or custom instruction set.',
      benefit: 'Rapid prototyping and reduced boilerplate coding.',
    },
  ];

  // Group implementation approaches into categories for our 3-column layout
  const buildItYourselfOptions = [
    implementationApproaches[2], // Embedded UI Components
    implementationApproaches[3], // UI/UX Cookbooks
    implementationApproaches[4], // Machine-Readable Specifications
  ];

  const dropInUIOption = implementationApproaches[1]; // Runtime UI Injection
  const jpmHostedOption = implementationApproaches[0]; // Fully Hosted UI Solutions

  return (
    <div className="min-h-screen py-16 bg-sp-bg">
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
              <p className="text-sm font-semibold text-sp-brand mb-2">
                IMPLEMENTATION OPTIONS
              </p>
              <h1 className="text-page-h2 font-bold text-jpm-gray-900 mb-8">
                Solutions for Every Integration Need
              </h1>
              <div className="bg-sp-brand py-4 px-4 rounded-t-page-lg">
                <div className="text-page-h4 font-bold text-white">
                  Choose Your Integration Approach
                </div>
              </div>
            </div>

            <div id="integration-options" className="mb-16" ref={cardsRef}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                {/* Column 1: Build It Yourself Options */}
                <div id="build-it-yourself" className="flex flex-col space-y-6">
                  {/* Summary Block with Visualization */}{' '}
                  <div className="bg-white rounded-page-lg shadow-page-card border border-sp-border hover:shadow-lg transition-all h-[220px] flex flex-col">
                    <div className="bg-sp-accent rounded-t-page-lg h-36 overflow-hidden border-b border-sp-border">
                      {' '}
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundImage:
                            'url("https://developer.payments.jpmorgan.com/api/download/en/docs/commerce/online-payments/overview-cfs/direct-api-Integration.png?type=image")',
                          backgroundSize: '200%',
                          backgroundPosition: 'center 25%',
                          backgroundRepeat: 'no-repeat',
                          filter:
                            'sepia(0.3) brightness(0.95) contrast(1.05) saturate(0.75)',
                        }}
                      ></div>
                    </div>
                    <div className="p-4 flex flex-col flex-1 justify-center">
                      <h2 className="text-page-h4 font-semibold text-jpm-gray-900 mb-2 text-center">
                        Build It Yourself
                      </h2>
                      <p className="text-jpm-gray-600 text-center text-page-small">
                        Fully customizable solutions that give you complete
                        control over the user experience.
                      </p>
                    </div>
                  </div>
                  {buildItYourselfOptions.map((approach, index) => {
                    const cardId = `buildItYourself-${index}`;
                    const isExpanded = expandedCards[cardId];

                    return (
                      <Card
                        key={index}
                        className="border-0 shadow-page-card bg-jpm-white rounded-page-lg overflow-hidden"
                      >
                        <CardHeader
                          className="cursor-pointer hover:bg-sp-accent transition-colors"
                          onClick={() => toggleCard(cardId)}
                        >
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-page-h4 text-jpm-gray-900">
                              {approach.title}
                            </CardTitle>
                            <div className="text-jpm-gray-600">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        </CardHeader>
                        <div
                          className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}
                        >
                          <CardContent className="p-6">
                            <p className="text-page-body text-jpm-gray leading-relaxed mb-4">
                              {approach.description}
                            </p>
                            <div className="bg-sp-accent p-4 rounded-page-md border border-sp-border">
                              <p className="text-page-small font-semibold text-sp-brand">
                                Key Benefit: {approach.benefit}
                              </p>
                            </div>
                          </CardContent>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Column 2: Drop-in UI */}
                <div id="drop-in-ui" className="flex flex-col space-y-6">
                  {/* Summary Block with Visualization */}{' '}
                  <div className="bg-white rounded-page-lg shadow-page-card border border-sp-border hover:shadow-lg transition-all h-[220px] flex flex-col">
                    <div className="bg-sp-accent rounded-t-page-lg h-36 overflow-hidden border-b border-sp-border">
                      {' '}
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundImage:
                            'url("https://developer.payments.jpmorgan.com/api/download/en/docs/commerce/online-payments/overview-cfs/drop-in-checkout.png?type=image")',
                          backgroundSize: '200%',
                          backgroundPosition: 'center 25%',
                          backgroundRepeat: 'no-repeat',
                          filter:
                            'sepia(0.3) brightness(0.95) contrast(1.05) saturate(0.75)',
                        }}
                      ></div>
                    </div>
                    <div className="p-4 flex flex-col flex-1 justify-center">
                      <h2 className="text-page-h4 font-semibold text-jpm-gray-900 mb-2 text-center">
                        Drop-in UI
                      </h2>
                      <p className="text-jpm-gray-600 text-center text-page-small">
                        Ready-made UI components that can be easily integrated
                        into your existing applications.
                      </p>
                    </div>
                  </div>
                  <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-lg overflow-hidden">
                    <CardHeader
                      className="cursor-pointer hover:bg-sp-accent transition-colors"
                      onClick={() => toggleCard('dropInUI')}
                    >
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-page-h4 text-jpm-gray-900">
                          {dropInUIOption.title}
                        </CardTitle>
                        <div className="text-jpm-gray-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 transition-transform ${expandedCards['dropInUI'] ? 'transform rotate-180' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </CardHeader>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${expandedCards['dropInUI'] ? 'max-h-[500px]' : 'max-h-0'}`}
                    >
                      <CardContent className="p-6">
                        <p className="text-page-body text-jpm-gray leading-relaxed mb-4">
                          {dropInUIOption.description}
                        </p>
                        <div className="bg-sp-accent p-4 rounded-page-md border border-sp-border">
                          <p className="text-page-small font-semibold text-sp-brand">
                            Key Benefit: {dropInUIOption.benefit}
                          </p>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </div>

                {/* Column 3: JPM Hosted */}
                <div id="jpm-hosted" className="flex flex-col space-y-6">
                  {/* Summary Block with Visualization */}
                  <div className="bg-white rounded-page-lg shadow-page-card border border-sp-border hover:shadow-lg transition-all h-[220px] flex flex-col">
                    {' '}
                    <div className="bg-sp-accent rounded-t-page-lg h-36 overflow-hidden border-b border-sp-border">
                      {' '}
                      <div
                        className="h-full w-full"
                        style={{
                          backgroundImage:
                            'url("https://developer.payments.jpmorgan.com/api/download/en/docs/commerce/online-payments/overview-cfs/checkout-hosted-pay-page.png?type=image")',
                          backgroundSize: '200%',
                          backgroundPosition: 'center 25%',
                          backgroundRepeat: 'no-repeat',
                          filter:
                            'sepia(0.3) brightness(0.95) contrast(1.05) saturate(0.75)',
                        }}
                      ></div>
                    </div>
                    <div className="p-4 flex flex-col flex-1 justify-center">
                      <h2 className="text-page-h4 font-semibold text-jpm-gray-900 mb-2 text-center">
                        JPM Hosted
                      </h2>
                      <p className="text-jpm-gray-600 text-center text-page-small">
                        Complete turnkey solutions hosted and maintained by
                        JPMorgan Chase.
                      </p>
                    </div>
                  </div>
                  <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-lg overflow-hidden">
                    <CardHeader
                      className="cursor-pointer hover:bg-sp-accent transition-colors"
                      onClick={() => toggleCard('jpmHosted')}
                    >
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-page-h4 text-jpm-gray-900">
                          {jpmHostedOption.title}
                        </CardTitle>
                        <div className="text-jpm-gray-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 transition-transform ${expandedCards['jpmHosted'] ? 'transform rotate-180' : ''}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </CardHeader>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${expandedCards['jpmHosted'] ? 'max-h-[500px]' : 'max-h-0'}`}
                    >
                      <CardContent className="p-6">
                        <p className="text-page-body text-jpm-gray leading-relaxed mb-4">
                          {jpmHostedOption.description}
                        </p>
                        <div className="bg-sp-accent p-4 rounded-page-md border border-sp-border">
                          <p className="text-page-small font-semibold text-sp-brand">
                            Key Benefit: {jpmHostedOption.benefit}
                          </p>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
