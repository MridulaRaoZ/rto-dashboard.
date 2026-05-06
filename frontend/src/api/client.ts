import { PublicClientApplication } from '@azure/msal-browser';
import { loginRequest } from '../authConfig.js';

export async function apiFetch<T>(
  msalInstance: PublicClientApplication,
  path: string
): Promise<T> {
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) throw new Error('Not authenticated');

  const result = await msalInstance.acquireTokenSilent({
    ...loginRequest,
    account: accounts[0],
  });

  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${result.accessToken}` },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}
