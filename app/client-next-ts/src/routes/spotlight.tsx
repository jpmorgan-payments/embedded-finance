import { createFileRoute } from '@tanstack/react-router';

import { SpotlightPage } from '@/components/spotlight/spotlight-page';

export const Route = createFileRoute('/spotlight')({
  component: SpotlightPage,
});
