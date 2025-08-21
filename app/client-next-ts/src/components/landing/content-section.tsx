import { Card, CardContent } from '@/components/ui/card';
import { Package, FileText, Server } from 'lucide-react';

export function ContentSection() {
  return (
    <section className="py-12 bg-sp-bg">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-page-h2 text-jpm-gray-900 mb-6">
            In this showcase
          </h2>
          <p className="text-page-body text-jpm-gray leading-relaxed">
            This showcase application demonstrates the main use cases for
            embedded finance APIs and components. Explore this app to get a
            general sense of the experiences you can create, alongside mocked
            API requests and responses.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-page-h3 text-jpm-gray-900 mb-8 text-center">
            API Workflows & Implementation Approaches
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-md">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-sp-accent rounded-full flex items-center justify-center mx-auto mb-6 border border-sp-border">
                  <Package className="h-8 w-8 text-sp-brand" />
                </div>
                <h4 className="text-page-h4 text-jpm-gray-900 mb-4">
                  Embedded Components
                </h4>
                <p className="text-page-body text-jpm-gray leading-relaxed">
                  Build-time UI injection published as npm packages for seamless
                  integration
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-md">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-sp-accent rounded-full flex items-center justify-center mx-auto mb-6 border border-sp-border">
                  <FileText className="h-8 w-8 text-sp-brand" />
                </div>
                <h4 className="text-page-h4 text-jpm-gray-900 mb-4">
                  UI/UX Recipes
                </h4>
                <p className="text-page-body text-jpm-gray leading-relaxed">
                  Detailed guidelines and patterns for implementing financial
                  workflows
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-page-card bg-jpm-white rounded-page-md">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-sp-accent rounded-full flex items-center justify-center mx-auto mb-6 border border-sp-border">
                  <Server className="h-8 w-8 text-sp-brand" />
                </div>
                <h4 className="text-page-h4 text-jpm-gray-900 mb-4">
                  Hosted Solutions
                </h4>
                <p className="text-page-body text-jpm-gray leading-relaxed">
                  Fully hosted UI components with complete infrastructure and
                  security
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
