/**
 * Authentication configuration utilities
 * Handles environment variable detection and configuration for Better Auth
 */

/**
 * Automatically detect base URL from Vercel or use localhost
 * 
 * @param origin - Optional origin (e.g., window.location.origin for client-side)
 * 
 * **Environment Variable Handling:**
 * - NEXT_PUBLIC_APP_URL: Available in both server and client (inlined at build time by Next.js)
 *   https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables
 * - VERCEL_URL: Only available on the server (not exposed to client bundle)
 *   https://vercel.com/docs/projects/environment-variables/system-environment-variables
 * - Next.js does NOT add any prefixes or modify environment variable values during build
 * - Client-side code should pass window.location.origin via the origin parameter
 */
export const getBaseURL = (origin?: string): string => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Use provided origin (typically window.location.origin on client-side)
  if (origin) {
    return origin;
  }

  if (process.env.VERCEL_URL) {
    // VERCEL_URL does not include the protocol according to Vercel docs
    // https://vercel.com/docs/projects/environment-variables/system-environment-variables
    // However, we handle the case defensively in case it's already prefixed
    const host = process.env.VERCEL_URL; // Guaranteed to be defined by the if condition above
    
    // If the URL already includes a protocol, return it as-is
    if (host.startsWith("http://") || host.startsWith("https://")) {
      return host;
    }
    
    // Check if it's localhost - use http:// for localhost, https:// for production
    if (host.startsWith("localhost") || host.includes("localhost:")) {
      return `http://${host}`;
    }
    return `https://${host}`;
  }

  return "http://localhost:3000";
};

/**
 * Get Relying Party ID from base URL (domain only, no protocol/port)
 * Used for WebAuthn/Passkey authentication
 */
export const getRpID = (): string => {
  if (process.env.BETTER_AUTH_PASSKEY_RP_ID) {
    return process.env.BETTER_AUTH_PASSKEY_RP_ID;
  }

  const baseURL = getBaseURL();
  try {
    const url = new URL(baseURL);
    return url.hostname; // Extract just the hostname (domain)
  } catch {
    // Fallback for localhost
    return "localhost";
  }
};

/**
 * Get Relying Party Name
 * Human-readable name for WebAuthn/Passkey authentication
 */
export const getRpName = (): string => {
  return process.env.BETTER_AUTH_PASSKEY_RP_NAME || "Party Platform";
};
