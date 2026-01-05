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
 * - VERCEL_ENV: Canonical environment indicator ('production', 'preview', 'development', or undefined)
 *   https://vercel.com/docs/projects/environment-variables/system-environment-variables
 * - VERCEL_PROJECT_PRODUCTION_URL: Production domain (custom domain or vercel.app fallback)
 *   Always set, even in preview deployments. Used in production to avoid CORS issues.
 *   https://vercel.com/docs/projects/environment-variables/system-environment-variables
 * - VERCEL_URL: Deployment URL (.vercel.app domain, NOT custom domain)
 *   Only available on the server. Should NOT be used in production to avoid CORS issues.
 *   https://vercel.com/docs/projects/environment-variables/system-environment-variables
 * - VERCEL_BRANCH_URL: Git branch URL for preview deployments
 *   https://vercel.com/docs/projects/environment-variables/system-environment-variables
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

  // Priority 3: Environment-based detection using VERCEL_ENV
  const vercelEnv = process.env.VERCEL_ENV;

  if (vercelEnv === "production") {
    // Production: Use VERCEL_PROJECT_PRODUCTION_URL (custom domain) to avoid CORS issues
    // DO NOT use VERCEL_URL in production (it's the .vercel.app domain, not custom domain)
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;
      // If the URL already includes a protocol, return it as-is
      if (host.startsWith("http://") || host.startsWith("https://")) {
        return host;
      }
      // VERCEL_PROJECT_PRODUCTION_URL does not include protocol, always use https in production
      return `https://${host}`;
    }
    // Fallback: if VERCEL_PROJECT_PRODUCTION_URL is not set (shouldn't happen), use VERCEL_URL
    // This is a safety fallback, but VERCEL_PROJECT_PRODUCTION_URL should always be set
    if (process.env.VERCEL_URL) {
      const host = process.env.VERCEL_URL;
      if (host.startsWith("http://") || host.startsWith("https://")) {
        return host;
      }
      return `https://${host}`;
    }
  } else if (vercelEnv === "preview") {
    // Preview: Use VERCEL_BRANCH_URL if available (stable branch URL), otherwise VERCEL_URL
    if (process.env.VERCEL_BRANCH_URL) {
      const host = process.env.VERCEL_BRANCH_URL;
      if (host.startsWith("http://") || host.startsWith("https://")) {
        return host;
      }
      return `https://${host}`;
    }
    if (process.env.VERCEL_URL) {
      const host = process.env.VERCEL_URL;
      if (host.startsWith("http://") || host.startsWith("https://")) {
        return host;
      }
      return `https://${host}`;
    }
  } else {
    // Development or local: Use localhost
    // VERCEL_ENV can be 'development' or undefined (local development)
    return "http://localhost:3000";
  }

  // Final fallback: Localhost (for local development when VERCEL_ENV is not set)
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

/**
 * Get trusted origins for Better Auth CSRF protection
 * Server-side only - used in auth.ts configuration
 *
 * Configure via BETTER_AUTH_TRUSTED_ORIGINS environment variable (comma-separated list)
 * If not set, defaults to the baseURL only
 */
export const getTrustedOrigins = (): string[] => {
  // Use explicit environment variable if set
  if (process.env.BETTER_AUTH_TRUSTED_ORIGINS) {
    return process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(",").map((origin) =>
      origin.trim()
    );
  }

  // Default to baseURL only
  return [getBaseURL()];
};

/**
 * Get canonical origin for passkey configuration
 * Configure via BETTER_AUTH_PASSKEY_ORIGIN environment variable
 * Server-side only - used in auth.ts passkey plugin configuration
 */
export const getPasskeyOrigin = (): string => {
  // Priority 1: Use explicit passkey origin if set
  if (process.env.BETTER_AUTH_PASSKEY_ORIGIN) {
    return process.env.BETTER_AUTH_PASSKEY_ORIGIN;
  }

  // Priority 2: Use first trusted origin if available (should be production domain)
  const trustedOrigins = getTrustedOrigins();
  if (trustedOrigins.length > 0) {
    // Filter out invalid URLs first
    const validOrigins = trustedOrigins.filter((origin) => {
      try {
        new URL(origin);
        return true;
      } catch {
        return false;
      }
    });

    if (validOrigins.length === 0) {
      // No valid origins, fall back to baseURL
      return getBaseURL();
    }

    // Prefer root domain (no subdomain) over www if both exist
    // Only consider root domains like "sanjay.party", not subdomains like "app.sanjay.party"
    const rootDomain = validOrigins.find((origin) => {
      try {
        const url = new URL(origin);
        const hostname = url.hostname;
        // Check if it's a root domain (no subdomain before the main domain)
        // e.g., "sanjay.party" is root, "www.sanjay.party" and "app.sanjay.party" are not
        const parts = hostname.split(".");
        // Root domain has exactly 2 parts (domain + TLD) or is localhost
        return parts.length === 2 || hostname === "localhost";
      } catch {
        return false;
      }
    });

    // If no root domain exists, return first valid origin
    return rootDomain || validOrigins[0];
  }

  // Priority 3: Fall back to baseURL
  return getBaseURL();
};
