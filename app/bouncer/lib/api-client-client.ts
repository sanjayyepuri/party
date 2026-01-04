/**
 * Client-side API client for RSVP operations
 * Used in client components where we can't use server-side headers()
 */

import type { Rsvp, UpdateRsvpRequest } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const API_PATH = "/api/bouncer";

/**
 * Update an RSVP status (client-side)
 * @param updateRequest - The RSVP update request with rsvp_id and status
 * @returns Updated RSVP object
 * @throws Error if the request fails or user is not authenticated
 */
export async function updateRsvpClient(
  updateRequest: UpdateRsvpRequest
): Promise<Rsvp> {
  const response = await fetch(`${API_BASE_URL}${API_PATH}/rsvps`, {
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
