import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, Code, ExternalLink } from 'lucide-react';

export const Route = createFileRoute('/github')({
  component: GitHubPage,
});

function GitHubPage() {
  const handleGitHubClick = () => {
    window.open(
      'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components',
      '_blank',
    );
  };

  return (
    <div className="min-h-screen py-16 bg-jpm-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="bg-jpm-brown-100 p-4 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Github className="h-12 w-12 text-jpm-brown" />
          </div>
          <h1 className="text-page-h2 font-bold text-jpm-gray-900 mb-6">
            GitHub Repository
          </h1>
          <p className="text-page-body text-jpm-gray max-w-3xl mx-auto leading-relaxed">
            Explore the source code for the embedded components library. Access
            implementation examples, component documentation, and contribute to
            the project.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-lg text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-page-h3 text-jpm-gray-900">
                <Code className="h-6 w-6 mr-3 text-jpm-brown" />
                Embedded Components
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-page-body text-jpm-gray leading-relaxed mb-8">
                The embedded components package is our primary UI component
                library for embedded finance solutions. Built with React 18,
                TypeScript, Radix UI primitives, and Tailwind CSS.
              </p>

              <div className="bg-jpm-brown-100 p-6 rounded-page-md mb-8">
                <h3 className="font-semibold text-jpm-gray-900 mb-4">
                  Key Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-page-small text-jpm-gray">
                  <div className="text-left">
                    <p>• React 18.x with TypeScript</p>
                    <p>• Radix UI primitives</p>
                    <p>• Tailwind CSS styling</p>
                  </div>
                  <div className="text-left">
                    <p>• Storybook documentation</p>
                    <p>• MSW for API mocking</p>
                    <p>• Comprehensive testing</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGitHubClick}
                className="bg-jpm-brown hover:bg-jpm-brown-700 text-jpm-white font-semibold px-8 py-3 rounded-page-md shadow-page-card border-0"
              >
                <Github className="mr-2 h-5 w-5" />
                View Repository
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 bg-jpm-brown-100 rounded-page-lg p-8 text-center">
          <h3 className="text-page-h3 font-bold text-jpm-gray-900 mb-4">
            Getting Started
          </h3>
          <p className="text-page-body text-jpm-gray max-w-2xl mx-auto leading-relaxed">
            Clone the repository, install dependencies, and start exploring the
            embedded components. Follow the README for detailed setup
            instructions and development guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
