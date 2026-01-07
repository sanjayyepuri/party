/**
 * Tests for GuestList component
 * Tests guest list display, filtering, and empty states
 */

import { render, screen } from "@testing-library/react";
import { GuestList } from "../guest-list";
import type { RsvpWithUser } from "@/lib/types";

describe("GuestList", () => {
  const currentUserId = "user-123";

  const mockRsvpWithUser1: RsvpWithUser = {
    rsvp_id: "rsvp-1",
    party_id: "party-123",
    user_id: "user-456",
    status: "accepted",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    user_name: "John Doe",
  };

  const mockRsvpWithUser2: RsvpWithUser = {
    rsvp_id: "rsvp-2",
    party_id: "party-123",
    user_id: "user-789",
    status: "accepted",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    user_name: "Jane Smith",
  };

  const mockRsvpPending: RsvpWithUser = {
    rsvp_id: "rsvp-3",
    party_id: "party-123",
    user_id: "user-999",
    status: "pending",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    user_name: "Bob Pending",
  };

  const mockRsvpDeclined: RsvpWithUser = {
    rsvp_id: "rsvp-4",
    party_id: "party-123",
    user_id: "user-888",
    status: "declined",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    user_name: "Alice Declined",
  };

  const mockRsvpCurrentUser: RsvpWithUser = {
    rsvp_id: "rsvp-5",
    party_id: "party-123",
    user_id: currentUserId,
    status: "accepted",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    user_name: "Current User",
  };

  const mockRsvpNoName: RsvpWithUser = {
    rsvp_id: "rsvp-6",
    party_id: "party-123",
    user_id: "user-777",
    status: "accepted",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    deleted_at: null,
    user_name: null,
  };

  it("displays accepted guests with names", () => {
    const rsvps = [mockRsvpWithUser1, mockRsvpWithUser2];
    render(<GuestList rsvps={rsvps} currentUserId={currentUserId} />);

    expect(screen.getByText("Guests")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("filters out pending RSVPs", () => {
    const rsvps = [mockRsvpWithUser1, mockRsvpPending];
    render(<GuestList rsvps={rsvps} currentUserId={currentUserId} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Bob Pending")).not.toBeInTheDocument();
  });

  it("filters out declined RSVPs", () => {
    const rsvps = [mockRsvpWithUser1, mockRsvpDeclined];
    render(<GuestList rsvps={rsvps} currentUserId={currentUserId} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Alice Declined")).not.toBeInTheDocument();
  });

  it("filters out current user's RSVP", () => {
    const rsvps = [mockRsvpWithUser1, mockRsvpCurrentUser];
    render(<GuestList rsvps={rsvps} currentUserId={currentUserId} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.queryByText("Current User")).not.toBeInTheDocument();
  });

  it("filters out RSVPs with null names", () => {
    const rsvps = [mockRsvpWithUser1, mockRsvpNoName];
    render(<GuestList rsvps={rsvps} currentUserId={currentUserId} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    // Should not display anything for the null name RSVP
  });

  it("displays empty state when no accepted guests", () => {
    const rsvps = [mockRsvpPending, mockRsvpDeclined];
    render(<GuestList rsvps={rsvps} currentUserId={currentUserId} />);

    expect(screen.getByText("Guests")).toBeInTheDocument();
    expect(
      screen.getByText("No guests have accepted yet.")
    ).toBeInTheDocument();
  });

  it("displays empty state when RSVPs array is empty", () => {
    render(<GuestList rsvps={[]} currentUserId={currentUserId} />);

    expect(screen.getByText("Guests")).toBeInTheDocument();
    expect(
      screen.getByText("No guests have accepted yet.")
    ).toBeInTheDocument();
  });

  it("displays empty state when only current user has accepted", () => {
    const rsvps = [mockRsvpCurrentUser];
    render(<GuestList rsvps={rsvps} currentUserId={currentUserId} />);

    expect(screen.getByText("Guests")).toBeInTheDocument();
    expect(
      screen.getByText("No guests have accepted yet.")
    ).toBeInTheDocument();
  });

  it("displays multiple accepted guests in a list", () => {
    const rsvps = [
      mockRsvpWithUser1,
      mockRsvpWithUser2,
      {
        ...mockRsvpWithUser1,
        rsvp_id: "rsvp-7",
        user_id: "user-111",
        user_name: "Third Guest",
      },
    ];
    render(<GuestList rsvps={rsvps} currentUserId={currentUserId} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Third Guest")).toBeInTheDocument();
  });

  it("handles mixed statuses correctly", () => {
    const rsvps = [
      mockRsvpWithUser1,
      mockRsvpPending,
      mockRsvpDeclined,
      mockRsvpWithUser2,
      mockRsvpCurrentUser,
    ];
    render(<GuestList rsvps={rsvps} currentUserId={currentUserId} />);

    // Should only show accepted guests that are not the current user
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.queryByText("Bob Pending")).not.toBeInTheDocument();
    expect(screen.queryByText("Alice Declined")).not.toBeInTheDocument();
    expect(screen.queryByText("Current User")).not.toBeInTheDocument();
  });
});
