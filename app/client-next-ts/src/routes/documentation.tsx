import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText } from 'lucide-react';

export const Route = createFileRoute('/documentation')({
  component: DocumentationPage,
});

function DocumentationPage() {
  const handleDocumentationClick = () => {
    window.open(
      'https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview',
      '_blank',
    );
  };

  return (
    <div className="min-h-screen py-16 bg-jpm-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="bg-jpm-brown-100 p-4 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <FileText className="h-12 w-12 text-jpm-brown" />
          </div>
          <h1 className="text-page-h2 font-bold text-jpm-gray-900 mb-6">
            Documentation
          </h1>
          <p className="text-page-body text-jpm-gray max-w-3xl mx-auto leading-relaxed">
            Access the complete embedded finance API documentation including
            guides, reference materials, and implementation details.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-lg text-center">
            <CardHeader>
              <CardTitle className="text-page-h3 text-jpm-gray-900">
                Embedded Payments API Documentation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-page-body text-jpm-gray leading-relaxed mb-8">
                Use Embedded Payments APIs to integrate account management and
                payout services into your existing platform. The API resources
                provided are designed as a series of logical components that
                make it easy for you to build an account and payment ecosystem.
              </p>

              <div className="bg-jpm-brown-100 p-6 rounded-page-md mb-8">
                <h3 className="font-semibold text-jpm-gray-900 mb-2">
                  API Features
                </h3>
                <ul className="text-page-small text-jpm-gray space-y-1">
                  <li>• Versioning support with URL prefixes</li>
                  <li>• Production endpoints available</li>
                  <li>• Comprehensive error response codes</li>
                  <li>• Complete integration guides</li>
                </ul>
              </div>

              <Button
                onClick={handleDocumentationClick}
                className="bg-jpm-brown hover:bg-jpm-brown-700 text-jpm-white font-semibold px-8 py-3 rounded-page-md shadow-page-card border-0"
              >
                <FileText className="mr-2 h-5 w-5" />
                View API Documentation
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
