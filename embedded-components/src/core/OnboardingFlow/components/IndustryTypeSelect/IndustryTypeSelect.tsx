import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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

interface IndustryTypeSelectProps {
  field: ControllerRenderProps<any, string>;
  placeholder?: string;
  onChange: (...value: any[]) => void;
}

export const IndustryTypeSelect = ({
  field,
  placeholder,
  onChange,
}: IndustryTypeSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { onBlur, ...fieldWithoutBlur } = field;

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

  // Memoize the filtered NAICS codes
  const filteredCodes = useMemo(() => {
    if (!searchQuery) {
      return naicsCodes;
    }
    const query = searchQuery.toLowerCase();
    return naicsCodes.filter(
      (code) =>
        code.description.toLowerCase().includes(query) ||
        code.id.includes(query) ||
        code.sectorDescription.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Group codes by category for better organization
  const items = useMemo(() => {
    const groupedItems: Array<{
      id: string;
      type: 'header' | 'item';
      category: string;
      description?: string;
      code?: string;
    }> = [];

    filteredCodes.reduce(
      (acc, code) => {
        const category = code.sectorDescription;
        if (!acc[category]) {
          acc[category] = [];
          // Add header
          groupedItems.push({
            id: `header-${category}`,
            type: 'header',
            category,
          });
        }
        // Add item
        groupedItems.push({
          id: code.id,
          type: 'item',
          category,
          description: code.description,
          code: code.id,
        });
        acc[category].push(code);
        return acc;
      },
      {} as Record<string, NAICSCode[]>
    );

    return groupedItems;
  }, [filteredCodes]);

  // Calculate item heights for variable sized list
  const getItemHeight = (index: number) => {
    const lineHeight = 32;
    const additionalHeight = 18;
    if (containerWidth === 0) return lineHeight;

    const item = items[index];
    if (!item) return lineHeight;

    if (item.type === 'header') {
      return 36; // Header height
    }

    const charsPerLine = Math.floor((containerWidth - 120) / 7);
    const descriptionLength = item.description?.length ?? 0;
    const numLines = Math.ceil(
      (descriptionLength + item.category.length) / charsPerLine
    );
    return lineHeight + (numLines - 1) * additionalHeight;
  };

  // Find the index of the selected item in the filtered list
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

  return (
    <div ref={containerRef} className="eb-w-full">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant="input"
              size="input"
              role="combobox"
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
                    {
                      naicsCodes.find((code) => code.id === field.value)
                        ?.sectorDescription
                    }
                  </span>
                  <span className="eb-overflow-hidden eb-text-ellipsis eb-pl-2">
                    {
                      naicsCodes.find((code) => code.id === field.value)
                        ?.description
                    }
                  </span>
                </div>
              ) : (
                (placeholder ?? 'Select industry type')
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
              placeholder={placeholder ?? 'Search industry type...'}
              className="eb-h-9"
              value={searchQuery}
              onValueChange={setSearchQuery}
              autoFocus
            />
            <CommandList className="eb-max-h-[300px]">
              <CommandEmpty>No results found</CommandEmpty>
              <div className="eb-relative" style={{ height: 300 }}>
                {/* Only render the list when needed - use internalOpen to maintain during animations */}
                {internalOpen && (
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
                            style={{
                              ...style,
                              padding: '8px',
                            }}
                            className="eb-text-xs eb-font-semibold eb-text-muted-foreground"
                          >
                            {item.category}
                          </div>
                        );
                      }

                      // Item rendering
                      return (
                        <CommandItem
                          key={item.id}
                          value={item.code}
                          onSelect={(value) => {
                            onChange(value);
                            setOpen(false);
                          }}
                          className={cn(
                            'eb-cursor-pointer eb-text-xs sm:eb-text-sm',
                            field.value === item.code && 'eb-bg-accent'
                          )}
                          style={{
                            ...style,
                            padding: '8px',
                          }}
                        >
                          <Check
                            className={cn(
                              'eb-mr-2 eb-h-4 eb-w-4',
                              field.value === item.code
                                ? 'eb-opacity-100'
                                : 'eb-opacity-0'
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
