/**
 * ClientDetails - Displays all information for a fully onboarded ACTIVE client
 * from GET /clients/:id. Supports accordion and cards view modes.
 */

import { cn } from '@/lib/utils';
import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { Skeleton } from '@/components/ui';

import { CLIENT_DETAILS_DEFAULT_VIEW_MODE } from './ClientDetails.constants';
import type { ClientDetailsProps } from './ClientDetails.types';
import { AccordionView } from './components/AccordionView/AccordionView';
import { CardsView } from './components/CardsView/CardsView';

const DEFAULT_TITLE = 'Client details';

export function ClientDetails({
  clientId,
  viewMode = CLIENT_DETAILS_DEFAULT_VIEW_MODE,
  title = DEFAULT_TITLE,
  className,
}: ClientDetailsProps) {
  const {
    data: client,
    isLoading,
    isError,
    error,
  } = useSmbdoGetClient(clientId, {
    query: { enabled: !!clientId },
  });

  if (!clientId) {
    return (
      <div
        className={cn(
          'eb-component eb-w-full eb-rounded-lg eb-border eb-border-dashed eb-border-border eb-bg-muted/30 eb-p-6 eb-text-center eb-text-sm eb-text-muted-foreground',
          className
        )}
      >
        Client ID is required.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className={cn(
          'eb-component eb-w-full eb-space-y-4 eb-px-4 eb-py-4 @md:eb-px-6',
          className
        )}
      >
        <Skeleton className="eb-h-6 eb-w-40 eb-rounded" />
        <div className="eb-space-y-3">
          <Skeleton className="eb-h-4 eb-w-full eb-rounded" />
          <Skeleton className="eb-h-4 eb-w-5/6 eb-rounded" />
          <Skeleton className="eb-h-4 eb-w-4/6 eb-rounded" />
          <Skeleton className="eb-h-20 eb-w-full eb-rounded" />
        </div>
      </div>
    );
  }

  if (isError || !client) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message?: string }).message)
        : 'Failed to load client details.';
    return (
      <div
        className={cn(
          'eb-component eb-w-full eb-rounded-lg eb-border eb-border-destructive/50 eb-bg-destructive/10 eb-p-4 eb-text-sm eb-text-destructive',
          className
        )}
      >
        {message}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'eb-component eb-flex eb-w-full eb-max-w-full eb-flex-col',
        className
      )}
    >
      <header className="eb-flex eb-min-h-[48px] eb-items-center eb-border-b eb-border-border eb-px-4 eb-py-3 @md:eb-px-6">
        <h1 className="eb-text-base eb-font-semibold eb-tracking-tight">
          {title}
        </h1>
      </header>
      <div className="eb-flex eb-flex-1 eb-flex-col eb-overflow-y-auto eb-p-4 @md:eb-px-6 @md:eb-py-5">
        {viewMode === 'accordion' ? (
          <AccordionView client={client} />
        ) : (
          <CardsView client={client} />
        )}
      </div>
    </div>
  );
}
