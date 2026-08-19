import { useState } from 'react';
import { Building, Check, ChevronsUpDown, X } from 'lucide-react';

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
  /**
   * Callback fired when the user commits a choice from the dropdown (an
   * existing entity or the "add new" option). Hosts can use this to act on the
   * selection immediately (e.g. add it to a list) instead of requiring a
   * separate button click.
   */
  onSelect?: (value: string) => void;
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
  onSelect,
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

  // Whether the typed value already matches an existing entity exactly. When
  // it doesn't, we always offer an "add new" option — even alongside partial
  // matches — so a brand-new business can be added regardless of whether its
  // name happens to overlap an existing one.
  const trimmedSearch = searchValue.trim();
  const searchMatchesExistingExactly = existingEntities.some(
    (entity) => entity.toLowerCase() === trimmedSearch.toLowerCase()
  );
  const canAddNew = trimmedSearch.length > 0 && !searchMatchesExistingExactly;

  // Check if current value matches an existing entity (case-insensitive)
  const isExistingEntity = existingEntities.some(
    (entity) => entity.toLowerCase() === value.toLowerCase()
  );

  const handleSelect = (selectedValue: string) => {
    // Commit the chosen value, then notify the host so it can act on the
    // selection immediately (e.g. add it to the chain). The input is cleared
    // for the next entry.
    onChange(selectedValue);
    setSearchValue('');
    setOpen(false);
    onSelect?.(selectedValue);
  };

  const handleInputChange = (inputValue: string) => {
    setSearchValue(inputValue);
    // Commit the typed value live so it is immediately usable by the host
    // (e.g. an external "Add" button) without requiring an explicit select.
    onChange(inputValue);
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
          // Safari (macOS) skips native <button> elements in Tab order unless
          // "Full Keyboard Access" is on; an explicit tabIndex is honored
          // regardless. Disabled buttons stay unfocusable because the
          // `disabled` attribute overrides tabIndex.
          tabIndex={0}
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
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              className="eb-ml-1 eb-rounded-sm eb-p-0.5 eb-text-muted-foreground hover:eb-bg-accent hover:eb-text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange('');
                setOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  e.preventDefault();
                  onChange('');
                  setOpen(false);
                }
              }}
              aria-label="Clear selection"
            >
              <X className="eb-h-3 eb-w-3" />
            </span>
          )}
          <ChevronsUpDown className="eb-ml-1 eb-h-4 eb-w-4 eb-shrink-0 eb-opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="eb-w-[--radix-popover-trigger-width] eb-p-0"
        align="start"
        // Prefer opening upward so the suggestion list doesn't overlay the
        // action buttons rendered directly below the combobox (e.g. "Yes/No -
        // Continue Chain"); overlaying them made clicks get swallowed so
        // adding a company appeared to fail. Collision avoidance stays ON so
        // Radix flips it back down (instead of rendering off-screen) when
        // there isn't enough room above.
        side="top"
        sideOffset={4}
        collisionPadding={8}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search companies..."
            value={searchValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {filteredEntities.length > 0 && (
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
            )}
            {canAddNew && (
              <CommandGroup
                heading={filteredEntities.length > 0 ? 'Add new' : undefined}
              >
                <CommandItem
                  value={`__add_new__:${trimmedSearch}`}
                  onSelect={() => handleSelect(trimmedSearch)}
                  className="eb-cursor-pointer"
                >
                  <Building className="eb-mr-2 eb-h-4 eb-w-4 eb-text-muted-foreground" />
                  <span className="eb-flex-1">
                    Add &quot;{trimmedSearch}&quot; as a new company
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
            {filteredEntities.length === 0 && !canAddNew && (
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
