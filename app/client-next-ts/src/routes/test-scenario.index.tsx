import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { TestScenarioPage } from '@/components/test-scenario/test-scenario-page';

const queryClient = new QueryClient();

export const Route = createFileRoute('/test-scenario/')({
  component: TestScenarioIndexRoute,
});

function TestScenarioIndexRoute() {
  return (
    <QueryClientProvider client={queryClient}>
      <TestScenarioPage bundleId="test-scenario" />
    </QueryClientProvider>
  );
}
