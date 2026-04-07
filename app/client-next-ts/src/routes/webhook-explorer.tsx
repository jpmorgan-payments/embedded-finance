import { createFileRoute } from '@tanstack/react-router';

import { WebhookExplorerPage } from '@/components/webhook-explorer/webhook-explorer-page';

export const Route = createFileRoute('/webhook-explorer')({
  component: WebhookExplorerPage,
});
