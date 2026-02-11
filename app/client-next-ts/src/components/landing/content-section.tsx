import { FileText, Package, Server } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export function ContentSection() {
  return (
    <section className="bg-sp-bg py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-4xl text-center">
          <h2 className="mb-6 text-page-h2 text-jpm-gray-900">
            In this showcase
          </h2>
          <p className="text-page-body leading-relaxed text-jpm-gray">
            This showcase application demonstrates the main use cases for
            embedded finance APIs and components. Explore this app to get a
            general sense of the experiences you can create, alongside mocked
            API requests and responses.
          </p>
        </div>

        <div className="mb-16">
          <h3 className="mb-8 text-center text-page-h3 text-jpm-gray-900">
            API Workflows & Implementation Approaches
          </h3>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <Card className="rounded-page-md border-0 bg-jpm-white shadow-page-card">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-sp-border bg-sp-accent">
                  <Package className="h-8 w-8 text-sp-brand" />
                </div>
                <h4 className="mb-4 text-page-h4 text-jpm-gray-900">
                  Embedded Components
                </h4>
                <p className="text-page-body leading-relaxed text-jpm-gray">
                  Build-time UI injection published as npm packages for seamless
                  integration
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-page-md border-0 bg-jpm-white shadow-page-card">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-sp-border bg-sp-accent">
                  <FileText className="h-8 w-8 text-sp-brand" />
                </div>
                <h4 className="mb-4 text-page-h4 text-jpm-gray-900">
                  UI/UX Recipes
                </h4>
                <p className="text-page-body leading-relaxed text-jpm-gray">
                  Detailed guidelines and patterns for implementing financial
                  workflows
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-page-md border-0 bg-jpm-white shadow-page-card">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-sp-border bg-sp-accent">
                  <Server className="h-8 w-8 text-sp-brand" />
                </div>
                <h4 className="mb-4 text-page-h4 text-jpm-gray-900">
                  Hosted Solutions
                </h4>
                <p className="text-page-body leading-relaxed text-jpm-gray">
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
