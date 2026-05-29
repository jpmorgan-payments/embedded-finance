import { ExternalLink, FileText } from 'lucide-react';

import { createFileRoute } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Route = createFileRoute('/documentation')({
  component: DocumentationPage,
});

function DocumentationPage() {
  const handleDocumentationClick = () => {
    window.open(
      'https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview',
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-sp-bg py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-sp-border bg-sp-accent p-4">
            <FileText className="h-12 w-12 text-sp-brand" />
          </div>
          <h1 className="mb-6 text-page-h2 font-bold text-jpm-gray-900">
            Documentation
          </h1>
          <p className="mx-auto max-w-3xl text-page-body leading-relaxed text-jpm-gray">
            Access the complete embedded finance API documentation including
            guides, reference materials, and implementation details.
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card className="rounded-page-md border-0 bg-jpm-white text-center shadow-page-card">
            <CardHeader>
              <CardTitle className="text-page-h3 text-jpm-gray-900">
                Embedded Payments API Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="mb-8 text-page-body leading-relaxed text-jpm-gray">
                Use Embedded Payments APIs to integrate account management and
                payout services into your existing platform. The API resources
                provided are designed as a series of logical components that
                make it easy for you to build an account and payment ecosystem.
              </p>

              <div className="mb-8 rounded-page-md border border-sp-border bg-sp-accent p-6">
                <h3 className="mb-2 font-semibold text-jpm-gray-900">
                  API Features
                </h3>
                <ul className="space-y-1 text-page-small text-jpm-gray">
                  <li>• Versioning support with URL prefixes</li>
                  <li>• Production endpoints available</li>
                  <li>• Comprehensive error response codes</li>
                  <li>• Complete integration guides</li>
                </ul>
              </div>

              <Button
                onClick={handleDocumentationClick}
                className="rounded-page-md border-0 bg-sp-brand px-8 py-3 font-semibold text-white shadow-page-card hover:bg-sp-brand-700"
              >
                <FileText className="mr-2 h-5 w-5" />
                VIEW API DOCUMENTATION
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
