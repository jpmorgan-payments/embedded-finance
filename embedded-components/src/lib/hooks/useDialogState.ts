import { useCallback, useState } from 'react';

/**
 * Generic hook for managing dialog state
 *
 * This hook provides a consistent way to manage dialog open/close state
 * with support for both controlled and uncontrolled modes.
 * Can be used by any component that needs dialog state management.
 *
 * @param initialState - Initial open state (default: false)
 * @returns Object with dialog state and control functions
 *
 * @example
 * ```tsx
 * const { isOpen, open, close, toggle } = useDialogState();
 *
 * return (
 *   <Dialog open={isOpen} onOpenChange={toggle}>
 *     <DialogTrigger onClick={open}>Open</DialogTrigger>
 *     <DialogContent>
 *       <Button onClick={close}>Close</Button>
 *     </DialogContent>
 *   </Dialog>
 * );
 * ```
 */
export function useDialogState(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback((state?: boolean) => {
    if (typeof state === 'boolean') {
      setIsOpen(state);
    } else {
      setIsOpen((prev) => !prev);
    }
  }, []);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}

export type UseDialogStateReturn = ReturnType<typeof useDialogState>;
