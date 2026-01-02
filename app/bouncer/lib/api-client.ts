/**
 * API client for the pregame backend service.
 * Handles all communication with the Rust backend API.
 */

const getApiBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
};

const API_BASE_URL = getApiBaseURL();

export interface Party {
  party_id: string;
  name: string;
  time: string; // ISO 8601 datetime string
  location: string;
  description: string;
  slug: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Rsvp {
  rsvp_id: string;
  party_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UpdateRsvpRequest {
  rsvp_id: string;
  status: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Fetches data from the API with proper error handling and authentication.
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}/api/bouncer${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Include cookies for session authentication
  });

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.statusText}`;
    let errorData: unknown = null;

    try {
      errorData = await response.json();
      if (typeof errorData === "string") {
        errorMessage = errorData;
      } else if (
        errorData &&
        typeof errorData === "object" &&
        "message" in errorData
      ) {
        errorMessage = String(errorData.message);
      }
    } catch {
      // If response is not JSON, use status text
      errorMessage = await response.text().catch(() => response.statusText);
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * API client functions for party operations
 */
export const partyApi = {
  /**
   * List all parties
   */
  listParties: async (): Promise<Party[]> => {
    return fetchApi<Party[]>("/parties");
  },

  /**
   * Get a single party by ID
   */
  getParty: async (partyId: string): Promise<Party> => {
    return fetchApi<Party>(`/parties/${partyId}`);
  },
};

/**
 * API client functions for RSVP operations
 */
export const rsvpApi = {
  /**
   * Get all RSVPs for a party
   */
  getPartyRsvps: async (partyId: string): Promise<Rsvp[]> => {
    return fetchApi<Rsvp[]>(`/parties/${partyId}/rsvps`);
  },

  /**
   * Get or create RSVP for the authenticated user
   */
  getRsvp: async (partyId: string): Promise<Rsvp> => {
    return fetchApi<Rsvp>(`/parties/${partyId}/rsvp`, {
      method: "POST",
    });
  },

  /**
   * Update an existing RSVP
   */
  updateRsvp: async (request: UpdateRsvpRequest): Promise<Rsvp> => {
    return fetchApi<Rsvp>("/rsvps", {
      method: "PUT",
      body: JSON.stringify(request),
    });
  },

  /**
   * Delete an RSVP (soft delete)
   */
  deleteRsvp: async (partyId: string): Promise<void> => {
    return fetchApi<void>(`/parties/${partyId}/rsvp`, {
      method: "DELETE",
    });
  },
};
