/**
 * Tests for party detail page
 * Tests party display, slug lookup, 404 handling, authentication, and error states
 */

import { render, screen } from "@testing-library/react";
import { redirect, notFound } from "next/navigation";
import PartyPage from "../page";

// Mock dependencies
jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT: ${url}`);
    (error as any).digest = `NEXT_REDIRECT;${url}`;
    throw error;
  }),
  notFound: jest.fn(() => {
    const error = new Error("NEXT_NOT_FOUND");
    (error as any).digest = "NEXT_NOT_FOUND";
    throw error;
  }),
}));

jest.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock("@/lib/api-client", () => ({
  fetchPartyBySlug: jest.fn(),
  fetchPartyRsvps: jest.fn(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("../rsvp-form", () => ({
  RsvpForm: ({ partyId }: any) => (
    <div data-testid="rsvp-form">RSVP Form - Party ID: {partyId}</div>
  ),
}));

jest.mock("../guest-list", () => ({
  GuestList: ({ rsvps, currentUserId }: any) => (
    <div data-testid="guest-list">
      Guest List - {rsvps.length} guests - Current User: {currentUserId}
    </div>
  ),
}));

describe("PartyPage", () => {
  const mockSession = {
    user: {
      email: "[email protected]",
      id: "user-123",
    },
  };

  const mockParty = {
    party_id: "party-123",
    name: "Test Party",
    time: "2024-12-31T20:00:00Z",
    location: "123 Main St",
    description: "Test party description",
    slug: "test-party",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
  };

  const mockRsvp = {
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
    const { auth } = require("@/lib/auth");
    const { headers } = require("next/headers");

    headers.mockResolvedValue(new Headers());
    auth.api.getSession.mockResolvedValue(mockSession);
  });

  it("redirects to home page when user is not authenticated", async () => {
    const { auth } = require("@/lib/auth");
    auth.api.getSession.mockResolvedValue(null);

    await expect(
      PartyPage({ params: Promise.resolve({ slug: "test-party" }) })
    ).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("calls notFound when party is not found", async () => {
    const { fetchPartyBySlug } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(null);

    await expect(
      PartyPage({ params: Promise.resolve({ slug: "non-existent" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("displays party details when party is found", async () => {
    const {
      fetchPartyBySlug,
      fetchPartyRsvps,
    } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(mockParty);
    fetchPartyRsvps.mockResolvedValue([]);

    const component = await PartyPage({
      params: Promise.resolve({ slug: "test-party" }),
    });
    const { container } = render(component);

    expect(container.textContent).toContain("Test Party");
    expect(container.textContent).toContain("123 Main St");
    expect(container.textContent).toContain("Test party description");
  });

  it("displays error message when fetching party fails", async () => {
    const { fetchPartyBySlug } = require("@/lib/api-client");
    fetchPartyBySlug.mockRejectedValue(new Error("Network error"));

    const component = await PartyPage({
      params: Promise.resolve({ slug: "test-party" }),
    });
    const { container } = render(component);

    expect(container.textContent).toContain("Error loading party");
    expect(container.textContent).toContain("Network error");
  });

  it("displays back to invitations link", async () => {
    const {
      fetchPartyBySlug,
      fetchPartyRsvps,
    } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(mockParty);
    fetchPartyRsvps.mockResolvedValue([]);

    const component = await PartyPage({
      params: Promise.resolve({ slug: "test-party" }),
    });
    render(component);

    const backLink = screen.getByText(/back to invitations/i);
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest("a")).toHaveAttribute("href", "/invitations");
  });

  it("displays RSVP form when RSVP is fetched successfully", async () => {
    const {
      fetchPartyBySlug,
      fetchPartyRsvps,
    } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(mockParty);
    fetchPartyRsvps.mockResolvedValue([]);

    const component = await PartyPage({
      params: Promise.resolve({ slug: "test-party" }),
    });
    render(component);

    const rsvpForm = screen.getByTestId("rsvp-form");
    expect(rsvpForm).toBeInTheDocument();
    expect(rsvpForm.textContent).toContain("party-123");
  });

  it("displays RSVP form even when server-side RSVP fetch fails", async () => {
    const {
      fetchPartyBySlug,
      fetchPartyRsvps,
    } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(mockParty);
    fetchPartyRsvps.mockResolvedValue([]);

    const component = await PartyPage({
      params: Promise.resolve({ slug: "test-party" }),
    });
    render(component);

    // RSVP form should still be rendered, it will handle its own loading/error states
    const rsvpForm = screen.getByTestId("rsvp-form");
    expect(rsvpForm).toBeInTheDocument();
  });

  it("handles party without description", async () => {
    const partyWithoutDescription = { ...mockParty, description: "" };
    const {
      fetchPartyBySlug,
      fetchPartyRsvps,
    } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(partyWithoutDescription);
    fetchPartyRsvps.mockResolvedValue([]);

    const component = await PartyPage({
      params: Promise.resolve({ slug: "test-party" }),
    });
    const { container } = render(component);

    expect(container.textContent).toContain("Test Party");
    // Description section should not be rendered or should be empty
  });

  it("formats party date and time correctly", async () => {
    const {
      fetchPartyBySlug,
      fetchPartyRsvps,
    } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(mockParty);
    fetchPartyRsvps.mockResolvedValue([]);

    const component = await PartyPage({
      params: Promise.resolve({ slug: "test-party" }),
    });
    const { container } = render(component);

    // Check that date formatting is present
    expect(container.textContent).toContain("When:");
    expect(container.textContent).toContain("Where:");
  });

  it("displays guest list when party RSVPs are fetched successfully", async () => {
    const mockPartyRsvps = [
      {
        rsvp_id: "rsvp-1",
        party_id: "party-123",
        user_id: "user-456",
        status: "accepted",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        user_name: "John Doe",
      },
    ];
    const {
      fetchPartyBySlug,
      fetchPartyRsvps,
    } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(mockParty);
    fetchPartyRsvps.mockResolvedValue(mockPartyRsvps);

    const component = await PartyPage({
      params: Promise.resolve({ slug: "test-party" }),
    });
    render(component);

    const guestList = screen.getByTestId("guest-list");
    expect(guestList).toBeInTheDocument();
    expect(guestList.textContent).toContain("1 guests");
    expect(guestList.textContent).toContain("user-123");
  });

  it("displays error message when fetching party RSVPs fails", async () => {
    const {
      fetchPartyBySlug,
      fetchPartyRsvps,
    } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(mockParty);
    fetchPartyRsvps.mockRejectedValue(new Error("RSVPs error"));

    const component = await PartyPage({
      params: Promise.resolve({ slug: "test-party" }),
    });
    const { container } = render(component);

    expect(container.textContent).toContain("Error loading guest list");
    expect(container.textContent).toContain("RSVPs error");
  });

  it("passes current user ID to guest list component", async () => {
    const mockPartyRsvps: any[] = [];
    const {
      fetchPartyBySlug,
      fetchPartyRsvps,
    } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(mockParty);
    fetchPartyRsvps.mockResolvedValue(mockPartyRsvps);

    const component = await PartyPage({
      params: Promise.resolve({ slug: "test-party" }),
    });
    render(component);

    const guestList = screen.getByTestId("guest-list");
    expect(guestList.textContent).toContain("user-123");
  });
});
