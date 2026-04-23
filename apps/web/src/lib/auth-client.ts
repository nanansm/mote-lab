"use client";

import { createAuthClient } from "better-auth/react";

// Use the current browser origin so the client works on any domain without
// depending on NEXT_PUBLIC_APP_URL being set correctly at build time.
// Falls back to env var for SSR pre-render.
const baseURL =
  typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client: any = createAuthClient({ baseURL });

export const signIn: typeof client.signIn = client.signIn;
export const signOut: typeof client.signOut = client.signOut;
export const signUp: typeof client.signUp = client.signUp;
export const useSession: typeof client.useSession = client.useSession;
export const getSession: typeof client.getSession = client.getSession;
