import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { emailOTPClient } from "better-auth/client/plugins";

// Client-side auth configuration
// In browser, we can use window.location.origin if no explicit URL is set
const getClientBaseURL = () => {
  // If NEXT_PUBLIC_APP_URL is set, use it
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  // On client-side, use the current origin
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  // Fallback for SSR (shouldn't be used since this is client-only)
  return undefined;
};

export const authClient = createAuthClient({
  baseURL: getClientBaseURL(),
  basePath: "/handlers/auth",
  plugins: [passkeyClient(), emailOTPClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
  getSession,
  passkey,
  emailOtp,
} = authClient;
