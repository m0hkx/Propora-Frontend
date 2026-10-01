import { useCallback } from 'react';
import { useStore } from '../state/useStore';

/**
 * Runs a store/API action and returns the error message, or null on success.
 * A thrown error and a string result are both treated as failures: some store
 * actions resolve with a rejection reason (second-gate validation) instead of throwing.
 * Use this directly when the error belongs in the form; use `useAsyncAction` for a toast.
 */
export async function attempt(action: () => Promise<unknown>, failure: string): Promise<string | null> {
  try {
    const result = await action();
    return typeof result === 'string' ? result : null;
  } catch (error) {
    console.error(error);
    return error instanceof Error ? error.message : failure;
  }
}

/** Returns `run(action, failure)`: toasts the error and resolves false on failure, true on success. */
export function useAsyncAction() {
  const pushToast = useStore((s) => s.pushToast);
  return useCallback(
    async (action: () => Promise<unknown>, failure: string): Promise<boolean> => {
      const error = await attempt(action, failure);
      if (error === null) return true;
      pushToast(error);
      return false;
    },
    [pushToast],
  );
}
