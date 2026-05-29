import { useState } from 'react';
import { Building, Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EntityComboboxProps {
  /** Current value of the company name */
  value: string;
  /** Callback when the value changes */
  onChange: (value: string) => void;
  /** Array of existing entity names to suggest */
  existingEntities: string[];
  /** Placeholder text */
  placeholder?: string;
  /** HTML id for the input */
  id?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
  /** CSS class name */
  className?: string;
}

/**
 * EntityCombobox - A combobox for selecting existing entities or entering new ones
 *
 * This component allows users to:
 * 1. See a dropdown of previously entered entities
 * 2. Filter entities by typing
 * 3. Select an existing entity from the list
 * 4. Enter a completely new entity name
 */
export function EntityCombobox({
  value,
  onChange,
  existingEntities,
  placeholder = 'Enter company name',
  id,
  disabled = false,
  className,
}: EntityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Use searchValue when popover is open, otherwise use the actual value
  const activeSearchValue = open ? searchValue : value;

  // Filter entities based on current search input
  const filteredEntities = existingEntities.filter((entity) =>
    entity.toLowerCase().includes(activeSearchValue.toLowerCase())
  );

  // Check if current value matches an existing entity (case-insensitive)
  const isExistingEntity = existingEntities.some(
    (entity) => entity.toLowerCase() === value.toLowerCase()
  );

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setSearchValue('');
    setOpen(false);
  };

  const handleInputChange = (inputValue: string) => {
    setSearchValue(inputValue);
  };

  // Reset search when popover opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setSearchValue(value);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            'eb-h-10 eb-w-full eb-justify-between eb-bg-card',
            !value && 'eb-text-muted-foreground',
            className
          )}
          id={id}
          disabled={disabled}
        >
          <div className="eb-flex eb-flex-1 eb-items-center eb-gap-2 eb-text-left">
            {value ? (
              <>
                {isExistingEntity ? (
                  <Building className="eb-h-4 eb-w-4 eb-text-green-600" />
                ) : (
                  <Building className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                )}
                <span className="eb-truncate">{value}</span>
                {isExistingEntity && (
                  <span className="eb-rounded eb-bg-green-50 eb-px-1 eb-py-0.5 eb-text-xs eb-text-green-600">
                    existing
                  </span>
                )}
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="eb-ml-2 eb-h-4 eb-w-4 eb-shrink-0 eb-opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="eb-w-[--radix-popover-trigger-width] eb-p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search companies..."
            value={searchValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {filteredEntities.length > 0 ? (
              <CommandGroup heading="Previously added companies">
                {filteredEntities.map((entity) => (
                  <CommandItem
                    key={entity}
                    value={entity}
                    onSelect={() => handleSelect(entity)}
                    className="eb-cursor-pointer"
                  >
                    <Building className="eb-mr-2 eb-h-4 eb-w-4 eb-text-green-600" />
                    <span className="eb-flex-1">{entity}</span>
                    <Check
                      className={cn(
                        'eb-ml-2 eb-h-4 eb-w-4',
                        value.toLowerCase() === entity.toLowerCase()
                          ? 'eb-opacity-100'
                          : 'eb-opacity-0'
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : searchValue ? (
              <CommandGroup>
                <CommandItem
                  value={searchValue}
                  onSelect={() => handleSelect(searchValue)}
                  className="eb-cursor-pointer"
                >
                  <div className="eb-flex eb-w-full eb-flex-col eb-items-center eb-gap-2 eb-py-2">
                    <Building className="eb-h-8 eb-w-8 eb-text-muted-foreground" />
                    <div className="eb-text-center">
                      <div className="eb-font-medium">
                        No existing companies found
                      </div>
                      <div className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                        &quot;{searchValue}&quot; will be added as a new company
                      </div>
                    </div>
                  </div>
                </CommandItem>
              </CommandGroup>
            ) : (
              <CommandEmpty>
                <div className="eb-py-4 eb-text-center">
                  <div className="eb-text-sm eb-text-muted-foreground">
                    Type to search existing companies or add a new one
                  </div>
                </div>
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
