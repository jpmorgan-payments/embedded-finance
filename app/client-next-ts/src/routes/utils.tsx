/**
 * Utils Collection Page
 *
 * Full page for utility components collection
 */

import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { ComponentsSection } from '../components/landing/components-section';

export const Route = createFileRoute('/utils')({
  component: UtilsPage,
});

function UtilsPage() {
  return (
    <div className="min-h-screen bg-jpm-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-sp-brand hover:text-sp-brand-700 font-medium text-page-small mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-page-hero text-jpm-gray-900 font-bold">
            Utility Components
          </h1>
          <p className="text-page-body text-jpm-gray mt-2 max-w-3xl">
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
