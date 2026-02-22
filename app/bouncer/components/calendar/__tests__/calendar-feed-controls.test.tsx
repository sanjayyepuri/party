import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarFeedControls } from "../calendar-feed-controls";

jest.mock("@/lib/api-client-client", () => ({
  rotateCalendarFeedTokenClient: jest.fn(),
}));

describe("CalendarFeedControls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("copies the full calendar feed URL", async () => {
    render(
      <CalendarFeedControls initialFeedPath="/api/bouncer/calendar/feed.ics?token=abc123" />
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /copy url/i }));

    expect(screen.getByText("Calendar feed URL copied.")).toBeInTheDocument();
  });

  it("rotates the token and updates the displayed URL", async () => {
    const { rotateCalendarFeedTokenClient } = require("@/lib/api-client-client");
    rotateCalendarFeedTokenClient.mockResolvedValue({
      feed_path: "/api/bouncer/calendar/feed.ics?token=rotated",
    });

    render(
      <CalendarFeedControls initialFeedPath="/api/bouncer/calendar/feed.ics?token=abc123" />
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /rotate token/i }));

    await waitFor(() => {
      expect(rotateCalendarFeedTokenClient).toHaveBeenCalledTimes(1);
    });

    expect(
      screen.getByDisplayValue(
        "http://localhost:3000/api/bouncer/calendar/feed.ics?token=rotated"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Calendar feed token rotated. Old URL is now invalid.")
    ).toBeInTheDocument();
  });

  it("shows an error when rotate fails", async () => {
    const { rotateCalendarFeedTokenClient } = require("@/lib/api-client-client");
    rotateCalendarFeedTokenClient.mockRejectedValue(new Error("Rotate failed"));

    render(
      <CalendarFeedControls initialFeedPath="/api/bouncer/calendar/feed.ics?token=abc123" />
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: /rotate token/i }));

    expect(await screen.findByText("Rotate failed")).toBeInTheDocument();
  });
});
