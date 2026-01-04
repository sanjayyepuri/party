/**
 * Tests for client-side API client
 * Tests RSVP update functionality from client components
 */

import { updateRsvpClient } from "../api-client-client";
import type { UpdateRsvpRequest } from "../types";

// Mock fetch globally
global.fetch = jest.fn();

describe("api-client-client", () => {
  const originalEnv = process.env;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  const mockRsvp = {
    rsvp_id: "rsvp-123",
    party_id: "party-123",
    user_id: "user-123",
    status: "accepted",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000";

    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("updateRsvpClient", () => {
    it("updates RSVP successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRsvp,
      } as Response);

      const updateRequest: UpdateRsvpRequest = {
        rsvp_id: "rsvp-123",
        status: "accepted",
      };

      const result = await updateRsvpClient(updateRequest);

      expect(result).toEqual(mockRsvp);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/bouncer/rsvps",
        expect.objectContaining({
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updateRequest),
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
        updateRsvpClient({ rsvp_id: "rsvp-123", status: "accepted" })
      ).rejects.toThrow("Unauthorized: Please log in to update RSVP");
    });

    it("handles 404 not found error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      await expect(
        updateRsvpClient({ rsvp_id: "rsvp-123", status: "accepted" })
      ).rejects.toThrow("RSVP not found");
    });

    it("handles 500 server error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as Response);

      await expect(
        updateRsvpClient({ rsvp_id: "rsvp-123", status: "accepted" })
      ).rejects.toThrow("Server error: Unable to update RSVP");
    });

    it("handles other errors", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      } as Response);

      await expect(
        updateRsvpClient({ rsvp_id: "rsvp-123", status: "accepted" })
      ).rejects.toThrow("Failed to update RSVP: Bad Request");
    });

    it("handles network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(
        updateRsvpClient({ rsvp_id: "rsvp-123", status: "accepted" })
      ).rejects.toThrow("Network error");
    });

    it("includes credentials in request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRsvp,
      } as Response);

      await updateRsvpClient({ rsvp_id: "rsvp-123", status: "accepted" });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include",
        })
      );
    });
  });
});
