import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { Check, ChevronsUpDown, StarIcon } from 'lucide-react';
import { ControllerRenderProps } from 'react-hook-form';
import { VariableSizeList as List } from 'react-window';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { FormControl } from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import naicsCodes from './naics-codes.json';

export interface NAICSCode {
  id: string;
  description: string;
  sectorDescription: string;
}

/** Section identifier — used to suffix React keys so the pinned group's
 *  rendered rows never collide with rows in the catalog section, and to
 *  let the list rows render section-specific styling. */
type Section = 'priority' | 'priority-empty' | 'catalog';

type RowItem =
  | {
      id: string;
      type: 'header';
      section: Section;
      label: string;
      /** Icon to render alongside the header label. */
      withIcon?: 'star';
    }
  | {
      id: string;
      type: 'item';
      section: Section;
      code: string;
      description: string;
      category: string;
    }
  | {
      id: string;
      type: 'empty';
      section: Section;
      label: string;
    };

interface IndustryTypeSelectProps {
  field: ControllerRenderProps<any, string>;
  placeholder?: string;
  onChange: (...value: any[]) => void;
  /**
   * Optional host-curated NAICS codes pinned at the top of the list as a
   * "Suggested for your platform" group. Unknown codes are silently dropped
   * (with a `console.warn` in development). Order is preserved.
   *
   * Users can still pick any code from the full catalog beneath the pinned
   * group — this prop never restricts the selectable set.
   */
  priorityCodes?: readonly string[];
}

/** O(1) lookup of catalog entries by NAICS code. Built once at module load. */
const naicsCodesById = new Map<string, NAICSCode>(
  (naicsCodes as NAICSCode[]).map((code) => [code.id, code])
);

/** Resolve priority codes to full catalog entries, preserving host order and
 *  dropping unknown codes. Logs unknowns once per render in development. */
const resolvePriorityCodes = (
  priorityCodes: readonly string[] | undefined
): NAICSCode[] => {
  if (!priorityCodes?.length) return [];
  const resolved: NAICSCode[] = [];
  const unknown: string[] = [];
  for (const code of priorityCodes) {
    const entry = naicsCodesById.get(code);
    if (entry) {
      resolved.push(entry);
    } else {
      unknown.push(code);
    }
  }
  if (unknown.length > 0 && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn(
      `[IndustryTypeSelect] Ignoring unknown priorityCodes: ${unknown.join(', ')}`
    );
  }
  return resolved;
};

export const IndustryTypeSelect = ({
  field,
  placeholder,
  onChange,
  priorityCodes,
}: IndustryTypeSelectProps) => {
  const { tString } = useTranslationWithTokens(['onboarding-overview']);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { onBlur: _onBlur, ...fieldWithoutBlur } = field;

  // Track internal open state to prevent re-renders during closing animation
  const [internalOpen, setInternalOpen] = useState(false);

  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerWidth(entry.contentRect.width);
        }
      });
      observer.observe(containerRef.current);
      return () => {
        observer.disconnect();
      };
    }
    return undefined;
  }, []);

  // When dropdown opens or closes, synchronize internalOpen state
  // with a delay for close to prevent flashing
  useEffect(() => {
    if (open) {
      setInternalOpen(true);
    } else {
      // When closing, maintain internalOpen true during transition
      // to preserve scroll position
      const timeout = setTimeout(() => {
        setInternalOpen(false);
        // Reset search query after fully closed
        setSearchQuery('');
      }, 300); // Match Radix UI animation duration
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [open]);

  // Resolve once per priorityCodes change.
  const resolvedPriorityCodes = useMemo(
    () => resolvePriorityCodes(priorityCodes),
    [priorityCodes]
  );
  const hasPriorityGroup = resolvedPriorityCodes.length > 0;

  // Lookup set used to de-duplicate the catalog rows when a pinned group is
  // present (a priority code should not appear twice in the same listbox).
  const priorityCodeSet = useMemo(
    () => new Set(resolvedPriorityCodes.map((code) => code.id)),
    [resolvedPriorityCodes]
  );

  // Filter helper applied to both sections so search behaves consistently.
  const matchesQuery = (code: NAICSCode, query: string) =>
    code.description.toLowerCase().includes(query) ||
    code.id.includes(query) ||
    code.sectorDescription.toLowerCase().includes(query);

  // Catalog rows (search-filtered). When a priority group is present we
  // exclude its codes from the catalog section to avoid visual duplicates.
  const filteredCatalogCodes = useMemo(() => {
    const base = hasPriorityGroup
      ? (naicsCodes as NAICSCode[]).filter(
          (code) => !priorityCodeSet.has(code.id)
        )
      : (naicsCodes as NAICSCode[]);
    if (!searchQuery) return base;
    const query = searchQuery.toLowerCase();
    return base.filter((code) => matchesQuery(code, query));
  }, [hasPriorityGroup, priorityCodeSet, searchQuery]);

  // Pinned rows (search-filtered). Preserves host-supplied order.
  const filteredPriorityCodes = useMemo(() => {
    if (!hasPriorityGroup) return [];
    if (!searchQuery) return resolvedPriorityCodes;
    const query = searchQuery.toLowerCase();
    return resolvedPriorityCodes.filter((code) => matchesQuery(code, query));
  }, [hasPriorityGroup, resolvedPriorityCodes, searchQuery]);

  // Build the flat row list rendered by react-window. The pinned section
  // (if any) is always rendered first; when search yields zero priority
  // matches we still render the header + a quiet empty-state row so the
  // user does not lose spatial context.
  const items = useMemo<RowItem[]>(() => {
    const rows: RowItem[] = [];

    if (hasPriorityGroup) {
      rows.push({
        id: 'priority-header',
        type: 'header',
        section: 'priority',
        label: tString(
          'industrySelect.priorityHeader',
          'Suggested for your platform'
        ),
        withIcon: 'star',
      });
      if (filteredPriorityCodes.length === 0) {
        rows.push({
          id: 'priority-empty',
          type: 'empty',
          section: 'priority-empty',
          label: tString(
            'industrySelect.priorityNoMatches',
            'No suggestions match your search'
          ),
        });
      } else {
        for (const code of filteredPriorityCodes) {
          rows.push({
            id: `priority-${code.id}`,
            type: 'item',
            section: 'priority',
            code: code.id,
            description: code.description,
            category: code.sectorDescription,
          });
        }
      }

      // "All industries" header above the catalog section, but only when
      // the catalog has rows to show — keeps the empty state clean.
      if (filteredCatalogCodes.length > 0) {
        rows.push({
          id: 'all-industries-header',
          type: 'header',
          section: 'catalog',
          label: tString(
            'industrySelect.allIndustriesHeader',
            'All industries'
          ),
        });
      }
    }

    // Catalog rows grouped by sector (existing behavior).
    let currentSector: string | null = null;
    for (const code of filteredCatalogCodes) {
      if (code.sectorDescription !== currentSector) {
        currentSector = code.sectorDescription;
        rows.push({
          id: `sector-${currentSector}`,
          type: 'header',
          section: 'catalog',
          label: currentSector,
        });
      }
      rows.push({
        id: `catalog-${code.id}`,
        type: 'item',
        section: 'catalog',
        code: code.id,
        description: code.description,
        category: code.sectorDescription,
      });
    }

    return rows;
  }, [hasPriorityGroup, filteredPriorityCodes, filteredCatalogCodes, tString]);

  // Calculate item heights for variable sized list
  const getItemHeight = (index: number) => {
    const lineHeight = 32;
    const additionalHeight = 18;
    if (containerWidth === 0) return lineHeight;

    const item = items[index];
    if (!item) return lineHeight;

    if (item.type === 'header' || item.type === 'empty') {
      return 36;
    }

    const charsPerLine = Math.floor((containerWidth - 120) / 7);
    const descriptionLength = item.description?.length ?? 0;
    const numLines = Math.ceil(
      (descriptionLength + item.category.length) / charsPerLine
    );
    return lineHeight + (numLines - 1) * additionalHeight;
  };

  // Find the index of the selected item in the rendered list. Prefer the
  // pinned occurrence so the highlight matches what the user sees first.
  const selectedItemIndex = useMemo(() => {
    if (!field.value) return -1;
    return items.findIndex(
      (item) => item.type === 'item' && item.code === field.value
    );
  }, [items, field.value]);

  // Calculate the scroll position to center the selected item
  // with adjustment factor to correct vertical alignment
  const initialScrollOffset = useMemo(() => {
    if (selectedItemIndex === -1) return 0;

    let offsetToSelectedItem = 0;
    for (let i = 0; i < selectedItemIndex; i += 1) {
      offsetToSelectedItem += getItemHeight(i);
    }

    // Center the item in the viewport (300 is list height)
    const listHeight = 300;
    const itemHeight = getItemHeight(selectedItemIndex);

    // Apply a slight vertical adjustment to ensure proper centering
    // The 0.9 factor pushes the item slightly higher in the viewport
    const centeredOffset = Math.max(
      0,
      offsetToSelectedItem - (listHeight - itemHeight) * 0.5
    );

    return centeredOffset;
  }, [selectedItemIndex]);

  const selectedCatalogEntry = field.value
    ? naicsCodesById.get(field.value)
    : undefined;

  return (
    <div ref={containerRef} className="eb-w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="input"
              size="input"
              role="combobox"
              // Safari (macOS) skips native <button> elements in Tab order
              // unless "Full Keyboard Access" is on; an explicit tabIndex is
              // honored regardless. Disabled buttons stay unfocusable because
              // the `disabled` attribute overrides tabIndex.
              tabIndex={0}
              className={cn(
                'eb-w-full eb-justify-between eb-font-normal',
                !field.value && 'eb-text-muted-foreground'
              )}
              onKeyDown={(e) => {
                if (e.key === 'Down' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  setOpen(true);
                }
              }}
              {...fieldWithoutBlur}
            >
              {field.value ? (
                <div className="eb-flex eb-w-[calc(100%-2rem)]">
                  <span>[{field.value}]</span>
                  <span className="eb-overflow-hidden eb-text-ellipsis eb-pl-1 eb-text-muted-foreground">
                    {selectedCatalogEntry?.sectorDescription}
                  </span>
                  <span className="eb-overflow-hidden eb-text-ellipsis eb-pl-2">
                    {selectedCatalogEntry?.description}
                  </span>
                </div>
              ) : (
                (placeholder ??
                tString('industrySelect.placeholder', 'Select industry type'))
              )}
              <ChevronsUpDown className="eb-ml-2 eb-h-4 eb-w-4 eb-shrink-0 eb-opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="eb-w-[var(--radix-popover-trigger-width)] eb-p-0"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={
                placeholder ??
                tString(
                  'industrySelect.searchPlaceholder',
                  'Search industry type...'
                )
              }
              className="eb-h-9"
              value={searchQuery}
              onValueChange={setSearchQuery}
              autoFocus
            />
            <CommandList className="eb-max-h-[300px]">
              <CommandEmpty>
                {tString('industrySelect.noResults', 'No results found')}
              </CommandEmpty>
              <div className="eb-relative" style={{ height: 300 }}>
                {/* Only render the list when needed - use internalOpen to maintain during animations */}
                {internalOpen && items.length > 0 && (
                  <List
                    key={searchQuery} // Only re-render when search changes, not when open changes
                    height={300}
                    itemCount={items.length}
                    itemSize={getItemHeight}
                    width="100%"
                    className="eb-scrollbar-none eb-overflow-y-auto"
                    overscanCount={10}
                    initialScrollOffset={
                      searchQuery === '' ? initialScrollOffset : 0
                    }
                  >
                    {({ index, style }) => {
                      const item = items[index];
                      if (!item) return null;

                      if (item.type === 'header') {
                        return (
                          <div
                            key={item.id}
                            style={{ ...style, padding: '8px' }}
                            className={cn(
                              'eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-semibold',
                              item.section === 'priority'
                                ? 'eb-text-primary'
                                : 'eb-text-muted-foreground'
                            )}
                            data-testid={
                              item.section === 'priority'
                                ? 'industry-select-priority-header'
                                : undefined
                            }
                          >
                            {item.withIcon === 'star' && (
                              <StarIcon
                                className="eb-size-3.5 eb-shrink-0 eb-fill-primary"
                                aria-hidden="true"
                              />
                            )}
                            {item.label}
                          </div>
                        );
                      }

                      if (item.type === 'empty') {
                        return (
                          <div
                            key={item.id}
                            style={{ ...style, padding: '8px' }}
                            className="eb-px-2 eb-text-xs eb-italic eb-text-muted-foreground"
                          >
                            {item.label}
                          </div>
                        );
                      }

                      const isPriority = item.section === 'priority';
                      const isSelected = field.value === item.code;
                      return (
                        <CommandItem
                          key={item.id}
                          value={item.id}
                          onSelect={() => {
                            onChange(item.code);
                            setOpen(false);
                          }}
                          className={cn(
                            'eb-cursor-pointer eb-text-xs sm:eb-text-sm',
                            isPriority && 'eb-bg-primary/5',
                            isSelected && 'eb-bg-accent'
                          )}
                          style={{ ...style, padding: '8px' }}
                          data-testid={
                            isPriority
                              ? `industry-select-priority-item-${item.code}`
                              : undefined
                          }
                        >
                          <Check
                            className={cn(
                              'eb-mr-2 eb-h-4 eb-w-4',
                              isSelected ? 'eb-opacity-100' : 'eb-opacity-0'
                            )}
                          />
                          <span className="eb-flex eb-w-full eb-items-center eb-justify-between">
                            [{item.category}] {item.description}
                            <span className="eb-pl-2 eb-text-muted-foreground">
                              {item.code}
                            </span>
                          </span>
                        </CommandItem>
                      );
                    }}
                  </List>
                )}
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
