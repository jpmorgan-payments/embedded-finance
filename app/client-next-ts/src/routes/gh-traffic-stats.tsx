import { z } from 'zod';

import { createFileRoute, useNavigate } from '@tanstack/react-router';

import {
  GhTrafficStatsDashboard,
  type GhTrafficSearch,
} from '@/components/gh-traffic-stats/gh-traffic-stats-dashboard';
import { REPO_IDS } from '@/lib/gh-metrics/sources';

const ghTrafficStatsSearchSchema = z.object({
  repo: z.enum(REPO_IDS).optional(),
  range: z.enum(['30d', '90d', '12m', 'all']).optional(),
  metric: z.enum(['views', 'clones']).optional(),
});

export const Route = createFileRoute('/gh-traffic-stats')({
  component: GhTrafficStatsPage,
  validateSearch: ghTrafficStatsSearchSchema,
});

function GhTrafficStatsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  return (
    <GhTrafficStatsDashboard
      search={search}
      onSearchChange={(next: GhTrafficSearch) =>
        navigate({ search: (prev) => ({ ...prev, ...next }), replace: true })
      }
    />
  );
}
