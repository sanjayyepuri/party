/**
 * Tests for API client utility
 * Tests server-side API functions for fetching parties and managing RSVPs
 */

import {
  fetchParties,
  fetchPartyById,
  fetchPartyBySlug,
  fetchRsvp,
  updateRsvp,
} from "../api-client";
import type { Party, Rsvp } from "../types";

// Mock next/headers
jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("api-client", () => {
  const originalEnv = process.env;
  let mockHeaders: jest.MockedFunction<typeof import("next/headers").headers>;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  const mockParty: Party = {
    party_id: "party-123",
    name: "Test Party",
    time: "2024-12-31T20:00:00Z",
    location: "Test Location",
    description: "Test Description",
    slug: "test-party",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
  };

  const mockRsvp: Rsvp = {
    rsvp_id: "rsvp-123",
    party_id: "party-123",
    user_id: "user-123",
    status: "pending",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000";

    mockHeaders = require("next/headers").headers;
    mockHeaders.mockResolvedValue(
      new Headers({
        cookie: "better-auth.session_token=test-token",
      }) as any
    );

    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("fetchParties", () => {
    it("fetches parties successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockParty],
      } as Response);

      const parties = await fetchParties();

      expect(parties).toEqual([mockParty]);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/bouncer/parties",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Cookie: "better-auth.session_token=test-token",
          }),
          cache: "no-store",
        })
      );
    });

    it("handles 401 unauthorized error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      } as Response);

      await expect(fetchParties()).rejects.toThrow(
        "Unauthorized: Please log in to view parties"
      );
    });

    it("handles 500 server error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(fetchParties()).rejects.toThrow(
        "Server error: Unable to fetch parties"
      );
    });

    it("handles other errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      } as Response);

      await expect(fetchParties()).rejects.toThrow(
        "Failed to fetch parties: Bad Request"
      );
    });

    it("handles network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(fetchParties()).rejects.toThrow("Network error");
    });
  });

  describe("fetchPartyById", () => {
    it("fetches party by ID successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockParty,
      } as Response);

      const party = await fetchPartyById("party-123");

      expect(party).toEqual(mockParty);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/bouncer/parties/party-123",
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("returns null for 404 not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      const party = await fetchPartyById("non-existent");

      expect(party).toBeNull();
    });

    it("handles 401 unauthorized error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      } as Response);

      await expect(fetchPartyById("party-123")).rejects.toThrow(
        "Unauthorized: Please log in to view party details"
      );
    });
  });

  describe("fetchPartyBySlug", () => {
    it("finds party by slug from parties list", async () => {
      const parties = [mockParty, { ...mockParty, slug: "other-party" }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => parties,
      } as Response);

      const party = await fetchPartyBySlug("test-party");

      expect(party).toEqual(mockParty);
    });

    it("returns null if slug not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockParty],
      } as Response);

      const party = await fetchPartyBySlug("non-existent-slug");

      expect(party).toBeNull();
    });

    it("propagates errors from fetchParties", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      } as Response);

      await expect(fetchPartyBySlug("test-party")).rejects.toThrow(
        "Unauthorized: Please log in to view parties"
      );
    });
  });

  describe("fetchRsvp", () => {
    it("fetches RSVP successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRsvp,
      } as Response);

      const rsvp = await fetchRsvp("party-123");

      expect(rsvp).toEqual(mockRsvp);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/bouncer/parties/party-123/rsvp",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("handles 401 unauthorized error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      } as Response);

      await expect(fetchRsvp("party-123")).rejects.toThrow(
        "Unauthorized: Please log in to manage RSVP"
      );
    });

    it("handles 404 not found error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      await expect(fetchRsvp("party-123")).rejects.toThrow(
        "Party or user not found"
      );
    });
  });

  describe("updateRsvp", () => {
    it("updates RSVP successfully", async () => {
      const updatedRsvp = { ...mockRsvp, status: "accepted" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => updatedRsvp,
      } as Response);

      const result = await updateRsvp({
        rsvp_id: "rsvp-123",
        status: "accepted",
      });

      expect(result).toEqual(updatedRsvp);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/bouncer/rsvps",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            rsvp_id: "rsvp-123",
            status: "accepted",
          }),
        })
      );
    });

    it("handles 401 unauthorized error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      } as Response);

      await expect(
        updateRsvp({ rsvp_id: "rsvp-123", status: "accepted" })
      ).rejects.toThrow("Unauthorized: Please log in to update RSVP");
    });

    it("handles 404 not found error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      await expect(
        updateRsvp({ rsvp_id: "rsvp-123", status: "accepted" })
      ).rejects.toThrow("RSVP not found");
    });
  });
});

