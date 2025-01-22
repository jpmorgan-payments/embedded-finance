import { useMemo, useState } from 'react';
import { CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
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
  field: any; // Replace with proper form field type
  form: any; // Replace with proper form type
}

export const IndustryTypeSelect = ({
  field,
  form,
}: IndustryTypeSelectProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
  }, [searchQuery, naicsCodes]);

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
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              'eb-w-full eb-max-w-[400px] eb-justify-between eb-font-normal',
              !field.value && 'eb-text-muted-foreground'
            )}
          >
            {field.value ? (
              <div className="eb-flex eb-w-[calc(100%-1rem)]">
                <span className="eb-overflow-hidden eb-text-ellipsis">
                  [{form.getValues('industryCategory')}] {field.value}
                </span>
                <span className="eb-pl-2 eb-text-muted-foreground">
                  {
                    naicsCodes.find((code) => code.description === field.value)
                      ?.id
                  }
                </span>
              </div>
            ) : (
              'Select industry type'
            )}
            <CaretSortIcon className="eb-ml-2 eb-h-4 eb-w-4 eb-shrink-0 eb-opacity-50" />
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
            placeholder="Search industry type..."
            className="eb-h-9"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList className="eb-max-h-[300px]">
            <CommandEmpty>No results found</CommandEmpty>
            <div className="eb-relative" style={{ height: 300 }}>
              <List
                height={300}
                itemCount={items.length}
                itemSize={(index: number) => {
                  return items[index].type === 'header' ? 36 : 60;
                }}
                width="100%"
                className="eb-scrollbar-none eb-overflow-y-auto"
              >
                {({ index, style }) => {
                  const item = items[index];

                  if (item.type === 'header') {
                    return (
                      <div
                        style={{
                          ...style,
                          padding: '8px',
                          backgroundColor: 'rgb(243 244 246)',
                        }}
                        className="eb-text-sm eb-font-medium eb-text-muted-foreground"
                      >
                        {item.category}
                      </div>
                    );
                  }

                  return (
                    <CommandItem
                      key={item.id}
                      value={`${item.category} ${item.description} ${item.code}`}
                      onSelect={() => {
                        field.onChange(item.description);
                        form.setValue('industryCategory', item.category);
                        setOpen(false);
                      }}
                      className="eb-text-sm"
                      style={{
                        ...style,
                        padding: '8px',
                      }}
                    >
                      <span className="eb-flex eb-w-full eb-items-center eb-justify-between">
                        [{item.category}] {item.description}
                        <span className="eb-pl-2 eb-text-muted-foreground">
                          {item.code}
                        </span>
                      </span>
                      <CheckIcon
                        className={cn(
                          'eb-ml-2 eb-h-4 eb-w-4',
                          field.value === item.description
                            ? 'eb-opacity-100'
                            : 'eb-opacity-0'
                        )}
                      />
                    </CommandItem>
                  );
                }}
              </List>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
