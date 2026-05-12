import { render, screen } from "@testing-library/react";
import { redirect, notFound } from "next/navigation";
import May30CloudPartyPage from "../page";

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

jest.mock("../cloud-party-invitation", () => ({
  CloudPartyInvitation: ({
    party,
    partyRsvps,
    partyRsvpsError,
    currentUserId,
  }: any) => (
    <div data-testid="cloud-party-invitation">
      {party.name} / {party.slug} / {party.location} /{" "}
      {partyRsvps?.length ?? 0} / {partyRsvpsError ?? "no-error"} /{" "}
      {currentUserId}
    </div>
  ),
}));

describe("May30CloudPartyPage", () => {
  const mockSession = {
    user: {
      id: "user-123",
      email: "user@example.com",
    },
  };

  const mockParty = {
    party_id: "party-123",
    name: "What's the Move?",
    time: "2026-05-31T00:00:00Z",
    location: "TBD",
    description:
      "A practical check-in on whether I should stay in New York or make a different move.",
    slug: "whats-the-move-2026",
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    deleted_at: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { auth } = require("@/lib/auth");
    const { headers } = require("next/headers");

    headers.mockResolvedValue(new Headers());
    auth.api.getSession.mockResolvedValue(mockSession);
  });

  it("redirects to home when user is not authenticated", async () => {
    const { auth } = require("@/lib/auth");
    auth.api.getSession.mockResolvedValue(null);

    await expect(May30CloudPartyPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("fetches the May 30 cloud party by slug and renders the invitation", async () => {
    const { fetchPartyBySlug, fetchPartyRsvps } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(mockParty);
    fetchPartyRsvps.mockResolvedValue([{ rsvp_id: "rsvp-1" }]);

    const component = await May30CloudPartyPage();
    render(component);

    expect(fetchPartyBySlug).toHaveBeenCalledWith("whats-the-move-2026");
    expect(fetchPartyRsvps).toHaveBeenCalledWith("party-123");
    expect(screen.getByTestId("cloud-party-invitation")).toHaveTextContent(
      "What's the Move? / whats-the-move-2026 / TBD / 1 / no-error / user-123"
    );
  });

  it("calls notFound when the party does not exist", async () => {
    const { fetchPartyBySlug } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(null);

    await expect(May30CloudPartyPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("renders an error state when party fetch fails", async () => {
    const { fetchPartyBySlug } = require("@/lib/api-client");
    fetchPartyBySlug.mockRejectedValue(new Error("Network error"));

    const component = await May30CloudPartyPage();
    render(component);

    expect(screen.getByText("Error loading party")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("passes RSVP fetch errors to the invitation", async () => {
    const { fetchPartyBySlug, fetchPartyRsvps } = require("@/lib/api-client");
    fetchPartyBySlug.mockResolvedValue(mockParty);
    fetchPartyRsvps.mockRejectedValue(new Error("RSVP error"));

    const component = await May30CloudPartyPage();
    render(component);

    expect(screen.getByTestId("cloud-party-invitation")).toHaveTextContent(
      "What's the Move? / whats-the-move-2026 / TBD / 0 / RSVP error / user-123"
    );
  });
});
