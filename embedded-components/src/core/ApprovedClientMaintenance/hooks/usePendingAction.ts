import { useCallback, useRef, useState } from 'react';

/** Runs one async action at a time and exposes which one is running. */
export function usePendingAction<Key extends string = string>() {
  const [pendingKey, setPendingKey] = useState<Key>();
  const [error, setError] = useState<unknown>();
  // State updates land after the next render; the ref blocks a fast double click.
  const isRunning = useRef(false);

  const run = useCallback(
    async (key: Key, action: () => void | Promise<void>) => {
      if (isRunning.current) return;
      isRunning.current = true;
      setPendingKey(key);
      setError(undefined);
      try {
        await action();
      } catch (actionError) {
        setError(actionError);
      } finally {
        isRunning.current = false;
        setPendingKey(undefined);
      }
    },
    []
  );

  const reset = useCallback(() => setError(undefined), []);

  return { pendingKey, isPending: pendingKey !== undefined, error, run, reset };
}
