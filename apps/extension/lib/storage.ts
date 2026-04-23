import type { StoredAuth } from "./types";

const KEYS = {
  auth: "mote_auth",
  queue: "mote_queue",
} as const;

export async function getAuth(): Promise<StoredAuth | null> {
  const result = await chrome.storage.local.get(KEYS.auth);
  return (result[KEYS.auth] as StoredAuth) ?? null;
}

export async function setAuth(auth: StoredAuth): Promise<void> {
  await chrome.storage.local.set({ [KEYS.auth]: auth });
}

export async function clearAuth(): Promise<void> {
  await chrome.storage.local.remove(KEYS.auth);
}

export async function getQueue(): Promise<unknown[]> {
  const result = await chrome.storage.local.get(KEYS.queue);
  return (result[KEYS.queue] as unknown[]) ?? [];
}

export async function setQueue(queue: unknown[]): Promise<void> {
  await chrome.storage.local.set({ [KEYS.queue]: queue });
}

export async function clearQueue(): Promise<void> {
  await chrome.storage.local.remove(KEYS.queue);
}
