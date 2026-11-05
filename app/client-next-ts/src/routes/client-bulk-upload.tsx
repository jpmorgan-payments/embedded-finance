import { createFileRoute } from '@tanstack/react-router';

import { ClientBulkUploadPage } from '@/components/client-bulk-upload/client-bulk-upload-page';

// Standalone utility: intentionally not linked from the showcase navigation.
export const Route = createFileRoute('/client-bulk-upload')({
  component: ClientBulkUploadPage,
});
