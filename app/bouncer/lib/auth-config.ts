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
 * - NEXT_PUBLIC_APP_URL: Optional custom override (available in both server and client if set)
 *   https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables
 * - NEXT_PUBLIC_VERCEL_URL: Automatically set by Vercel (available in both server and client)
 *   https://vercel.com/docs/projects/environment-variables/system-environment-variables
 * - VERCEL_URL: Only available on the server (not exposed to client bundle)
 *   https://vercel.com/docs/projects/environment-variables/system-environment-variables
 * - Next.js does NOT add any prefixes or modify environment variable values during build
 * - Client-side code should pass window.location.origin via the origin parameter
 */
export const getBaseURL = (origin?: string): string => {
  // Priority 1: Custom app URL override (if manually configured)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Priority 2: Use provided origin (typically window.location.origin on client-side)
  if (origin) {
    return origin;
  }

  // Priority 3: NEXT_PUBLIC_VERCEL_URL (automatically set by Vercel, available on client and server)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const host = process.env.NEXT_PUBLIC_VERCEL_URL;
    
    // If the URL already includes a protocol, return it as-is
    if (host.startsWith("http://") || host.startsWith("https://")) {
      return host;
    }
    
    // NEXT_PUBLIC_VERCEL_URL does not include the protocol according to Vercel docs
    // Check if it's localhost - use http:// for localhost, https:// for production
    if (host.startsWith("localhost") || host.includes("localhost:")) {
      return `http://${host}`;
    }
    return `https://${host}`;
  }

  // Priority 4: VERCEL_URL (server-side only fallback)
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

  // Priority 5: Localhost fallback
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
