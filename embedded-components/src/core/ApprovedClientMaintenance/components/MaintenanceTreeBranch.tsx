import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export type MaintenanceTreeLine = 'solid' | 'dashed';

const HIGHLIGHT_CLASS = {
  primary: 'eb-border-dashed eb-border-primary',
  informative: 'eb-border-dashed eb-border-informative',
};

const spineClass = (line: MaintenanceTreeLine) =>
  cn(
    'eb-absolute eb-left-0 eb-border-l-2 eb-border-border',
    line === 'dashed' && 'eb-border-dashed'
  );

/**
 * One child in a tree, joined to its parent's spine by an elbow 1.75rem below
 * its top, the center of a 3.5rem row or of a 2rem icon with 0.75rem padding.
 * Lists of branches indent so the spine runs beneath the parent's icon, and
 * space their items by 0.5rem.
 */
export function MaintenanceTreeBranch({
  isLast,
  line = 'solid',
  nextLine = 'solid',
  highlight,
  className,
  children,
  ...dataAttributes
}: {
  isLast: boolean;
  /** Dashed for something that doesn't exist yet, such as a pending addition. */
  line?: MaintenanceTreeLine;
  /** The spine continuing to the next sibling. */
  nextLine?: MaintenanceTreeLine;
  /** Draws a dashed elbow in color, such as for a move. */
  highlight?: keyof typeof HIGHLIGHT_CLASS;
  className?: string;
  children: ReactNode;
} & { [attribute: `data-${string}`]: string | undefined }) {
  const elbowClass = highlight
    ? HIGHLIGHT_CLASS[highlight]
    : cn('eb-border-border', line === 'dashed' && 'eb-border-dashed');
  return (
    <li className={cn('eb-relative eb-pl-5', className)} {...dataAttributes}>
      {isLast ? (
        <>
          <span
            aria-hidden="true"
            data-tree-spine={line}
            className={cn(spineClass(line), 'eb--top-2 eb-h-7')}
          />
          <span
            aria-hidden="true"
            data-tree-elbow=""
            className={cn(
              'eb-absolute eb-left-0 eb-top-5 eb-h-[calc(0.5rem_+_1px)] eb-w-5 eb-rounded-bl-lg eb-border-b-2 eb-border-l-2',
              elbowClass
            )}
          />
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            data-tree-spine={line}
            className={cn(spineClass(line), 'eb--top-2 eb-h-9')}
          />
          <span
            aria-hidden="true"
            data-tree-spine={nextLine}
            className={cn(spineClass(nextLine), 'eb-bottom-0 eb-top-7')}
          />
          <span
            aria-hidden="true"
            data-tree-elbow=""
            className={cn(
              'eb-absolute eb-left-0 eb-top-[calc(1.75rem_-_1px)] eb-w-5 eb-border-t-2',
              elbowClass
            )}
          />
        </>
      )}
      {children}
    </li>
  );
}
