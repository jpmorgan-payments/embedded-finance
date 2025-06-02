import { createFileRoute } from '@tanstack/react-router';
import { MSWTest } from '../components/MSWTest';

export const Route = createFileRoute('/msw-test')({
  component: MSWTestPage,
});

function MSWTestPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg">
            <div className="p-6 border-b">
              <h1 className="text-2xl font-bold text-gray-900">
                MSW Integration Test
              </h1>
              <p className="text-gray-600 mt-2">
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
