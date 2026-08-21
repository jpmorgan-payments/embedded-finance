import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { ClientMaintenanceWorkspace } from '@/components/client-maintenance/ClientMaintenanceWorkspace';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

export const Route = createFileRoute('/approved-client-maintenance')({
  component: ApprovedClientMaintenanceRoute,
});

function ApprovedClientMaintenanceRoute() {
  return (
    <QueryClientProvider client={queryClient}>
      <ClientMaintenanceWorkspace />
    </QueryClientProvider>
  );
}
