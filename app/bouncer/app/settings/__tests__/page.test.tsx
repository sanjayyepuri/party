import { render, screen } from "@testing-library/react";
import { redirect } from "next/navigation";
import SettingsPage from "../page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    const error = new Error(`NEXT_REDIRECT: ${url}`);
    (error as any).digest = `NEXT_REDIRECT;${url}`;
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

jest.mock("next/headers", () => ({
  headers: jest.fn(),
}));

jest.mock("@/lib/api-client", () => ({
  fetchCalendarFeedToken: jest.fn(),
}));

jest.mock("@/components/calendar/calendar-feed-controls", () => ({
  CalendarFeedControls: ({ initialFeedPath }: { initialFeedPath: string }) => (
    <div data-testid="calendar-feed-controls">{initialFeedPath}</div>
  ),
}));

describe("SettingsPage", () => {
  const mockSession = {
    user: {
      id: "user-123",
      name: "Sanjay",
      email: "[email protected]",
      phone: "+15551234567",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { auth } = require("@/lib/auth");
    const { headers } = require("next/headers");
    const { fetchCalendarFeedToken } = require("@/lib/api-client");

    headers.mockResolvedValue(new Headers());
    auth.api.getSession.mockResolvedValue(mockSession);
    fetchCalendarFeedToken.mockResolvedValue({
      feed_path: "/api/bouncer/calendar/feed.ics?token=abc123",
    });
  });

  it("redirects to home when unauthenticated", async () => {
    const { auth } = require("@/lib/auth");
    auth.api.getSession.mockResolvedValue(null);

    await expect(SettingsPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirect).toHaveBeenCalledWith("/");
  });

  it("renders profile information and calendar controls", async () => {
    const component = await SettingsPage();
    render(component);

    expect(screen.getByText("Account Settings")).toBeInTheDocument();
    expect(screen.getByText("Sanjay")).toBeInTheDocument();
    expect(screen.getByText("[email protected]")).toBeInTheDocument();
    expect(screen.getByTestId("calendar-feed-controls")).toBeInTheDocument();
  });

  it("renders calendar feed error when token fetch fails", async () => {
    const { fetchCalendarFeedToken } = require("@/lib/api-client");
    fetchCalendarFeedToken.mockRejectedValue(new Error("Calendar feed unavailable"));

    const component = await SettingsPage();
    render(component);

    expect(screen.getByText("Calendar feed unavailable")).toBeInTheDocument();
  });
});
