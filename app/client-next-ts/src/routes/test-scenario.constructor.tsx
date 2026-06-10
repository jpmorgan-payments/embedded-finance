import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

import { TestScenarioConstructor } from '@/components/test-scenario/test-scenario-constructor';

const queryClient = new QueryClient();

export const Route = createFileRoute('/test-scenario/constructor')({
  component: TestScenarioConstructorRoute,
});

function TestScenarioConstructorRoute() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-neutral-100">
        <TestScenarioConstructor />
      </div>
    </QueryClientProvider>
  );
}
