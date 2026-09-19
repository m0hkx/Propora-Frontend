import { apiFetch } from './config';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type UserResponse = { user: AuthUser };

export async function loginRequest(email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<UserResponse>('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function registerRequest(username: string, email: string, password: string): Promise<AuthUser> {
  const data = await apiFetch<UserResponse>('/users/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
  return data.user;
}

export async function logoutRequest(): Promise<void> {
  await apiFetch('/users/logout', { method: 'POST' });
}

/** Verifies the session cookie against the server; throws if not authenticated. */
export async function sessionRequest(): Promise<AuthUser> {
  const data = await apiFetch<UserResponse>('/users/session');
  return data.user;
}
