import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { TestScenarioPage } from '@/components/test-scenario/test-scenario-page';

const queryClient = new QueryClient();

export const Route = createFileRoute('/test-scenario-2')({
  component: TestScenario2Route,
});

function TestScenario2Route() {
  return (
    <QueryClientProvider client={queryClient}>
      <TestScenarioPage bundleId="test-scenario-2" />
    </QueryClientProvider>
  );
}
