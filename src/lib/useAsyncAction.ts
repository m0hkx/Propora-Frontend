import { useCallback } from 'react';
import { ApiError } from '../api/config';
import { useStore } from '../state/useStore';

/**
 * The message to show for a failed action. Specific messages — a validation reason
 * thrown by the store, or the server's own `message` — are shown as-is. Generic
 * transport failures (network down, which `fetch` reports as a TypeError, or a server
 * error with no message) show the caller's `fallback` label instead.
 */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.serverMessage ?? fallback;
  if (error instanceof TypeError) return fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Runs a store/API action and returns the error message, or null on success.
 * A thrown error and a string result are both treated as failures: some store
 * actions resolve with a rejection reason (second-gate validation) instead of throwing.
 * Use this directly when the error belongs in the form; use `useAsyncAction` for a toast.
 */
export async function attempt(action: () => Promise<unknown>, fallback: string): Promise<string | null> {
  try {
    const result = await action();
    return typeof result === 'string' ? result : null;
  } catch (error) {
    console.error(error);
    return errorMessage(error, fallback);
  }
}

/** Returns `run(action, fallback)`: toasts the error and resolves false on failure, true on success. */
export function useAsyncAction() {
  const pushToast = useStore((s) => s.pushToast);
  return useCallback(
    async (action: () => Promise<unknown>, fallback: string): Promise<boolean> => {
      const error = await attempt(action, fallback);
      if (error === null) return true;
      pushToast(error);
      return false;
    },
    [pushToast],
  );
}
