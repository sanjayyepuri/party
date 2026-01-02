/**
 * Authentication configuration utilities
 * Handles environment variable detection and configuration for Better Auth
 */

/**
 * Automatically detect base URL from Vercel or use localhost
 */
export const getBaseURL = (): string => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.VERCEL_URL) {
    // Check if it's localhost - use http:// for localhost, https:// for production
    const host = process.env.VERCEL_URL;
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
