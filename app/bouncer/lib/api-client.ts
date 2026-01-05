/**
 * API client for communicating with the pregame backend
 * Handles authentication and error handling for party and RSVP operations
 */

import { headers } from "next/headers";
import type { Party, Rsvp, UpdateRsvpRequest } from "./types";
import { getBaseURL } from "./auth-config";

const API_PATH = "/api/bouncer";

/**
 * Get the API base URL for server-side requests
 * Uses VERCEL_ENV to determine the correct URL for the environment
 * In production, uses VERCEL_PROJECT_PRODUCTION_URL (custom domain) to avoid CORS issues
 */
async function getApiBaseUrl(): Promise<string> {
  // Use getBaseURL() which handles all environment detection correctly:
  // - Production: Uses VERCEL_PROJECT_PRODUCTION_URL (custom domain) to avoid CORS
  // - Preview: Uses VERCEL_URL or VERCEL_BRANCH_URL
  // - Development: Uses localhost
  return getBaseURL();
}

/**
 * Get authentication headers from the current request
 * Forwards cookies to maintain session authentication
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const headersList = await headers();
  const cookie = headersList.get("cookie");

  const authHeaders: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (cookie) {
    authHeaders["Cookie"] = cookie;
  }

  return authHeaders;
}

/**
 * Fetch all parties for the authenticated user
 * @returns Array of Party objects
 * @throws Error if the request fails or user is not authenticated
 */
export async function fetchParties(): Promise<Party[]> {
  const authHeaders = await getAuthHeaders();
  const apiBaseUrl = await getApiBaseUrl();

  console.log(`Fetching parties from ${apiBaseUrl}${API_PATH}/parties`);

  try {
    const response = await fetch(`${apiBaseUrl}${API_PATH}/parties`, {
      method: "GET",
      headers: authHeaders,
      cache: "no-store", // Always fetch fresh data
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized: Please log in to view parties");
      }
      if (response.status === 500) {
        throw new Error("Server error: Unable to fetch parties");
      }
      throw new Error(`Failed to fetch parties: ${response.statusText}`);
    }

    const parties: Party[] = await response.json();
    return parties;
  } catch (error) {
    // Improve error message for network failures
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Unable to connect to API at ${apiBaseUrl}${API_PATH}/parties`
      );
    }
    throw error;
  }
}

/**
 * Fetch a single party by ID
 * @param partyId - The party ID
 * @returns Party object or null if not found
 * @throws Error if the request fails or user is not authenticated
 */
export async function fetchPartyById(partyId: string): Promise<Party | null> {
  const authHeaders = await getAuthHeaders();
  const apiBaseUrl = await getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}${API_PATH}/parties/${partyId}`, {
    method: "GET",
    headers: authHeaders,
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Unauthorized: Please log in to view party details");
    }
    if (response.status === 404) {
      return null;
    }
    if (response.status === 500) {
      throw new Error("Server error: Unable to fetch party");
    }
    throw new Error(`Failed to fetch party: ${response.statusText}`);
  }

  const party: Party = await response.json();
  return party;
}

/**
 * Find a party by slug from the list of all parties
 * @param slug - The party slug
 * @returns Party object or null if not found
 * @throws Error if fetching parties fails
 */
export async function fetchPartyBySlug(slug: string): Promise<Party | null> {
  const parties = await fetchParties();
  return parties.find((party) => party.slug === slug) || null;
}

/**
 * Get or create an RSVP for the authenticated user for a specific party
 * @param partyId - The party ID
 * @returns RSVP object
 * @throws Error if the request fails or user is not authenticated
 */
export async function fetchRsvp(partyId: string): Promise<Rsvp> {
  const authHeaders = await getAuthHeaders();
  const apiBaseUrl = await getApiBaseUrl();

  const response = await fetch(
    `${apiBaseUrl}${API_PATH}/parties/${partyId}/rsvp`,
    {
      method: "POST",
      headers: authHeaders,
      cache: "no-store",
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
 * Update an RSVP status
 * @param updateRequest - The RSVP update request with rsvp_id and status
 * @returns Updated RSVP object
 * @throws Error if the request fails or user is not authenticated
 */
export async function updateRsvp(
  updateRequest: UpdateRsvpRequest
): Promise<Rsvp> {
  const authHeaders = await getAuthHeaders();
  const apiBaseUrl = await getApiBaseUrl();

  const response = await fetch(`${apiBaseUrl}${API_PATH}/rsvps`, {
    method: "PUT",
    headers: authHeaders,
    body: JSON.stringify(updateRequest),
    cache: "no-store",
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
