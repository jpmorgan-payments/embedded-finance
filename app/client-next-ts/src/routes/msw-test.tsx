import { createFileRoute } from '@tanstack/react-router';

import { MSWTest } from '../components/MSWTest';

export const Route = createFileRoute('/msw-test')({
  component: MSWTestPage,
});

function MSWTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg bg-white shadow-lg">
            <div className="border-b p-6">
              <h1 className="text-2xl font-bold text-gray-900">
                MSW Integration Test
              </h1>
              <p className="mt-2 text-gray-600">
                This page tests the Mock Service Worker (MSW) integration by
                making API calls to mock endpoints.
              </p>
            </div>
            <MSWTest />
          </div>
        </div>
      </div>
    </div>
  );
}
