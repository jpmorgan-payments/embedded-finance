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
}

export const IndustryTypeSelect = ({
  field,
  placeholder,
}: IndustryTypeSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { onBlur, onChange, ...fieldWithoutBlur } = field;

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
    return () => {};
  }, []);

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
            />
            <CommandList className="eb-max-h-[300px]">
              <CommandEmpty>No results found</CommandEmpty>
              <div className="eb-relative" style={{ height: 300 }}>
                <List
                  key={searchQuery}
                  height={300}
                  itemCount={items.length}
                  itemSize={(index: number) => {
                    const lineHeight = 32;
                    const additionalHeight = 18;
                    if (containerWidth === 0) return lineHeight;
                    const charsPerLine = Math.floor((containerWidth - 120) / 7);
                    const numLines = Math.ceil(
                      ((items[index].description?.length ?? 0) +
                        items[index].category.length) /
                        charsPerLine
                    );
                    return items[index].type === 'header'
                      ? 36
                      : lineHeight + (numLines - 1) * additionalHeight;
                  }}
                  width="100%"
                  className="eb-scrollbar-none eb-overflow-y-auto"
                >
                  {({ index, style }) => {
                    const item = items[index];

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

                    return (
                      <CommandItem
                        key={item.id}
                        value={item.code}
                        onSelect={(value) => {
                          onChange(value);
                          onBlur();
                          setOpen(false);
                        }}
                        className="eb-cursor-pointer eb-text-xs sm:eb-text-sm"
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
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
