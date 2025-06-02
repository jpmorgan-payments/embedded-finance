import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/solutions')({
  component: SolutionsPage,
});

function SolutionsPage() {
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

        <div className="mb-16">
          <h2 className="text-page-h3 font-bold text-jpm-gray-900 mb-8 text-center">
            Implementation Approaches
          </h2>
          <div className="space-y-8">
            {implementationApproaches.map((approach, index) => (
              <Card
                key={index}
                className="border-0 shadow-page-card bg-jpm-white rounded-page-lg"
              >
                <CardHeader>
                  <CardTitle className="text-page-h4 text-jpm-gray-900 flex items-center">
                    <span className="bg-jpm-brown text-jpm-white rounded-full w-8 h-8 flex items-center justify-center text-page-small font-semibold mr-4">
                      {index + 1}
                    </span>
                    {approach.title}
                  </CardTitle>
                </CardHeader>
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
              </Card>
            ))}
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
