import { z } from 'zod';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { ClientMaintenanceWorkspace } from '@/components/client-maintenance/ClientMaintenanceWorkspace';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const approvedClientMaintenanceSearchSchema = z.object({
  step: z.enum(['profile', 'review', 'attest', 'submitted']).optional(),
});

export const Route = createFileRoute('/approved-client-maintenance')({
  component: ApprovedClientMaintenanceRoute,
  validateSearch: approvedClientMaintenanceSearchSchema,
});

function ApprovedClientMaintenanceRoute() {
  const { step } = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <QueryClientProvider client={queryClient}>
      <ClientMaintenanceWorkspace
        step={step}
        onStepChange={(next) => navigate({ search: { step: next } })}
      />
    </QueryClientProvider>
  );
}
