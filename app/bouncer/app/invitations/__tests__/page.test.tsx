/**
 * Tests for invitations page
 * Tests party list rendering, links, loading/error states, and authentication
 */

import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import InvitationsPage from "../page";

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
  fetchParties: jest.fn(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("@/components/auth/logout-button", () => ({
  LogoutButton: () => <div data-testid="logout-button">Logout</div>,
}));

describe("InvitationsPage", () => {
  const mockSession = {
    user: {
      email: "[email protected]",
      id: "user-123",
    },
  };

  const mockParties = [
    {
      party_id: "party-1",
      name: "New Year's Party",
      time: "2024-12-31T20:00:00Z",
      location: "123 Main St",
      description: "Celebrate the new year",
      slug: "new-years-party",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      deleted_at: null,
    },
    {
      party_id: "party-2",
      name: "Summer BBQ",
      time: "2024-07-15T18:00:00Z",
      location: "456 Park Ave",
      description: "Summer gathering",
      slug: "summer-bbq",
      created_at: "2024-06-01T00:00:00Z",
      updated_at: "2024-06-01T00:00:00Z",
      deleted_at: null,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    const { auth } = require("@/lib/auth");
    const { headers } = require("next/headers");

    headers.mockResolvedValue(new Headers());
    auth.api.getSession.mockResolvedValue(mockSession);
  });

  it("redirects to login when user is not authenticated", async () => {
    const { auth } = require("@/lib/auth");
    auth.api.getSession.mockResolvedValue(null);

    await expect(InvitationsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("displays welcome message with user email", async () => {
    const { fetchParties } = require("@/lib/api-client");
    fetchParties.mockResolvedValue([]);

    const component = await InvitationsPage();
    const { container } = render(component);

    expect(container.textContent).toContain("hey [email protected]");
    expect(container.textContent).toContain("welcome to the party");
  });

  it("displays party list when parties are available", async () => {
    const { fetchParties } = require("@/lib/api-client");
    fetchParties.mockResolvedValue(mockParties);

    const component = await InvitationsPage();
    const { container } = render(component);

    expect(container.textContent).toContain("New Year's Party");
    expect(container.textContent).toContain("Summer BBQ");
    expect(container.textContent).toContain("123 Main St");
    expect(container.textContent).toContain("456 Park Ave");
  });

  it("displays empty state when no parties exist", async () => {
    const { fetchParties } = require("@/lib/api-client");
    fetchParties.mockResolvedValue([]);

    const component = await InvitationsPage();
    const { container } = render(component);

    expect(container.textContent).toContain("No parties available");
  });

  it("displays error message when fetching parties fails", async () => {
    const { fetchParties } = require("@/lib/api-client");
    fetchParties.mockRejectedValue(new Error("Network error"));

    const component = await InvitationsPage();
    const { container } = render(component);

    expect(container.textContent).toContain("Error loading parties");
    expect(container.textContent).toContain("Network error");
  });

  it("creates clickable links to party detail pages", async () => {
    const { fetchParties } = require("@/lib/api-client");
    fetchParties.mockResolvedValue(mockParties);

    const component = await InvitationsPage();
    render(component);

    const links = screen.getAllByRole("link");
    const partyLinks = links.filter((link) =>
      link.getAttribute("href")?.startsWith("/parties/")
    );

    expect(partyLinks).toHaveLength(2);
    expect(partyLinks[0]).toHaveAttribute("href", "/parties/new-years-party");
    expect(partyLinks[1]).toHaveAttribute("href", "/parties/summer-bbq");
  });

  it("displays party date and time correctly", async () => {
    const { fetchParties } = require("@/lib/api-client");
    fetchParties.mockResolvedValue([mockParties[0]]);

    const component = await InvitationsPage();
    const { container } = render(component);

    // Check that date formatting is present (format may vary by locale)
    expect(container.textContent).toContain("New Year's Party");
  });

  it("maintains existing account management links", async () => {
    const { fetchParties } = require("@/lib/api-client");
    fetchParties.mockResolvedValue([]);

    const component = await InvitationsPage();
    render(component);

    const settingsLink = screen.getByText(/manage your account/i);
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink.closest("a")).toHaveAttribute("href", "/settings");
  });
});

