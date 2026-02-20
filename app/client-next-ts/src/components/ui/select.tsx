'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SelectContextType {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const SelectContext = React.createContext<SelectContextType | null>(null);

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({ value = '', onValueChange, children }: SelectProps) => {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  const contextValue = React.useMemo(
    () => ({
      value,
      onValueChange: onValueChange || (() => {}),
      open,
      onOpenChange: setOpen,
      triggerRef,
    }),
    [value, onValueChange, open]
  );

  return (
    <SelectContext.Provider value={contextValue}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): (instance: T | null) => void {
  return (instance: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') ref(instance);
      else if (ref != null)
        (ref as React.MutableRefObject<T | null>).current = instance;
    });
  };
}

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectTrigger must be used within Select');

  return (
    <button
      ref={mergeRefs(ref, context.triggerRef)}
      type="button"
      aria-haspopup="listbox"
      aria-expanded={context.open}
      onClick={() => context.onOpenChange(!context.open)}
      className={cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectValue must be used within Select');

  return (
    <span ref={ref} className={cn('block truncate', className)} {...props}>
      {context.value || placeholder}
    </span>
  );
});
SelectValue.displayName = 'SelectValue';

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectContent must be used within Select');

  const [position, setPosition] = React.useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  } | null>(null);

  React.useLayoutEffect(() => {
    if (!context.open) {
      setPosition(null);
      return;
    }
    const el = context.triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 4;
    const dropdownMaxHeight = 320;
    const spaceBelow =
      typeof window !== 'undefined'
        ? window.innerHeight - rect.bottom - gap
        : dropdownMaxHeight;
    const openAbove = spaceBelow < Math.min(dropdownMaxHeight, 200);
    setPosition({
      ...(openAbove
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
      left: rect.left,
      width: Math.max(rect.width, 128),
    });
  }, [context.open]);

  if (!context.open) return null;

  const content = (
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={() => context.onOpenChange(false)}
        aria-hidden
      />
      <div
        ref={ref}
        className={cn(
          'fixed z-[9999] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95',
          className
        )}
        style={
          position
            ? {
                ...(position.top !== undefined && { top: position.top }),
                ...(position.bottom !== undefined && {
                  bottom: position.bottom,
                }),
                left: position.left,
                width: position.width,
              }
            : { visibility: 'hidden' }
        }
        {...props}
      >
        <div className="max-h-80 overflow-auto p-1">{children}</div>
      </div>
    </>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
});
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
  const context = React.useContext(SelectContext);
  if (!context) throw new Error('SelectItem must be used within Select');

  const isSelected = context.value === value;

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        isSelected && 'bg-accent text-accent-foreground',
        className
      )}
      onClick={() => {
        context.onValueChange(value);
        context.onOpenChange(false);
      }}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      {children}
    </div>
  );
});
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
