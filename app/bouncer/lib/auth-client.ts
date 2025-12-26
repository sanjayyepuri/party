import { createAuthClient } from "better-auth/react";

// Automatically detect base URL - no fallback needed on client side
// Browser will use current origin if baseURL is not specified
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
