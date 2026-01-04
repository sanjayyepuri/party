/**
 * Shared utilities for resolving API base URLs
 * Used by both server-side and client-side API clients
 */

import { headers } from "next/headers";
import { getBaseURL } from "./auth-config";

/**
 * Get the API base URL for client-side requests
 * Uses environment variable if set, otherwise uses the current origin
 * This function is safe to use in client components
 */
export function getClientApiBaseUrl(): string {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Fallback to current origin (works in both development and production)
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // This should never happen in a client component, but provide a fallback
  return "http://localhost:3000";
}

/**
 * Get the API base URL for server-side requests
 * Uses the same origin as the current request in production
 * This function must be used in server components or server actions
 */
export async function getServerApiBaseUrl(): Promise<string> {
  // Server-side: use environment variable if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Otherwise, try to get the origin from request headers
  try {
    const headersList = await headers();
    const host = headersList.get("host");
    const protocol = headersList.get("x-forwarded-proto") || "https";

    if (host) {
      // Construct URL from request headers (works in Vercel/production)
      return `${protocol}://${host}`;
    }
  } catch {
    // If headers() fails, fall back to base URL
  }

  // Fallback to base URL from auth config
  return getBaseURL();
}

/**
 * Get the API base URL that works in both server and client contexts
 * Automatically detects the context and uses the appropriate method
 * For server components, use getServerApiBaseUrl() directly for better type safety
 */
export async function getApiBaseUrl(): Promise<string> {
  // In production/server-side, construct URL from request headers
  if (typeof window === "undefined") {
    return getServerApiBaseUrl();
  }
  // Client-side: use environment variable or current origin
  return getClientApiBaseUrl();
}
