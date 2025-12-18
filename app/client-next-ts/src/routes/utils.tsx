/**
 * Utils Collection Page
 *
 * Full page for utility components collection
 */

import { ArrowLeft } from 'lucide-react';

import { createFileRoute, Link } from '@tanstack/react-router';

import { ComponentsSection } from '../components/landing/components-section';

export const Route = createFileRoute('/utils')({
  component: UtilsPage,
});

function UtilsPage() {
  return (
    <div className="min-h-screen bg-jpm-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <Link
            to="/"
            className="mb-4 inline-flex items-center text-page-small font-medium text-sp-brand hover:text-sp-brand-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <h1 className="text-page-hero font-bold text-jpm-gray-900">
            Utility Components
          </h1>
          <p className="mt-2 max-w-3xl text-page-body text-jpm-gray">
            Explore utility components and microinteractions for building
            embedded finance solutions.
          </p>
        </div>

        {/* Utils Section */}
        <ComponentsSection />
      </div>
    </div>
  );
}
