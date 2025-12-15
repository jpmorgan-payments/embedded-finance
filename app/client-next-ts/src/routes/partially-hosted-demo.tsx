import { createFileRoute } from '@tanstack/react-router';

import { PartiallyHostedDemoPage } from '@/components/partially-hosted/PartiallyHostedDemoPage';

export const Route = createFileRoute('/partially-hosted-demo')({
  component: PartiallyHostedDemoPage,
});
