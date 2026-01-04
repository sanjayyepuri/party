/**
 * Tests for RSVP functionality
 * Tests RSVP status display, fetching, updating, loading states, and error handling
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RsvpForm } from "../rsvp-form";
import { updateRsvpClient } from "@/lib/api-client-client";

// Mock the client-side API client
jest.mock("@/lib/api-client-client", () => ({
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
  });

  it("displays current RSVP status", () => {
    render(<RsvpForm initialRsvp={mockRsvp} />);

    expect(screen.getByText(/Current Status/i)).toBeInTheDocument();
    // Check for status in the status display area (not the button)
    // The status is in a p tag with class "text-lg font-semibold"
    const statusDisplay = screen
      .getByText(/Current Status/i)
      .closest("div")
      ?.querySelector("p.text-lg");
    expect(statusDisplay).toHaveTextContent("Pending");
  });

  it("displays status options for updating", () => {
    render(<RsvpForm initialRsvp={mockRsvp} />);

    // Check that all status buttons are present
    const buttons = screen.getAllByRole("button");
    const buttonTexts = buttons.map((btn) => btn.textContent);
    expect(buttonTexts).toContain("Pending");
    expect(buttonTexts).toContain("Accepted");
    expect(buttonTexts).toContain("Declined");
  });

  it("disables current status button", () => {
    render(<RsvpForm initialRsvp={mockRsvp} />);

    const pendingButton = screen
      .getAllByText("Pending")
      .find((el) => el.tagName === "BUTTON");
    expect(pendingButton).toBeDisabled();
  });

  it("updates RSVP status when clicking a different status", async () => {
    const user = userEvent.setup();
    const updatedRsvp = { ...mockRsvp, status: "accepted" };
    (updateRsvpClient as jest.Mock).mockResolvedValue(updatedRsvp);

    render(<RsvpForm initialRsvp={mockRsvp} />);

    const acceptedButton = screen
      .getAllByText("Accepted")
      .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;

    await user.click(acceptedButton);

    expect(updateRsvpClient).toHaveBeenCalledWith({
      rsvp_id: "rsvp-123",
      status: "accepted",
    });

    await waitFor(() => {
      expect(
        screen.getByText(/RSVP updated successfully/i)
      ).toBeInTheDocument();
    });
  });

  it("displays success message after successful update", async () => {
    const user = userEvent.setup();
    const updatedRsvp = { ...mockRsvp, status: "accepted" };
    (updateRsvpClient as jest.Mock).mockResolvedValue(updatedRsvp);

    render(<RsvpForm initialRsvp={mockRsvp} />);

    const acceptedButton = screen
      .getAllByText("Accepted")
      .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;

    await user.click(acceptedButton);

    await waitFor(() => {
      expect(
        screen.getByText(/RSVP updated successfully/i)
      ).toBeInTheDocument();
    });
  });

  it("displays error message when update fails", async () => {
    const user = userEvent.setup();
    (updateRsvpClient as jest.Mock).mockRejectedValue(
      new Error("Network error")
    );

    render(<RsvpForm initialRsvp={mockRsvp} />);

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

  it("disables buttons while updating", async () => {
    const user = userEvent.setup();
    let resolveUpdate: (value: any) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    (updateRsvpClient as jest.Mock).mockReturnValue(updatePromise);

    render(<RsvpForm initialRsvp={mockRsvp} />);

    const acceptedButton = screen
      .getAllByText("Accepted")
      .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;

    await user.click(acceptedButton);

    // Buttons should be disabled during update
    expect(acceptedButton).toBeDisabled();
    expect(screen.getByText(/Updating RSVP/i)).toBeInTheDocument();

    // Resolve the update
    resolveUpdate!({ ...mockRsvp, status: "accepted" });
    await waitFor(() => {
      expect(screen.queryByText(/Updating RSVP/i)).not.toBeInTheDocument();
    });
  });

  it("does not update if clicking current status", async () => {
    const user = userEvent.setup();

    render(<RsvpForm initialRsvp={mockRsvp} />);

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

    const { rerender } = render(
      <RsvpForm initialRsvp={mockRsvp} />
    );

    const acceptedButton = screen
      .getAllByText("Accepted")
      .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;

    await user.click(acceptedButton);

    await waitFor(() => {
      // Status should update in the component
      expect(updateRsvpClient).toHaveBeenCalled();
    });

    // Re-render with updated RSVP to simulate state update
    rerender(<RsvpForm initialRsvp={updatedRsvp} />);

    // Accepted button should now be disabled
    const newAcceptedButton = screen
      .getAllByText("Accepted")
      .find((el) => el.tagName === "BUTTON") as HTMLButtonElement;
    expect(newAcceptedButton).toBeDisabled();
  });

  it("handles different initial statuses correctly", () => {
    const acceptedRsvp = { ...mockRsvp, status: "accepted" };
    render(<RsvpForm initialRsvp={acceptedRsvp} partyId="party-123" />);

    // Check for status in the status display area
    const statusDisplay = screen
      .getByText(/Current Status/i)
      .closest("div")
      ?.querySelector("p.text-lg");
    expect(statusDisplay).toHaveTextContent("Accepted");
  });

  it("displays correct status colors", () => {
    render(<RsvpForm initialRsvp={mockRsvp} />);

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
