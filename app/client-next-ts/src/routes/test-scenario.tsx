import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/test-scenario')({
  component: TestScenarioLayout,
});

function TestScenarioLayout() {
  return <Outlet />;
}
