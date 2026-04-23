"use client";

import { createAuthClient } from "better-auth/react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const client: any = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003",
});

export const signIn: typeof client.signIn = client.signIn;
export const signOut: typeof client.signOut = client.signOut;
export const signUp: typeof client.signUp = client.signUp;
export const useSession: typeof client.useSession = client.useSession;
export const getSession: typeof client.getSession = client.getSession;
