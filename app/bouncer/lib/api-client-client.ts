/**
 * Client-side API client for RSVP operations
 * Used in client components where we can't use server-side headers()
 */

import type { Rsvp, UpdateRsvpRequest } from "./types";

const API_PATH = "/api/bouncer";

/**
 * Get the API base URL for client-side requests
 * Uses environment variable if set, otherwise uses the current origin
 * For client-side, window.location.origin is the most reliable source
 */
function getApiBaseUrl(): string {
  // Use environment variable if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // Fallback to current origin (works in both development and production)
  // This is the most reliable approach for client-side code as it always
  // matches the actual origin the page is loaded from
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // This should never happen in a client component, but provide a fallback
  // Check VERCEL_ENV for better localhost detection during SSR edge cases
  const vercelEnv = process.env.VERCEL_ENV;
  if (!vercelEnv || vercelEnv === "development") {
    return "http://localhost:3000";
  }

  // Fallback for other cases (shouldn't happen in client components)
  return "http://localhost:3000";
}

/**
 * Get or create an RSVP for the authenticated user for a specific party (client-side)
 * @param partyId - The party ID
 * @returns RSVP object
 * @throws Error if the request fails or user is not authenticated
 */
export async function fetchRsvpClient(partyId: string): Promise<Rsvp> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(
    `${apiBaseUrl}${API_PATH}/parties/${partyId}/rsvp`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for authentication
      cache: "force-cache", // Use cached data
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in to manage RSVP");
    }
    if (response.status === 404) {
      throw new Error("Party or user not found");
    }
    if (response.status === 500) {
      throw new Error("Server error: Unable to fetch RSVP");
    }
    throw new Error(`Failed to fetch RSVP: ${response.statusText}`);
  }

  const rsvp: Rsvp = await response.json();
  return rsvp;
}

/**
 * Update an RSVP status (client-side)
 * @param updateRequest - The RSVP update request with rsvp_id and status
 * @returns Updated RSVP object
 * @throws Error if the request fails or user is not authenticated
 */
export async function updateRsvpClient(
  updateRequest: UpdateRsvpRequest
): Promise<Rsvp> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}${API_PATH}/rsvps`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
    body: JSON.stringify(updateRequest),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in to update RSVP");
    }
    if (response.status === 404) {
      throw new Error("RSVP not found");
    }
    if (response.status === 500) {
      throw new Error("Server error: Unable to update RSVP");
    }
    throw new Error(`Failed to update RSVP: ${response.statusText}`);
  }

  const rsvp: Rsvp = await response.json();
  return rsvp;
}
