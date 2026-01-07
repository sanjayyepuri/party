/**
 * Tests for LogoutButton component
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogoutButton } from "../logout-button";

// Mock dependencies
jest.mock("@/lib/auth-client", () => ({
  signOut: jest.fn(),
}));

const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockRefresh.mockClear();
  });

  it("renders logout button with icon and text", () => {
    render(<LogoutButton />);

    const button = screen.getByRole("button");
    expect(button).toBeTruthy();
    expect(button.textContent).toContain("sign out");

    // Check for icon
    const icon = button.querySelector("svg");
    expect(icon).toBeTruthy();
    expect(icon?.getAttribute("width")).toBe("16");
    expect(icon?.getAttribute("height")).toBe("16");
  });

  it("displays loading state when signing out", async () => {
    const { signOut } = require("@/lib/auth-client");
    signOut.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<LogoutButton />);

    const button = screen.getByRole("button");
    await userEvent.click(button);

    await waitFor(() => {
      expect(button.textContent).toContain("signing out...");
      expect(button.hasAttribute("disabled")).toBe(true);
    });
  });

  it("calls signOut and navigates on click", async () => {
    const { signOut } = require("@/lib/auth-client");
    signOut.mockResolvedValue(undefined);

    render(<LogoutButton />);

    const button = screen.getByRole("button");
    await userEvent.click(button);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it("handles logout errors gracefully", async () => {
    const { signOut } = require("@/lib/auth-client");
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    signOut.mockRejectedValue(new Error("Logout failed"));

    render(<LogoutButton />);

    const button = screen.getByRole("button");
    await userEvent.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Logout failed:",
        expect.any(Error)
      );
      // Button should be re-enabled after error
      expect(button.hasAttribute("disabled")).toBe(false);
    });

    consoleErrorSpy.mockRestore();
  });

  it("has correct styling classes for icon and layout", () => {
    render(<LogoutButton />);

    const button = screen.getByRole("button");
    expect(button.className).toContain("flex");
    expect(button.className).toContain("items-center");
    expect(button.className).toContain("gap-2");
    expect(button.className).toContain("text-sm");
  });
});
