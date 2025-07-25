import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { DashboardLayout } from '../components/sellsense/dashboard-layout';
import { getScenarioDisplayNames } from '../components/sellsense/scenarios-config';
import { z } from 'zod';

// Define search param schema with validation
const sellsenseDemoSearchSchema = z.object({
  scenario: z
    .enum(getScenarioDisplayNames() as [string, ...string[]])
    .optional(),
  theme: z
    .enum([
      'Empty',
      'Default Blue',
      'S&P Theme',
      'Create Commerce',
      'SellSense',
      'PayFicient',
    ])
    .optional(),
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
});

function SellsenseDemo() {
  const { fullscreen } = Route.useSearch();

  return (
    <div className="relative min-h-screen">
      <DashboardLayout />
      {/* Only show bottom navigation if NOT in fullscreen mode */}
      {!fullscreen && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-md">
          {/* Mobile-first responsive bottom navigation */}
          <div className="py-2 px-4 flex items-center justify-between md:py-3 md:px-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-blue-800 hover:text-blue-600 font-medium text-sm md:text-base"
            >
              <ArrowLeft className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Back to Showcase</span>
              <span className="sm:hidden">Back</span>
            </Link>
            <span className="text-xs md:text-sm text-slate-500">
              <span className="hidden sm:inline">
                Sellsense Marketplace Demo
              </span>
              <span className="sm:hidden">Demo</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
