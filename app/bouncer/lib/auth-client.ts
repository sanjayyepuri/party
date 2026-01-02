import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { getBaseURL } from "./auth-config";

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
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
