import { useEffect, useMemo, useState } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';

import {
  readTestScenarioConfigFromHash,
  TEST_SCENARIO_CONSTRUCTOR_PATH,
} from '@/components/test-scenario/test-scenario-config';
import { TestScenarioPage } from '@/components/test-scenario/test-scenario-page';
import { Button } from '@/components/ui/button';

const queryClient = new QueryClient();

export const Route = createFileRoute('/test-scenario/play')({
  component: TestScenarioPlayRoute,
});

function TestScenarioPlayRoute() {
  const [hash, setHash] = useState(() =>
    typeof window !== 'undefined' ? window.location.hash : ''
  );

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const config = useMemo(() => readTestScenarioConfigFromHash(hash), [hash]);

  if (!config) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-neutral-900">
          Invalid or missing scenario configuration
        </h1>
        <p className="max-w-md text-sm text-neutral-600">
          Open the constructor to build a valid encoded URL, or append a hash
          like <code className="font-mono text-xs">#o1.hp</code> to this path.
        </p>
        <Button asChild>
          <Link to={TEST_SCENARIO_CONSTRUCTOR_PATH}>Open constructor</Link>
        </Button>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TestScenarioPage config={config} />
    </QueryClientProvider>
  );
}
