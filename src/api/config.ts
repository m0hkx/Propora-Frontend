export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

/** Builds a full URL for a backend-served static file (uploaded images, documents). */
export function assetUrl(path: string): string {
  return `${API_URL}/${path.replace(/^\/+/, '')}`;
}

/**
 * Mongo round-trips an unset optional field as explicit `null`, not a missing
 * key. Frontend types treat those fields as `undefined`-when-absent (and some
 * call sites check `!== undefined` rather than using `??`), so every API
 * response is normalized through this before being mapped to a frontend type.
 */
export function stripNulls<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) out[key] = value === null ? undefined : value;
  return out as T;
}

/**
 * A non-ok API response. `serverMessage` is the backend's own `message` (specific,
 * user-facing — e.g. a validation reason); it's undefined when the server sent none,
 * in which case `message` is a generic "Request failed (N)".
 */
export class ApiError extends Error {
  readonly status: number;
  readonly serverMessage: string | undefined;

  constructor(status: number, serverMessage: string | undefined) {
    super(serverMessage || `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.serverMessage = serverMessage || undefined;
  }
}

/**
 * Shared fetch wrapper: sends cookies (`credentials: include`, required for the
 * session cookie across the 5173 → 3000 origin split), JSON-encodes a plain
 * object body (FormData bodies pass through untouched), and throws an `ApiError`
 * on a non-ok response.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: isFormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...options.headers },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(response.status, typeof data.message === 'string' ? data.message : undefined);
  }

  return data as T;
}
