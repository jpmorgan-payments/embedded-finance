import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { TestScenarioPage } from '@/components/test-scenario/test-scenario-page';

const queryClient = new QueryClient();

export const Route = createFileRoute('/test-scenario-5')({
  component: TestScenario5Route,
});

function TestScenario5Route() {
  return (
    <QueryClientProvider client={queryClient}>
      <TestScenarioPage bundleId="test-scenario-5" />
    </QueryClientProvider>
  );
}
