/**
 * Tests for RSVP functionality
 * Tests RSVP status display, fetching, updating, loading states, and error handling
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RsvpForm } from "../rsvp-form";
import { fetchRsvpClient, updateRsvpClient } from "@/lib/api-client-client";

// Mock the client-side API client
jest.mock("@/lib/api-client-client", () => ({
  fetchRsvpClient: jest.fn(),
  updateRsvpClient: jest.fn(),
}));

describe("RsvpForm", () => {
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
    (fetchRsvpClient as jest.Mock).mockResolvedValue(mockRsvp);
  });

  it("displays current RSVP status", async () => {
    render(<RsvpForm partyId="party-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Current Status/i)).toBeInTheDocument();
    });

    // Check for status in the status display area (not the button)
    // The status is in a p tag with class "text-lg font-semibold"
    const statusDisplay = screen
      .getByText(/Current Status/i)
      .closest("div")
      ?.querySelector("p.text-lg");
    expect(statusDisplay).toHaveTextContent("Pending");
  });

  it("displays status options for updating", async () => {
    render(<RsvpForm partyId="party-123" />);

    await waitFor(() => {
      // Check that all status buttons are present
      const buttons = screen.getAllByRole("button");
      const buttonTexts = buttons.map((btn) => btn.textContent);
      expect(buttonTexts).toContain("Pending");
      expect(buttonTexts).toContain("Accepted");
      expect(buttonTexts).toContain("Declined");
    });
  });

  it("disables current status button", async () => {
    render(<RsvpForm partyId="party-123" />);

    await waitFor(() => {
      const pendingButton = screen
        .getAllByText("Pending")
        .find((el) => el.tagName === "BUTTON");
      expect(pendingButton).toBeDisabled();
    });
  });

  it("updates RSVP status when clicking a different status", async () => {
    const user = userEvent.setup();
    const updatedRsvp = { ...mockRsvp, status: "accepted" };
    (updateRsvpClient as jest.Mock).mockResolvedValue(updatedRsvp);

    render(<RsvpForm partyId="party-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Current Status/i)).toBeInTheDocument();
    });

    const acceptedButton = screen
      .getAllByText("Accepted")
      .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;

    await user.click(acceptedButton);

    expect(updateRsvpClient).toHaveBeenCalledWith({
      rsvp_id: "rsvp-123",
      status: "accepted",
    });

    // Wait for the update to complete and status to change
    await waitFor(() => {
      // First check that "Updating RSVP..." is gone
      expect(screen.queryByText("Updating RSVP...")).not.toBeInTheDocument();
      // Then check that status updated to Accepted
      const statusDisplay = screen
        .getByText(/Current Status/i)
        .closest("div")
        ?.querySelector("p.text-lg");
      expect(statusDisplay).toHaveTextContent("Accepted");
    });
  });

  it("displays error message when update fails", async () => {
    const user = userEvent.setup();
    (updateRsvpClient as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    render(<RsvpForm partyId="party-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Current Status/i)).toBeInTheDocument();
    });

    const acceptedButton = screen
      .getAllByText("Accepted")
      .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;

    await user.click(acceptedButton);

    await waitFor(() => {
      // Check for error message text specifically
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });

    // Verify error container is present
    const errorContainer = screen
      .getByText("Network error")
      .closest(".bg-red-50");
    expect(errorContainer).toBeInTheDocument();
  });

  it("disables buttons while updating and shows updating state in status display", async () => {
    const user = userEvent.setup();
    let resolveUpdate: (value: any) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    (updateRsvpClient as jest.Mock).mockReturnValue(updatePromise);

    render(<RsvpForm partyId="party-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Current Status/i)).toBeInTheDocument();
    });

    const acceptedButton = screen
      .getAllByText("Accepted")
      .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;

    await user.click(acceptedButton);

    // Buttons should be disabled during update
    expect(acceptedButton).toBeDisabled();

    // "Updating RSVP..." should appear in the status display area
    expect(screen.getByText("Updating RSVP...")).toBeInTheDocument();
    const statusDisplay = screen
      .getByText(/Current Status/i)
      .closest("div")
      ?.querySelector("p.text-lg");
    expect(statusDisplay).toHaveTextContent("Updating RSVP...");
    expect(statusDisplay).toHaveClass("text-gray-400");

    // Resolve the update
    resolveUpdate!({ ...mockRsvp, status: "accepted" });
    await waitFor(() => {
      // Status should update back to the actual status
      expect(screen.queryByText("Updating RSVP...")).not.toBeInTheDocument();
      // Check the status display specifically
      const statusDisplay = screen
        .getByText(/Current Status/i)
        .closest("div")
        ?.querySelector("p.text-lg");
      expect(statusDisplay).toHaveTextContent("Accepted");
      expect(statusDisplay).toHaveClass("text-green-600");
    });
  });

  it("does not update if clicking current status", async () => {
    const user = userEvent.setup();

    render(<RsvpForm partyId="party-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Current Status/i)).toBeInTheDocument();
    });

    const pendingButton = screen
      .getAllByText("Pending")
      .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;

    // Button should be disabled, but try clicking anyway
    if (!pendingButton.disabled) {
      await user.click(pendingButton);
    }

    expect(updateRsvpClient).not.toHaveBeenCalled();
  });

  it("updates displayed status after successful update", async () => {
    const user = userEvent.setup();
    const updatedRsvp = { ...mockRsvp, status: "accepted" };
    (updateRsvpClient as jest.Mock).mockResolvedValue(updatedRsvp);

    render(<RsvpForm partyId="party-123" />);

    await waitFor(() => {
      expect(screen.getByText(/Current Status/i)).toBeInTheDocument();
    });

    const acceptedButton = screen
      .getAllByText("Accepted")
      .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;

    await user.click(acceptedButton);

    await waitFor(() => {
      // Status should update in the component
      expect(updateRsvpClient).toHaveBeenCalled();
    });

    // Wait for the status to update in the display
    await waitFor(() => {
      const statusDisplay = screen
        .getByText(/Current Status/i)
        .closest("div")
        ?.querySelector("p.text-lg");
      expect(statusDisplay).toHaveTextContent("Accepted");
    });

    // Accepted button should now be disabled after state update
    await waitFor(() => {
      const newAcceptedButton = screen
        .getAllByText("Accepted")
        .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;
      expect(newAcceptedButton).toBeDisabled();
    });
  });

  it("handles different initial statuses correctly", async () => {
    const acceptedRsvp = { ...mockRsvp, status: "accepted" };
    (fetchRsvpClient as jest.Mock).mockResolvedValue(acceptedRsvp);
    render(<RsvpForm partyId="party-123" />);

    await waitFor(() => {
      // Check for status in the status display area
      const statusDisplay = screen
        .getByText(/Current Status/i)
        .closest("div")
        ?.querySelector("p.text-lg");
      expect(statusDisplay).toHaveTextContent("Accepted");
    });
  });

  it("displays correct status colors", async () => {
    render(<RsvpForm partyId="party-123" />);

    await waitFor(() => {
      // Check that status display has appropriate styling
      const statusDisplay = screen
        .getByText(/Current Status/i)
        .closest("div")
        ?.querySelector("p.text-lg");
      expect(statusDisplay).toBeInTheDocument();
      // Check for yellow color class for pending status
      expect(statusDisplay).toHaveClass("text-yellow-600");
    });
  });

  it("displays loading state while fetching RSVP", () => {
    (fetchRsvpClient as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    render(<RsvpForm partyId="party-123" />);

    expect(screen.getByText("Loading RSVP...")).toBeInTheDocument();
  });

  it("displays error when RSVP fetch fails", async () => {
    (fetchRsvpClient as jest.Mock).mockRejectedValue(
      new Error("Failed to load RSVP")
    );
    render(<RsvpForm partyId="party-123" />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load RSVP")).toBeInTheDocument();
    });
  });
});
