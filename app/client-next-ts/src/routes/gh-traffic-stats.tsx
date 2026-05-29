import { z } from 'zod';

import { createFileRoute } from '@tanstack/react-router';

import { GhTrafficStatsDashboard } from '../components/rum-dashboard/GhTrafficStatsDashboard';

// Define search param schema with validation
const ghTrafficStatsSearchSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  metrics: z.string().optional(), // Comma-separated list of metrics
  chartType: z.enum(['area', 'line', 'bar']).optional(),
});

export const Route = createFileRoute('/gh-traffic-stats')({
  component: GhTrafficStatsPage,
  validateSearch: ghTrafficStatsSearchSchema,
});

function GhTrafficStatsPage() {
  return <GhTrafficStatsDashboard />;
}
