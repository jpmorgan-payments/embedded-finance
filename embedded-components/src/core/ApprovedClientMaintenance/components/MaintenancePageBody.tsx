import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { useScrollEdges } from '../hooks/useScrollEdges';
import { useIsMaintenanceNavigatorVisible } from './MaintenanceNavigatorVisibleContext';

const EDGE_SHADOW_CLASS =
  'eb-pointer-events-none eb-absolute eb-inset-x-0 eb-z-10 eb-h-2 eb-transition-opacity eb-duration-200 motion-reduce:eb-transition-none';

/**
 * The scrolling region of a page, between its header and footer. When the
 * page is height-limited beside the navigator, only this region scrolls, and
 * soft edges show when content continues beyond it.
 */
export function MaintenancePageBody({
  className,
  contentClassName,
  children,
}: {
  /** Applied to the region; use negative margins to reach the card edges. */
  className?: string;
  /** Applied to the scrolling content, such as padding that offsets those margins. */
  contentClassName?: string;
  children: ReactNode;
}) {
  const [scrollRef, edges] = useScrollEdges<HTMLDivElement>();
  // Only the split layout limits the page's height; otherwise the window scrolls.
  const isHeightLimited = useIsMaintenanceNavigatorVisible();

  return (
    <div
      data-maintenance-page-body=""
      className={cn(
        'eb-relative eb-flex eb-min-h-0 eb-flex-1 eb-flex-col',
        className
      )}
    >
      <div
        ref={scrollRef}
        data-maintenance-page-scroll={isHeightLimited ? '' : undefined}
        className={cn(
          'eb-min-h-0 eb-flex-1',
          isHeightLimited && 'eb-overflow-y-auto',
          contentClassName
        )}
      >
        {children}
      </div>
      {isHeightLimited ? (
        <>
          <span
            aria-hidden="true"
            data-scroll-shadow="top"
            className={cn(
              EDGE_SHADOW_CLASS,
              'eb-top-0',
              edges.above ? 'eb-opacity-100' : 'eb-opacity-0'
            )}
            style={{ boxShadow: 'inset 0 8px 8px -8px rgb(0 0 0 / 0.18)' }}
          />
          <span
            aria-hidden="true"
            data-scroll-shadow="bottom"
            className={cn(
              EDGE_SHADOW_CLASS,
              'eb-bottom-0',
              edges.below ? 'eb-opacity-100' : 'eb-opacity-0'
            )}
            style={{ boxShadow: 'inset 0 -8px 8px -8px rgb(0 0 0 / 0.18)' }}
          />
        </>
      ) : null}
    </div>
  );
}
