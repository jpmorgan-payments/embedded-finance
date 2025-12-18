import { ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';

import { DashboardLayout } from '../components/sellsense/dashboard-layout';
import { getScenarioDisplayNames } from '../components/sellsense/scenarios-config';
import { useScrollLock } from '../hooks/use-scroll-lock';

// Create a client
const queryClient = new QueryClient();

// Define search param schema with validation
const sellsenseDemoSearchSchema = z.object({
  scenario: z
    .enum(getScenarioDisplayNames() as [string, ...string[]])
    .optional(),
  theme: z
    .enum([
      'Empty',
      'Default Blue',
      'Salt Theme',
      'Create Commerce',
      'SellSense',
      'PayFicient',
      'Custom',
    ])
    .optional(),
  customTheme: z.string().optional(), // JSON string of custom theme variables
  contentTone: z.enum(['Standard', 'Friendly']).optional(),
  view: z
    .enum([
      'onboarding',
      'overview',
      'wallet',
      'transactions',
      'linked-accounts',
      'payout',
      'catalog',
      'pricing',
      'orders',
      'payments',
      'performance',
      'analytics',
      'growth',
    ])
    .optional(),
  fullscreen: z.boolean().optional(),
  component: z.string().optional(),
});

export const Route = createFileRoute('/sellsense-demo')({
  component: SellsenseDemo,
  validateSearch: sellsenseDemoSearchSchema,
  // Minimal loader to trigger pendingComponent
  loader: async () => {
    // Small delay to ensure smooth transition
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {};
  },
  // Show loading overlay immediately when navigating to this route
  pendingComponent: PendingDemo,
  pendingMs: 0, // Show immediately, don't wait
  pendingMinMs: 100, // Show for at least 100ms to prevent flashing
});

// Pending component with scroll prevention
// Uses TanStack Router's pendingComponent feature with scroll lock to prevent layout shifts
function PendingDemo() {
  // Lock scroll while pending component is shown
  // This prevents layout shifts during navigation
  useScrollLock(true);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-sp-brand" />
        <p className="text-lg font-medium text-jpm-gray-900">Loading demo...</p>
      </div>
    </div>
  );
}

function SellsenseDemo() {
  const { fullscreen } = Route.useSearch();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="relative min-h-screen">
        <DashboardLayout />
        {/* Only show bottom navigation if NOT in fullscreen mode */}
        {!fullscreen && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white shadow-md">
            {/* Mobile-first responsive bottom navigation */}
            <div className="flex items-center justify-between px-4 py-2 md:px-6 md:py-3">
              <Link
                to="/"
                className="flex items-center gap-2 text-sm font-medium text-blue-800 hover:text-blue-600 md:text-base"
              >
                <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">Back to Showcase</span>
                <span className="sm:hidden">Back</span>
              </Link>
              <span className="text-xs text-slate-500 md:text-sm">
                <span className="hidden sm:inline">
                  Sellsense Marketplace Demo
                </span>
                <span className="sm:hidden">Demo</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </QueryClientProvider>
  );
}
