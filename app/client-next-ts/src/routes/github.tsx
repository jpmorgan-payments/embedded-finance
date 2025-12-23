import { Code, ExternalLink, Github } from 'lucide-react';

import { createFileRoute } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/github')({
  component: GitHubPage,
});

function GitHubPage() {
  const handleGitHubClick = () => {
    window.open(
      'https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components',
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-sp-bg py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-sp-border bg-sp-accent p-4">
            <Github className="h-12 w-12 text-sp-brand" />
          </div>
          <h1 className="mb-6 text-page-h2 font-bold text-jpm-gray-900">
            GitHub Repository
          </h1>
          <p className="mx-auto max-w-3xl text-page-body leading-relaxed text-jpm-gray">
            Explore the source code for the embedded components library. Access
            implementation examples, component documentation, and contribute to
            the project.
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card className="rounded-page-md border-0 bg-jpm-white text-center shadow-page-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-page-h3 text-jpm-gray-900">
                <Code className="mr-3 h-6 w-6 text-sp-brand" />
                Embedded Components
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="mb-8 text-page-body leading-relaxed text-jpm-gray">
                The embedded components package is our primary UI component
                library for embedded finance solutions. Built with React 18,
                TypeScript, Radix UI primitives, and Tailwind CSS.
              </p>

              <div className="mb-8 rounded-page-md border border-sp-border bg-sp-accent p-6">
                <h3 className="mb-4 font-semibold text-jpm-gray-900">
                  Key Features
                </h3>
                <div className="grid grid-cols-1 gap-4 text-page-small text-jpm-gray md:grid-cols-2">
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
                className="rounded-page-md border-0 bg-sp-brand px-8 py-3 font-semibold text-white shadow-page-card hover:bg-sp-brand-700"
              >
                <Github className="mr-2 h-5 w-5" />
                VIEW REPOSITORY
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 rounded-page-md border border-sp-border bg-sp-accent p-8 text-center">
          <h3 className="mb-4 text-page-h3 font-bold text-jpm-gray-900">
            Getting Started
          </h3>
          <p className="mx-auto max-w-2xl text-page-body leading-relaxed text-jpm-gray">
            Clone the repository, install dependencies, and start exploring the
            embedded components. Follow the README for detailed setup
            instructions and development guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
