'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  MapPin,
  RotateCcw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ContentTokenChangeItem = {
  fullKey: string;
  namespace: string;
  path: string;
  value: string;
  defaultValue?: string;
  isOnPage: boolean;
};

export type ContentTokenNamespaceGroup = {
  namespace: string;
  label: string;
  color: string;
  items: ContentTokenChangeItem[];
};

const NAMESPACE_LABELS: Record<string, string> = {
  'make-payment': 'Make payment',
  'linked-accounts': 'Linked accounts',
  accounts: 'Accounts',
  recipients: 'Recipients',
  transactions: 'Transactions',
  onboarding: 'Onboarding',
  'onboarding-overview': 'Onboarding overview',
  common: 'Common',
  'bank-account-form': 'Bank account form',
  validation: 'Validation',
  'client-details': 'Client details',
};

function namespaceLabel(namespace: string): string {
  return (
    NAMESPACE_LABELS[namespace] ||
    namespace
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  );
}

/** Pure helper — group flat `namespace:path` edits for the overview UI. */
export function groupEditedContentTokens(
  editedTokens: Record<string, string>,
  onPageKeys: Set<string> = new Set(),
  getDefaultValue: (fullKey: string) => string | undefined = () => undefined,
  namespaceColors: Record<string, string> = {}
): ContentTokenNamespaceGroup[] {
  const byNs = new Map<string, ContentTokenChangeItem[]>();
  for (const [fullKey, value] of Object.entries(editedTokens)) {
    const colon = fullKey.indexOf(':');
    const namespace =
      colon >= 0 ? fullKey.slice(0, colon) : fullKey.split('.')[0] || 'other';
    const path =
      colon >= 0
        ? fullKey.slice(colon + 1)
        : fullKey.split('.').slice(1).join('.');
    const item: ContentTokenChangeItem = {
      fullKey,
      namespace,
      path: path || fullKey,
      value,
      defaultValue: getDefaultValue(fullKey),
      isOnPage: onPageKeys.has(fullKey),
    };
    const list = byNs.get(namespace) ?? [];
    list.push(item);
    byNs.set(namespace, list);
  }

  return Array.from(byNs.entries())
    .map(([namespace, items]) => ({
      namespace,
      label: namespaceLabel(namespace),
      color: namespaceColors[namespace] || '#6b7280',
      items: items.sort((a, b) => a.path.localeCompare(b.path)),
    }))
    .sort(
      (a, b) =>
        b.items.length - a.items.length || a.label.localeCompare(b.label)
    );
}

type ContentTokenOverridePreviewProps = {
  groups: ContentTokenNamespaceGroup[];
  /** Show page/other badges (content-token drawer only). */
  showPageBadges?: boolean;
  /** Interactive focus (content-token drawer). */
  onFocusToken?: (fullKey: string) => void;
  /** Interactive revert (content-token drawer). */
  onRevertToken?: (fullKey: string) => void;
  className?: string;
};

/**
 * Shared amber “overridden copy” preview — same visual language as Master Mode
 * content category cards. Full paths/values (no truncation).
 */
export function ContentTokenOverridePreview({
  groups,
  showPageBadges = false,
  onFocusToken,
  onRevertToken,
  className,
}: ContentTokenOverridePreviewProps) {
  if (groups.length === 0) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {groups.map((group) => (
        <div
          key={group.namespace}
          className="rounded-lg border border-amber-200/80 bg-white/80 px-3 py-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ backgroundColor: group.color }}
              />
              <span className="text-xs font-semibold text-gray-800">
                {group.label}
              </span>
              <span className="font-mono text-[10px] text-gray-400">
                {group.namespace}
              </span>
            </div>
            <span className="text-[11px] font-medium text-amber-700">
              {group.items.length}
            </span>
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {group.items.map((item) => {
              const body = (
                <>
                  <div className="flex flex-wrap items-start gap-1.5">
                    <code className="break-all font-mono text-[11px] text-gray-500">
                      {item.path}
                    </code>
                    {showPageBadges &&
                      (item.isOnPage ? (
                        <span className="inline-flex flex-shrink-0 items-center gap-0.5 rounded bg-emerald-50 px-1 py-0.5 text-[9px] font-medium text-emerald-700">
                          <MapPin className="h-2.5 w-2.5" />
                          page
                        </span>
                      ) : (
                        <span className="flex-shrink-0 rounded bg-gray-100 px-1 py-0.5 text-[9px] font-medium text-gray-500">
                          other
                        </span>
                      ))}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-xs font-medium text-gray-900">
                    “{item.value}”
                  </p>
                  {item.defaultValue && item.defaultValue !== item.value && (
                    <p className="whitespace-pre-wrap break-words text-[10px] text-gray-400 line-through">
                      {item.defaultValue}
                    </p>
                  )}
                </>
              );

              return (
                <li
                  key={item.fullKey}
                  className="group flex items-start gap-2 border-t border-amber-100/80 pt-1.5 first:border-t-0 first:pt-0"
                >
                  {onFocusToken ? (
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onFocusToken(item.fullKey)}
                      title={
                        item.isOnPage
                          ? 'Jump to token in list'
                          : 'Changed on another screen (not on this page)'
                      }
                    >
                      {body}
                    </button>
                  ) : (
                    <div className="min-w-0 flex-1">{body}</div>
                  )}
                  {onRevertToken && (
                    <button
                      type="button"
                      onClick={() => onRevertToken(item.fullKey)}
                      className="mt-0.5 rounded p-1 text-gray-400 opacity-70 hover:bg-amber-50 hover:text-gray-700 group-hover:opacity-100"
                      title="Revert this token"
                    >
                      <RotateCcw className="h-3 w-3" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

interface ContentTokenChangesOverviewProps {
  editedTokens: Record<string, string>;
  /** Tokens currently known from DOM scan (for on-page status + focus). */
  onPageKeys: Set<string>;
  namespaceColors: Record<string, string>;
  getDefaultValue: (fullKey: string) => string | undefined;
  onFocusToken: (fullKey: string) => void;
  onRevertToken: (fullKey: string) => void;
  onRevertAll: () => void;
  /** When true, main list shows only changed tokens. */
  showChangedOnly: boolean;
  onShowChangedOnlyChange: (next: boolean) => void;
}

export function ContentTokenChangesOverview({
  editedTokens,
  onPageKeys,
  namespaceColors,
  getDefaultValue,
  onFocusToken,
  onRevertToken,
  onRevertAll,
  showChangedOnly,
  onShowChangedOnlyChange,
}: ContentTokenChangesOverviewProps) {
  const changeCount = Object.keys(editedTokens).length;
  const [expanded, setExpanded] = useState(true);

  const groups = useMemo(
    () =>
      groupEditedContentTokens(
        editedTokens,
        onPageKeys,
        getDefaultValue,
        namespaceColors
      ),
    [editedTokens, getDefaultValue, namespaceColors, onPageKeys]
  );

  if (changeCount === 0) {
    return (
      <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Layers className="h-3.5 w-3.5 text-gray-400" />
          <span>
            No content overrides yet — edits from any screen show up here.
          </span>
        </div>
      </div>
    );
  }

  const onPageCount = groups.reduce(
    (sum, g) => sum + g.items.filter((i) => i.isOnPage).length,
    0
  );
  const otherCount = changeCount - onPageCount;

  return (
    <div className="flex-shrink-0 border-b border-amber-200 bg-gradient-to-br from-amber-50 to-white">
      <div className="flex items-center gap-2 px-4 py-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
          )}
          <Layers className="h-3.5 w-3.5 flex-shrink-0 text-amber-700" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-900">
              All changes{' '}
              <span className="inline-flex items-center rounded-full bg-amber-500 px-2 py-0.5 text-[11px] font-medium text-white">
                {changeCount} overridden
              </span>
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {groups.length} screen{groups.length === 1 ? '' : 's'}
              {' · '}
              {onPageCount > 0
                ? `${onPageCount} on this page`
                : 'None on this page'}
              {otherCount > 0 ? ` · ${otherCount} from other screens` : ''}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onShowChangedOnlyChange(!showChangedOnly)}
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-medium transition',
            showChangedOnly
              ? 'bg-amber-500 text-white'
              : 'bg-white text-amber-800 ring-1 ring-amber-200 hover:bg-amber-50'
          )}
          title="Filter the list below to changed tokens only"
        >
          {showChangedOnly ? 'Changed only' : 'Filter list'}
        </button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-gray-600"
          onClick={onRevertAll}
          title="Revert all content token overrides"
        >
          <RotateCcw className="mr-1 h-3 w-3" />
          Clear
        </Button>
      </div>

      {expanded && (
        <div className="max-h-56 overflow-y-auto overscroll-contain px-3 pb-3">
          <ContentTokenOverridePreview
            groups={groups}
            showPageBadges
            onFocusToken={onFocusToken}
            onRevertToken={onRevertToken}
          />
        </div>
      )}
    </div>
  );
}
