import { createFileRoute } from '@tanstack/react-router';

import { C1Showcase } from '@/components/c1/c1-showcase';

export const Route = createFileRoute('/test-scenario-c1')({
  component: C1Showcase,
});
