import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export const Route = createFileRoute('/solutions')({
  component: SolutionsPage,
});

function SolutionsPage() {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    'buildItYourself-0': false,
    'buildItYourself-1': false,
    'buildItYourself-2': false,
    'dropInUI': false,
    'jpmHosted': false,
  });
  
  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
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
    <div className="min-h-screen py-16 bg-jpm-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-page-h2 font-bold text-jpm-gray-900 mb-6">
            Accelerating API Implementation: From Calls to Workflows
          </h1>
          <p className="text-page-body text-jpm-gray max-w-4xl mx-auto leading-relaxed">
            In the world of APIs, individual calls rarely stand alone. More
            often, business capabilities require a series of steps - a workflow.
            The Digital Onboarding APIs, for instance, offer powerful tools for
            managing digital processes. But how can API providers help consumers
            create user-friendly, efficient experiences tailored to their
            specific business needs?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Column 1: Build It Yourself Options */}
          <div className="flex flex-col space-y-6">
            {/* Summary Block with Visualization */}
            <div className="bg-gradient-to-br from-jpm-gray-200 to-jpm-gray-100 p-6 rounded-page-lg shadow-sm">
              <h2 className="text-page-h3 font-bold text-jpm-gray-900 mb-4">
                Build It Yourself
              </h2>
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 flex items-center justify-center rounded-full bg-jpm-white shadow-md mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-jpm-brown" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="text-jpm-gray-700 text-center text-page-body mb-0">
                Fully customizable solutions that give you complete control over the user experience.
              </p>
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
                    className="cursor-pointer hover:bg-jpm-gray-50 transition-colors" 
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
                      <div className="bg-jpm-brown-100 p-4 rounded-page-md">
                        <p className="text-page-small font-semibold text-jpm-brown">
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
          <div className="flex flex-col space-y-6">
            {/* Summary Block with Visualization */}
            <div className="bg-gradient-to-br from-jpm-gray-200 to-jpm-gray-100 p-6 rounded-page-lg shadow-sm">
              <h2 className="text-page-h3 font-bold text-jpm-gray-900 mb-4">
                Drop-in UI
              </h2>
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 flex items-center justify-center rounded-full bg-jpm-white shadow-md mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-jpm-brown" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-jpm-gray-700 text-center text-page-body mb-0">
                Ready-made UI components that can be easily integrated into your existing applications.
              </p>
            </div>
            
            <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-lg overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-jpm-gray-50 transition-colors" 
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
                  <div className="bg-jpm-brown-100 p-4 rounded-page-md">
                    <p className="text-page-small font-semibold text-jpm-brown">
                      Key Benefit: {dropInUIOption.benefit}
                    </p>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Column 3: JPM Hosted */}
          <div className="flex flex-col space-y-6">
            {/* Summary Block with Visualization */}
            <div className="bg-gradient-to-br from-jpm-gray-200 to-jpm-gray-100 p-6 rounded-page-lg shadow-sm">
              <h2 className="text-page-h3 font-bold text-jpm-gray-900 mb-4">
                JPM Hosted
              </h2>
              <div className="flex justify-center mb-4">
                <div className="w-24 h-24 flex items-center justify-center rounded-full bg-jpm-white shadow-md mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-jpm-brown" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                  </svg>
                </div>
              </div>
              <p className="text-jpm-gray-700 text-center text-page-body mb-0">
                Complete turnkey solutions hosted and maintained by JPMorgan Chase.
              </p>
            </div>
            
            <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-lg overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-jpm-gray-50 transition-colors" 
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
                  <div className="bg-jpm-brown-100 p-4 rounded-page-md">
                    <p className="text-page-small font-semibold text-jpm-brown">
                      Key Benefit: {jpmHostedOption.benefit}
                    </p>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
        
        <div className="bg-jpm-brown-100 rounded-page-lg p-8">
          <h3 className="text-page-h3 font-bold text-jpm-gray-900 mb-6 text-center">
            The Digital Onboarding Example
          </h3>
          <div className="max-w-4xl mx-auto">
            <p className="text-page-body text-jpm-gray leading-relaxed mb-6">
              Consider a digital onboarding process. An API provider could
              offer:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-jpm-white p-6 rounded-page-md shadow-page-card">
                <h4 className="font-semibold text-jpm-gray-900 mb-2">
                  1. Fully hosted solution
                </h4>
                <p className="text-page-small text-jpm-gray">
                  For immediate implementation
                </p>
              </div>
              <div className="bg-jpm-white p-6 rounded-page-md shadow-page-card">
                <h4 className="font-semibold text-jpm-gray-900 mb-2">
                  2. Embeddable components
                </h4>
                <p className="text-page-small text-jpm-gray">
                  For key steps (e.g., ID verification)
                </p>
              </div>
              <div className="bg-jpm-white p-6 rounded-page-md shadow-page-card">
                <h4 className="font-semibold text-jpm-gray-900 mb-2">
                  3. Detailed cookbook
                </h4>
                <p className="text-page-small text-jpm-gray">
                  Outlining the entire workflow
                </p>
              </div>
              <div className="bg-jpm-white p-6 rounded-page-md shadow-page-card">
                <h4 className="font-semibold text-jpm-gray-900 mb-2">
                  4. Arazzo specification
                </h4>
                <p className="text-page-small text-jpm-gray">
                  Describing the process structure
                </p>
              </div>
            </div>
            <p className="text-page-body text-jpm-gray leading-relaxed mt-6 text-center">
              This multi-faceted approach allows API consumers to choose the
              implementation method that best fits their needs, timeline, and
              resources. By providing these accelerators, API providers do more
              than just offer endpoints – they become partners in their
              consumers' success.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
