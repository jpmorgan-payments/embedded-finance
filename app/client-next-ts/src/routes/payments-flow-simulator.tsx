import { createFileRoute } from '@tanstack/react-router';

import { EmbeddedPaymentsFlowPage } from '@/components/embedded-payments-flow/embedded-payments-flow-page';

export const Route = createFileRoute('/payments-flow-simulator')({
  component: EmbeddedPaymentsFlowPage,
});
