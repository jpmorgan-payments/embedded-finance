import type { ReactNode } from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';

import { cn } from '@/lib/utils';
import { RadioGroup } from '@/components/ui';

import { MaintenanceEntityMedallion } from './MaintenanceEntityMedallion';
import {
  MaintenanceTreeBranch,
  type MaintenanceTreeLine,
} from './MaintenanceTreeBranch';

export type OwnershipPickerNode = {
  partyId: string;
  /** Omitted for the root, and for nodes whose parent isn't listed. */
  parentPartyId?: string;
  name: string;
  caption?: string;
  /** Shown for context but not choosable. */
  disabled?: boolean;
};

export type OwnershipPickerBranchItem = {
  key: string;
  content: ReactNode;
  /** Draws the connector in the primary color. */
  highlight?: boolean;
};

// Fixed row height keeps the connectors meeting each row at its center.
const ROW_CLASS =
  'eb-flex eb-h-14 eb-w-full eb-items-center eb-gap-3 eb-rounded-md eb-border eb-px-3 eb-text-left';
const OPTION_CLASS =
  'eb-group eb-cursor-pointer eb-bg-background eb-transition-colors hover:eb-border-primary/50 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-ring focus-visible:eb-ring-offset-1 disabled:eb-cursor-not-allowed disabled:eb-opacity-60 data-[state=checked]:eb-border-primary data-[state=checked]:eb-bg-accent/30';

function PickerRowText({
  name,
  caption,
}: {
  name: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <span className="eb-min-w-0 eb-flex-1">
      <span className="eb-block eb-truncate eb-text-sm eb-font-medium eb-leading-5">
        {name}
      </span>
      {caption ? (
        <span className="eb-block eb-truncate eb-text-xs eb-leading-4 eb-text-muted-foreground">
          {caption}
        </span>
      ) : null}
    </span>
  );
}

/** The radio drawn inside a whole-row choice, so the full row stays clickable. */
function RadioMark() {
  return (
    <span
      aria-hidden="true"
      data-radio-mark=""
      className="group-data-[state=checked]:eb-border-primary eb-flex eb-size-4 eb-shrink-0 eb-items-center eb-justify-center eb-rounded-full eb-border eb-border-muted-foreground eb-bg-background eb-transition-colors"
    >
      <span className="group-data-[state=checked]:eb-block eb-hidden eb-size-2 eb-rounded-full eb-bg-primary" />
    </span>
  );
}

/** A choosable row for something that doesn't exist yet, such as a new business. */
export function MaintenanceOwnershipPickerOption({
  value,
  name,
  caption,
}: {
  value: string;
  name: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <RadioGroupPrimitive.Item
      value={value}
      className={cn(ROW_CLASS, OPTION_CLASS, 'eb-border-dashed')}
    >
      <RadioMark />
      <PickerRowText name={name} caption={caption} />
    </RadioGroupPrimitive.Item>
  );
}

/** A non-choosable row that shows where a party sits, such as before and after a move. */
export function MaintenanceOwnershipPickerMarker({
  kind,
  name,
  label,
  variant,
  muted = false,
}: {
  kind: 'person' | 'business';
  name: string;
  label: string;
  variant: 'current' | 'new';
  muted?: boolean;
}) {
  return (
    <div
      data-ownership-marker={variant}
      className={cn(
        ROW_CLASS,
        'eb-border-dashed eb-transition-opacity',
        variant === 'new'
          ? 'eb-border-primary eb-bg-accent/30 eb-duration-200 eb-animate-in eb-fade-in-0 motion-reduce:eb-animate-none'
          : 'eb-border-border eb-bg-muted/20',
        muted && 'eb-opacity-50'
      )}
    >
      <MaintenanceEntityMedallion
        kind={kind}
        size="sm"
        className={cn(
          variant === 'new' && 'eb-bg-primary eb-text-primary-foreground'
        )}
      />
      <PickerRowText name={name} />
      <span
        className={cn(
          'eb-shrink-0 eb-rounded-full eb-border eb-bg-background eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium',
          variant === 'new'
            ? 'eb-border-primary eb-text-primary'
            : 'eb-text-muted-foreground'
        )}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Businesses in an ownership structure as a tree of selectable rows, connected
 * the same way as the ownership structure view.
 */
export function MaintenanceOwnershipPicker({
  label,
  rootPartyId,
  nodes,
  value,
  disabled = false,
  onValueChange,
  getBranchStart,
  rootFooter,
  className,
}: {
  label: string;
  rootPartyId: string;
  nodes: OwnershipPickerNode[];
  value: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  /** Rows placed first beneath a node, such as position markers. */
  getBranchStart?: (partyId: string) => OwnershipPickerBranchItem[];
  /** A row placed last beneath the root, joined by a dashed line because it doesn't exist yet. */
  rootFooter?: ReactNode;
  className?: string;
}) {
  const listedIds = new Set(nodes.map((node) => node.partyId));
  const getParentId = (node: OwnershipPickerNode) =>
    node.parentPartyId && listedIds.has(node.parentPartyId)
      ? node.parentPartyId
      : rootPartyId;
  const root = nodes.find((node) => node.partyId === rootPartyId);

  const renderRow = (node: OwnershipPickerNode) =>
    node.disabled ? (
      <div className={cn(ROW_CLASS, 'eb-bg-muted/20')}>
        <MaintenanceEntityMedallion kind="business" size="sm" />
        <PickerRowText name={node.name} caption={node.caption} />
      </div>
    ) : (
      <RadioGroupPrimitive.Item
        value={node.partyId}
        aria-label={node.name}
        className={cn(ROW_CLASS, OPTION_CLASS)}
      >
        <RadioMark />
        <PickerRowText name={node.name} caption={node.caption} />
      </RadioGroupPrimitive.Item>
    );

  const renderBranches = (
    node: OwnershipPickerNode,
    visited: Set<string>
  ): ReactNode => {
    const nextVisited = new Set(visited).add(node.partyId);
    const children = nodes.filter(
      (child) =>
        child.partyId !== rootPartyId &&
        !nextVisited.has(child.partyId) &&
        getParentId(child) === node.partyId
    );
    const items: Array<{
      key: string;
      content: ReactNode;
      highlight?: boolean;
      line?: MaintenanceTreeLine;
      nodeId?: string;
    }> = [
      ...(getBranchStart?.(node.partyId) ?? []),
      ...children.map((child) => ({
        key: child.partyId,
        nodeId: child.partyId,
        content: (
          <>
            {renderRow(child)}
            {renderBranches(child, nextVisited)}
          </>
        ),
      })),
      ...(node.partyId === rootPartyId && rootFooter
        ? [
            {
              key: 'root-footer',
              content: rootFooter,
              line: 'dashed' as const,
            },
          ]
        : []),
    ];
    if (items.length === 0) return null;

    // The spine starts beneath the parent's leading mark: its medallion, or its radio.
    return (
      <ul
        className={cn(
          'eb-mt-2 eb-space-y-2',
          node.disabled ? 'eb-ml-[1.625rem]' : 'eb-ml-5'
        )}
      >
        {items.map((item, index) => (
          <MaintenanceTreeBranch
            key={item.key}
            isLast={index === items.length - 1}
            line={item.line}
            nextLine={items[index + 1]?.line}
            highlight={item.highlight ? 'primary' : undefined}
            data-ownership-picker-node={item.nodeId}
          >
            {item.content}
          </MaintenanceTreeBranch>
        ))}
      </ul>
    );
  };

  return (
    <RadioGroup
      aria-label={label}
      value={value}
      disabled={disabled}
      onValueChange={onValueChange}
      className={cn('eb-block', className)}
    >
      {root ? (
        <div data-ownership-picker-node={root.partyId}>
          {renderRow(root)}
          {renderBranches(root, new Set())}
        </div>
      ) : null}
    </RadioGroup>
  );
}
