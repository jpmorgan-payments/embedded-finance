import { createFileRoute } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { DashboardLayout } from '../components/sellsense/dashboard-layout';
import { z } from 'zod';

// Define search param schema with validation
const sellsenseDemoSearchSchema = z.object({
  scenario: z
    .enum([
      'New Seller - Onboarding',
      'Onboarding - Docs Needed',
      'Onboarding - In Review',
      'Active Seller - Fresh Start',
      'Active Seller - Established',
    ])
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-4 flex items-center justify-between z-50 shadow-md">
          <Link
            to="/"
            className="flex items-center gap-2 text-blue-800 hover:text-blue-600 font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Showcase
          </Link>
          <span className="text-sm text-slate-500">
            Sellsense Marketplace Demo
          </span>
        </div>
      )}
    </div>
  );
}
