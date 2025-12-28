/**
 * Better Auth Client Configuration
 *
 * Provides typed client-side authentication methods for:
 * - Passkey authentication (WebAuthn)
 * - Magic link authentication
 * - Session management
 *
 * This module exports a configured auth client with all necessary plugins.
 * All exports are properly typed for TypeScript safety.
 */

import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";
import { magicLinkClient } from "better-auth/client/plugins";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get base URL for API requests
 *
 * Priority order:
 * 1. NEXT_PUBLIC_APP_URL (explicit configuration)
 * 2. window.location.origin (browser runtime)
 * 3. undefined (SSR fallback - shouldn't be used for client code)
 *
 * @returns Base URL string or undefined
 */
const getClientBaseURL = (): string | undefined => {
  // Use explicitly configured URL if available
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // In browser, use current origin
  // This ensures the client always talks to the correct server
  // even when deployed to preview branches, etc.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // SSR fallback - undefined means "use relative URLs"
  // This shouldn't be reached since this module is client-only
  return undefined;
};

// ============================================================================
// Auth Client Configuration
// ============================================================================

export const authClient = createAuthClient({
  baseURL: getClientBaseURL(),
  basePath: "/handlers/auth",

  plugins: [
    /**
     * Passkey Client Plugin
     *
     * Adds methods for WebAuthn passkey authentication:
     * - signIn.passkey(): Authenticate with existing passkey
     * - passkey.addPasskey(): Register new passkey for current user
     * - passkey.listPasskeys(): Get all passkeys for current user
     * - passkey.deletePasskey(): Remove a passkey
     *
     * Browser Requirements:
     * - PublicKeyCredential API support
     * - Secure context (HTTPS or localhost)
     */
    passkeyClient(),

    /**
     * Magic Link Client Plugin
     *
     * Adds methods for email-based authentication:
     * - magicLink.sendMagicLink(): Request magic link email
     *
     * Use cases:
     * - Initial user registration (create account + set up passkey)
     * - Recovery (lost passkey, new device)
     * - Fallback (unsupported browsers)
     */
    magicLinkClient(),
  ],
});

// ============================================================================
// Typed Exports
// ============================================================================

/**
 * Authentication methods
 *
 * Core methods for managing authentication state:
 * - signIn: Sign in with various methods (passkey, magic link)
 * - signUp: Create new account (via magic link)
 * - signOut: End current session
 */
export const { signIn, signUp, signOut } = authClient;

/**
 * Session management hooks
 *
 * React hooks for accessing session state:
 * - useSession: Hook to get current session (reactive)
 * - getSession: Function to get current session (one-time)
 *
 * Usage:
 * ```tsx
 * const { data: session, isPending } = useSession();
 * if (session) {
 *   // User is authenticated
 *   console.log(session.user.email);
 * }
 * ```
 */
export const { useSession, getSession } = authClient;

/**
 * Passkey management methods
 *
 * Methods for managing WebAuthn passkeys:
 * - passkey.addPasskey({ name? }): Register new passkey
 * - passkey.listPasskeys(): Get all user's passkeys
 * - passkey.deletePasskey({ id }): Remove passkey
 *
 * Usage:
 * ```tsx
 * // Add passkey
 * await passkey.addPasskey({
 *   name: "MacBook Pro - Dec 28"
 * });
 *
 * // List passkeys
 * const passkeys = await passkey.listPasskeys();
 *
 * // Delete passkey
 * await passkey.deletePasskey({ id: passkeyId });
 * ```
 */
export const { passkey } = authClient;

/**
 * Magic link methods
 *
 * Methods for email-based authentication:
 * - magicLink.sendMagicLink({ email, callbackURL? }): Send magic link
 *
 * Usage:
 * ```tsx
 * await magicLink.sendMagicLink({
 *   email: "user@example.com",
 *   callbackURL: "/invitations"
 * });
 * ```
 */
export const { magicLink } = authClient;
